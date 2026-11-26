import { Router } from 'express';
import {
  runSimulation,
  getSimulationHistory,
  deleteSimulationHistory
} from '../controllers/simulationController.js';
import { optionalAuth, requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/history', requireAuth, getSimulationHistory);
router.delete('/history/:id', requireAuth, deleteSimulationHistory);
router.post('/:module', optionalAuth, runSimulation);

export default router;
