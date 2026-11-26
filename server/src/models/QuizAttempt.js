import mongoose from 'mongoose';

const quizAttemptSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    module: {
      type: String,
      required: true
    },
    score: {
      type: Number,
      required: true,
      min: 0
    },
    total: {
      type: Number,
      required: true,
      min: 1
    },
    percentage: {
      type: Number,
      required: true,
      min: 0,
      max: 100
    },
    details: [
      {
        questionId: String,
        selectedIndex: Number,
        correctIndex: Number,
        isCorrect: Boolean
      }
    ]
  },
  { timestamps: true }
);

const QuizAttempt = mongoose.model('QuizAttempt', quizAttemptSchema);
export default QuizAttempt;
