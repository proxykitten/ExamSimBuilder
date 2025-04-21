function formatQuestion(question) {
    return {
      questionText: question.question,
      options: formatOptions(question.options)
    };
  }
  
  function formatOptions(options) {
    const formattedOptions = [];
    for (let key in options) {
      formattedOptions.push({
        optionKey: key,
        optionText: options[key]
      });
    }
    return formattedOptions;
  }
  
  function formatResult(answeredQuestions) {
    return answeredQuestions.map((q) => {
      return {
        question: q.question,
        userAnswer: q.userAnswer,
        isCorrect: q.isCorrect,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation
      };
    });
  }
  
  module.exports = { formatQuestion, formatResult };
  