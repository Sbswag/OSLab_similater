import { Router } from 'express';
import {
  getLearningContent,
  submitQuiz,
  checkPracticeAnswer,
  getQuizAttempts
} from '../controllers/learningController.js';
import { optionalAuth, requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/content', getLearningContent);
router.post('/quiz', optionalAuth, submitQuiz);
router.post('/practice/check', checkPracticeAnswer);
router.get('/attempts', requireAuth, getQuizAttempts);

export default router;
