import SimulationHistory from '../models/SimulationHistory.js';
import { isDatabaseConnected } from '../config/db.js';
import { memoryStore, createId } from '../utils/memoryStore.js';
import { simulateCpuScheduling, compareCpuAlgorithms } from '../engines/cpuScheduling.js';
import { simulateMemoryManagement, compareMemoryAlgorithms } from '../engines/memoryManagement.js';
import { simulatePageReplacement, comparePageAlgorithms } from '../engines/pageReplacement.js';
import { simulateBankersAlgorithm } from '../engines/deadlockBanker.js';
import { simulateDiskScheduling, compareDiskAlgorithms } from '../engines/diskScheduling.js';
import {
  simulateProducerConsumer,
  simulateDiningPhilosophers
} from '../engines/synchronization.js';

const RUNNERS = {
  cpu: {
    run: (body) => simulateCpuScheduling(body),
    compare: (body) => compareCpuAlgorithms(body),
    summarize: (res) => res.metrics,
    algoName: (body) => String(body.algorithm || 'FCFS').toUpperCase()
  },
  memory: {
    run: (body) => simulateMemoryManagement(body),
    compare: (body) => compareMemoryAlgorithms(body),
    summarize: (res) => res.metrics,
    algoName: (body) => String(body.algorithm || 'FIRST_FIT').toUpperCase()
  },
  page: {
    run: (body) => simulatePageReplacement(body),
    compare: (body) => comparePageAlgorithms(body),
    summarize: (res) => res.metrics,
    algoName: (body) => String(body.algorithm || 'FIFO').toUpperCase()
  },
  deadlock: {
    run: (body) => simulateBankersAlgorithm(body),
    compare: null,
    summarize: (res) => ({
      isSafe: res.isSafe,
      safeSequence: res.safeSequence,
      requestGranted: res.requestResult ? res.requestResult.granted : null
    }),
    algoName: () => 'BANKERS_ALGORITHM'
  },
  disk: {
    run: (body) => simulateDiskScheduling(body),
    compare: (body) => compareDiskAlgorithms(body),
    summarize: (res) => res.metrics,
    algoName: (body) => String(body.algorithm || 'FCFS').toUpperCase()
  },
  sync: {
    run: (body) => {
      const problem = String(body.problem || 'PRODUCER_CONSUMER').toUpperCase();
      if (problem === 'DINING_PHILOSOPHERS') {
        return simulateDiningPhilosophers(body);
      }
      return simulateProducerConsumer(body);
    },
    compare: null,
    summarize: (res) =>
      res.problem === 'DINING_PHILOSOPHERS'
        ? { strategy: res.strategy, deadlockDetected: res.deadlockDetected, eatCounts: res.eatCounts }
        : res.metrics,
    algoName: (body) => String(body.problem || 'PRODUCER_CONSUMER').toUpperCase()
  }
};

async function persistHistory({ userId, module, algorithm, title, input, summary }) {
  if (isDatabaseConnected()) {
    return SimulationHistory.create({ userId, module, algorithm, title, input, summary });
  }
  const entry = {
    _id: createId(),
    userId,
    module,
    algorithm,
    title,
    input,
    summary,
    createdAt: new Date().toISOString()
  };
  memoryStore.simulations.unshift(entry);
  return entry;
}

export async function runSimulation(req, res) {
  const { module } = req.params;
  const runner = RUNNERS[module];
  if (!runner) {
    return res.status(404).json({ error: `Unknown simulation module: ${module}` });
  }

  try {
    const body = req.body || {};
    const result = runner.run(body);
    const comparison = body.includeComparison && runner.compare ? runner.compare(body) : null;

    let savedRecord = null;
    if (body.save && req.user) {
      savedRecord = await persistHistory({
        userId: req.user.id,
        module,
        algorithm: runner.algoName(body),
        title: body.title || `${module.toUpperCase()} - ${runner.algoName(body)}`,
        input: body,
        summary: runner.summarize(result)
      });
    }

    return res.json({ result, comparison, savedRecord });
  } catch (err) {
    return res.status(400).json({ error: err.message || 'Simulation failed.' });
  }
}

export async function getSimulationHistory(req, res) {
  try {
    const filterModule = req.query.module;
    if (isDatabaseConnected()) {
      const query = { userId: req.user.id };
      if (filterModule) query.module = filterModule;
      const items = await SimulationHistory.find(query).sort({ createdAt: -1 }).limit(50);
      return res.json({ items, storage: 'mongodb' });
    }

    const items = memoryStore.simulations
      .filter((s) => s.userId === req.user.id && (!filterModule || s.module === filterModule))
      .slice(0, 50);
    return res.json({ items, storage: 'memory-fallback' });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed to load history.' });
  }
}

export async function deleteSimulationHistory(req, res) {
  try {
    const { id } = req.params;
    if (isDatabaseConnected()) {
      const deleted = await SimulationHistory.findOneAndDelete({ _id: id, userId: req.user.id });
      if (!deleted) return res.status(404).json({ error: 'History item not found.' });
      return res.json({ deleted: true, id });
    }

    const idx = memoryStore.simulations.findIndex((s) => s._id === id && s.userId === req.user.id);
    if (idx === -1) return res.status(404).json({ error: 'History item not found.' });
    memoryStore.simulations.splice(idx, 1);
    return res.json({ deleted: true, id });
  } catch (err) {
    return res.status(500).json({ error: err.message || 'Failed to delete history item.' });
  }
}
