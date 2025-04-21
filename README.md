Quiz Simulation Project
=======================

About the Project
-----------------
This project allows you to extract questions from exam dump PDFs and simulate a quiz in your browser.

1. Download exam dump files manually in PDF format from https://www.allfreedumps.com/.

2. How to Use:
   - (Optional) Create a Python virtual environment.
   - Install the required packages using: `pip install -r requirements.txt`.
   - Use the Python script to extract and convert the exam data to CSV, JSON, or Excel format.

3. Run the script with:
   `python runner.py <pdf-1> <pdf-2> <pdf-n> --output {csv, json, excel} --outpath <your-output-file-name>`


Running the Simulation
----------------------

Note: The quiz simulation only supports JSON files.

1. Use the Python script to export your exam as a JSON file.

2. To launch the quiz web interface:
   - Navigate to the `quiz-webui` folder.
   - Run `npm install` to install dependencies.
   - Start the server with `node app.js`.
   - Open your browser and go to `http://localhost:3000`.
   - Upload your JSON file.
   - Click "Start" to begin the quiz.

Known Issues or Limitations
---------------------------
1. The PDF parsing in `runner.py` may occasionally miss text, so accuracy is not guaranteed to be 100%.

Tested Environment
------------------
python 3.10.0 & nodejs v20.15.0