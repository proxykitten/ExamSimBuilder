const express = require('express');
const shuffle = require('shuffle-array');
const path = require('path');
const fs = require('fs');
const session = require('express-session');
const multer = require('multer');
const { formatQuestion, formatResult } = require('./quizFormatter');

const app = express();
app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' });

// Use express-session to manage user sessions
app.use(session({
  secret: 'quiz-app-secret',
  resave: false,
  saveUninitialized: true
}));

// Serve the homepage
app.get('/', (req, res) => {
  res.render('index');
});

// Serve the file upload page
app.get('/upload', (req, res) => {
  res.render('upload');
});

// Handle file upload
app.post('/upload', upload.single('questionsFile'), (req, res) => {
  if (!req.file) {
    return res.send('No file uploaded.');
  }

  // Read the uploaded JSON file
  fs.readFile(req.file.path, 'utf8', (err, data) => {
    if (err) {
      return res.status(500).send('Error reading file.');
    }

    try {
      const questions = JSON.parse(data); // Parse the JSON data
      shuffle(questions); // Shuffle questions

      // Store questions in the session
      req.session.questions = questions;
      req.session.questionIndex = 0;
      req.session.score = 0;
      req.session.answeredQuestions = [];

      // Redirect to the quiz page
      res.redirect('/quiz');
    } catch (error) {
      return res.status(500).send('Invalid JSON format.');
    }
  });
});

// Serve the quiz page with a specific question
app.get('/quiz', (req, res) => {
  const questions = req.session.questions;
  if (!questions || req.session.questionIndex >= questions.length) {
    return res.redirect('/finish'); // If there are no questions or we've finished
  }

  const currentQuestion = questions[req.session.questionIndex];
  const formattedQuestion = formatQuestion(currentQuestion);

  res.render('quiz', {
    question: formattedQuestion,
    questionIndex: req.session.questionIndex,
    totalQuestions: questions.length
  });
});

// Handle question submission
app.post('/quiz', (req, res) => {
  const userAnswer = req.body.answer;
  const questions = req.session.questions;
  const currentQuestion = questions[req.session.questionIndex];

  const isCorrect = userAnswer === currentQuestion.answer;
  if (isCorrect) req.session.score++;

  // Store the result of the answered question
  req.session.answeredQuestions.push({
    question: currentQuestion.question,
    userAnswer,
    isCorrect,
    correctAnswer: currentQuestion.answer,
    explanation: currentQuestion.explanation || "No explanation provided."
  });

  // Move to the next question
  req.session.questionIndex++;

  // Check if there are more questions
  if (req.session.questionIndex < questions.length) {
    res.redirect('/quiz');
  } else {
    // End of quiz, show results
    const formattedResults = formatResult(req.session.answeredQuestions);
    const percentage = (req.session.score / questions.length) * 100;
    res.render('result', {
      score: req.session.score,
      percentage,
      answeredQuestions: formattedResults,
      totalQuestions: questions.length
    });

    // Reset session after the quiz is completed
    req.session.destroy();
  }
});

// Finish anytime button (show the result)
// Handle the result after the quiz is finished or when the user finishes early
app.get('/finish', (req, res) => {
  const questions = req.session.questions;
  if (req.session && req.session.questionIndex > 0) {
    // Calculate the number of answered questions
    const answeredQuestionsCount = req.session.answeredQuestions.length;
    const correctAnswersCount = req.session.score;

    // Display results
    const percentage = (correctAnswersCount / answeredQuestionsCount) * 100;
    res.render('result', {
      score: `${correctAnswersCount} / ${answeredQuestionsCount}`,
      percentage: percentage.toFixed(2),
      answeredQuestions: req.session.answeredQuestions,
      totalQuestions: questions.length
    });

    // Reset session after showing the results
    req.session.destroy();
  } else {
    req.session.destroy((err) => {
      if (err) {
        console.error("Error destroying session:", err);
      }
      res.redirect('/');
    });
  }
});


// Start the server
app.listen(3000, () => {
  console.log('Server is running on http://localhost:3000');
});
