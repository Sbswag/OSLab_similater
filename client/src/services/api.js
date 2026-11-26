import { simulateCpuScheduling, compareCpuAlgorithms } from '@engines/cpuScheduling.js';
import { simulateMemoryManagement, compareMemoryAlgorithms } from '@engines/memoryManagement.js';
import { simulatePageReplacement, comparePageAlgorithms } from '@engines/pageReplacement.js';
import { simulateBankersAlgorithm } from '@engines/deadlockBanker.js';
import { simulateDiskScheduling, compareDiskAlgorithms } from '@engines/diskScheduling.js';
import {
  simulateProducerConsumer,
  simulateDiningPhilosophers
} from '@engines/synchronization.js';

const API_BASE = '/api';

async function requestJson(path, options = {}) {
  const token = localStorage.getItem('oslab_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  const response = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || `Request failed (${response.status})`);
  }
  return data;
}

function runLocalSimulation(module, payload) {
  const compare = Boolean(payload.includeComparison);
  switch (module) {
    case 'cpu':
      return {
        result: simulateCpuScheduling(payload),
        comparison: compare ? compareCpuAlgorithms(payload) : null,
        offlineFallback: true
      };
    case 'memory':
      return {
        result: simulateMemoryManagement(payload),
        comparison: compare ? compareMemoryAlgorithms(payload) : null,
        offlineFallback: true
      };
    case 'page':
      return {
        result: simulatePageReplacement(payload),
        comparison: compare ? comparePageAlgorithms(payload) : null,
        offlineFallback: true
      };
    case 'deadlock':
      return {
        result: simulateBankersAlgorithm(payload),
        comparison: null,
        offlineFallback: true
      };
    case 'disk':
      return {
        result: simulateDiskScheduling(payload),
        comparison: compare ? compareDiskAlgorithms(payload) : null,
        offlineFallback: true
      };
    case 'sync':
      return {
        result:
          String(payload.problem).toUpperCase() === 'DINING_PHILOSOPHERS'
            ? simulateDiningPhilosophers(payload)
            : simulateProducerConsumer(payload),
        comparison: null,
        offlineFallback: true
      };
    default:
      throw new Error(`Unknown module: ${module}`);
  }
}

export const api = {
  health: () => requestJson('/health'),
  register: (body) => requestJson('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body) => requestJson('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  me: (token) =>
    requestJson('/auth/me', {
      headers: { Authorization: `Bearer ${token}` }
    }),
  simulate: async (module, payload) => {
    try {
      return await requestJson(`/simulations/${module}`, {
        method: 'POST',
        body: JSON.stringify(payload)
      });
    } catch (err) {
      // Only fall back to local engine execution if backend server is unreachable
      if (err.message.includes('Failed to fetch') || err.message.includes('500') || err.message.includes('502')) {
        return runLocalSimulation(module, payload);
      }
      throw err;
    }
  },
  getHistory: (moduleFilter = '') =>
    requestJson(`/simulations/history${moduleFilter ? `?module=${moduleFilter}` : ''}`),
  deleteHistory: (id) => requestJson(`/simulations/history/${id}`, { method: 'DELETE' }),
  getLearningContent: () => requestJson('/learning/content'),
  submitQuiz: (body) =>
    requestJson('/learning/quiz', { method: 'POST', body: JSON.stringify(body) }),
  checkPractice: (body) =>
    requestJson('/learning/practice/check', { method: 'POST', body: JSON.stringify(body) }),
  getQuizAttempts: () => requestJson('/learning/attempts')
};
