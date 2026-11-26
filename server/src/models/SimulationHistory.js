import mongoose from 'mongoose';

const simulationHistorySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    module: {
      type: String,
      required: true,
      enum: ['cpu', 'memory', 'page', 'deadlock', 'disk', 'sync']
    },
    algorithm: {
      type: String,
      required: true
    },
    title: {
      type: String,
      default: ''
    },
    input: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    },
    summary: {
      type: mongoose.Schema.Types.Mixed,
      required: true
    }
  },
  { timestamps: true }
);

const SimulationHistory = mongoose.model('SimulationHistory', simulationHistorySchema);
export default SimulationHistory;
