import QuizAttempt from '../models/QuizAttempt.js';
import { isDatabaseConnected } from '../config/db.js';
import { memoryStore, createId } from '../utils/memoryStore.js';
import {
  LEARNING_MODULES,
  QUIZ_QUESTIONS,
  PRACTICE_PROBLEMS
} from '../data/learningContent.js';

export function getLearningContent(_req, res) {
  const safeQuizQuestions = QUIZ_QUESTIONS.map(({ correctIndex, explanation, ...q }) => q);
  const safePractice = PRACTICE_PROBLEMS.map(({ expectedAnswer, solution, ...p }) => p);

  return res.json({
    modules: LEARNING_MODULES,
    quizzes: safeQuizQuestions,
    practiceProblems: safePractice
  });
}

export async function submitQuiz(req, res) {
  try {
    const { module = 'all', answers = {} } = req.body || {};
    const targetQuestions =
      module === 'all'
        ? QUIZ_QUESTIONS
        : QUIZ_QUESTIONS.filter((q) => q.module === module);

    if (targetQuestions.length === 0) {
      return res.status(400).json({ error: `No quiz questions found for module "${module}".` });
    }

    let score = 0;
    const details = targetQuestions.map((q) => {
      const selectedIndex = answers[q.id] !== undefined ? Number(answers[q.id]) : -1;
      const isCorrect = selectedIndex === q.correctIndex;
      if (isCorrect) score++;
      return {
        questionId: q.id,
        question: q.question,
        selectedIndex,
        correctIndex: q.correctIndex,
        isCorrect,
        explanation: q.explanation
      };
    });

    const total = targetQuestions.length;
    const percentage = Math.round((score / total) * 100);

    let savedAttempt = null;
    if (req.user) {
      if (isDatabaseConnected()) {
        savedAttempt = await QuizAttempt.create({
          userId: req.user.id,
          module,
          score,
          total,
          percentage,
          details: details.map(({ questionId, selectedIndex, correctIndex, isCorrect }) => ({
            questionId,
            selectedIndex,
            correctIndex,
            isCorrect
          }))
        });
      } else {
        savedAttempt = {
          _id: createId(),
          userId: req.user.id,
          module,
          score,
          total,
          percentage,
          createdAt: new Date().toISOString()
        };
        memoryStore.quizAttempts.unshift(savedAttempt);
      }
    }

    return res.json({
      module,
      score,
      total,
      percentage,
      details,
      savedAttempt
    });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Quiz grading failed.' });
  }
}

export function checkPracticeAnswer(req, res) {
  const { problemId, answer } = req.body || {};
  const problem = PRACTICE_PROBLEMS.find((p) => p.id === problemId);
  if (!problem) {
    return res.status(404).json({ error: 'Practice problem not found.' });
  }

  const submitted = String(answer ?? '').trim();
  if (!submitted) {
    return res.status(400).json({ error: 'Please enter an answer before checking.' });
  }

  let isCorrect = false;
  if (problem.tolerance > 0 || !Number.isNaN(Number(problem.expectedAnswer))) {
    const numSub = Number(submitted);
    const numExp = Number(problem.expectedAnswer);
    isCorrect = Number.isFinite(numSub) && Math.abs(numSub - numExp) <= (problem.tolerance || 0);
  } else {
    isCorrect = submitted.toUpperCase() === problem.expectedAnswer.toUpperCase();
  }

  return res.json({
    problemId: problem.id,
    isCorrect,
    expectedAnswer: problem.expectedAnswer,
    solution: problem.solution
  });
}

export async function getQuizAttempts(req, res) {
  try {
    if (isDatabaseConnected()) {
      const items = await QuizAttempt.find({ userId: req.user.id }).sort({ createdAt: -1 }).limit(30);
      return res.json({ items, storage: 'mongodb' });
    }
    const items = memoryStore.quizAttempts.filter((a) => a.userId === req.user.id).slice(0, 30);
    return res.json({ items, storage: 'memory-fallback' });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed to load quiz attempts.' });
  }
}
