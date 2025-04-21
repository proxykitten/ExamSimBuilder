import argparse
import re
import json
import csv
import pandas as pd
from pathlib import Path
from PyPDF2 import PdfReader

def extract_qa_from_pdf(pdf_path):
    reader = PdfReader(pdf_path)
    text = "\n".join(page.extract_text() for page in reader.pages)

    pattern = re.compile(
        r"NEW QUESTION\s+\d+.*?\n(.*?)(?=\nA\.)"                # get question
        r"\n(A\..*?)\nAnswer:\s+([A-Z]+)"                       # Options and Answer
        r"(?:\nExplanation:\s*(.*?))?(?=\nNEW QUESTION|\Z)",    # Explanation
        re.DOTALL
    )

    matches = pattern.findall(text)
    results = []

    for question, options, answer, explanation in matches:
        option_lines = re.findall(r"[A-D]\. .*", options)
        result = {
            "question": question.strip(),
            "options": {opt[0]: opt[3:].strip() for opt in option_lines},
            "answer": answer.strip(),
            "explanation": explanation.strip() if explanation else "",
            "source": Path(pdf_path).name
        }
        results.append(result)

    return results

def deduplicate_questions(data):
    seen = set()
    unique_data = []
    for item in data:
        q_text = item["question"].strip()
        if q_text not in seen:
            seen.add(q_text)
            unique_data.append(item)
    return unique_data

def save_to_csv(data, filename):
    rows = []
    for item in data:
        row = {
            "number": item["number"],
            "source": item["source"],
            "question": item["question"],
            "answer": item["answer"],
            "explanation": item["explanation"],
            **{f"option_{k}": v for k, v in item["options"].items()}
        }
        rows.append(row)
    keys = rows[0].keys()
    with open(filename, "w", newline='', encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=keys)
        writer.writeheader()
        writer.writerows(rows)

def save_to_json(data, filename):
    with open(filename, "w", encoding="utf-8") as f:
        json.dump(data, f, indent=2, ensure_ascii=False)

def save_to_excel(data, filename):
    df = pd.DataFrame([{
        "number": item["number"],
        "source": item["source"],
        "question": item["question"],
        "answer": item["answer"],
        "explanation": item["explanation"],
        **{f"option_{k}": v for k, v in item["options"].items()}
    } for item in data])
    df.to_excel(filename, index=False)

def main():
    parser = argparse.ArgumentParser(description="Extract Q&A from multiple PDFs")
    parser.add_argument("pdf_paths", type=str, nargs="+", help="Paths to input PDF files")
    parser.add_argument("--output", type=str, choices=["csv", "json", "excel"], required=True, help="Output format")
    parser.add_argument("--outpath", type=str, default="output", help="Output filename without extension")
    args = parser.parse_args()

    all_data = []
    for path in args.pdf_paths:
        print(f"📄 Processing: {path}")
        all_data.extend(extract_qa_from_pdf(path))

    print(f"🔍 Total questions before deduplication: {len(all_data)}")
    all_data = deduplicate_questions(all_data)
    print(f"✅ Unique questions after deduplication: {len(all_data)}")

    # Add question numbering
    for i, item in enumerate(all_data, 1):
        item["number"] = i

    if not all_data:
        print("⚠️ No questions found in any PDF.")
        return

    ext_map = {"csv": "csv", "json": "json", "excel": "xlsx"}
    out_file = f"{args.outpath}.{ext_map[args.output]}"

    if args.output == "csv":
        save_to_csv(all_data, out_file)
    elif args.output == "json":
        save_to_json(all_data, out_file)
    elif args.output == "excel":
        save_to_excel(all_data, out_file)

    print(f"📁 Done! Saved {len(all_data)} questions to: {out_file}")

if __name__ == "__main__":
    main()
