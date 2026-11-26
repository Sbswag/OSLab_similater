/**
 * Zero-config built-in JSON storage for standalone mode (no external database needed).
 * Automatically persists users, saved simulations, and quiz attempts to server/data/store.json.
 */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.resolve(__dirname, '../../data');
const storeFile = path.join(dataDir, 'store.json');

const isTestEnv = process.env.NODE_ENV === 'test' || process.argv.some((a) => a.includes('test'));

function loadInitialStore() {
  const empty = { users: [], simulations: [], quizAttempts: [] };
  if (isTestEnv) return empty;
  try {
    if (fs.existsSync(storeFile)) {
      const parsed = JSON.parse(fs.readFileSync(storeFile, 'utf-8'));
      return {
        users: Array.isArray(parsed.users) ? parsed.users : [],
        simulations: Array.isArray(parsed.simulations) ? parsed.simulations : [],
        quizAttempts: Array.isArray(parsed.quizAttempts) ? parsed.quizAttempts : []
      };
    }
  } catch {
    // Ignore corrupt store file and start fresh
  }
  return empty;
}

const rawStore = loadInitialStore();

function persistStore() {
  if (isTestEnv) return;
  try {
    fs.mkdirSync(dataDir, { recursive: true });
    fs.writeFileSync(storeFile, JSON.stringify(rawStore, null, 2), 'utf-8');
  } catch (err) {
    console.warn('[Storage] Failed to write local store:', err.message);
  }
}

function wrapArray(arr) {
  return new Proxy(arr, {
    get(target, prop) {
      const value = target[prop];
      if (['push', 'pop', 'shift', 'unshift', 'splice'].includes(prop)) {
        return (...args) => {
          const result = Array.prototype[prop].apply(target, args);
          persistStore();
          return result;
        };
      }
      return typeof value === 'function' ? value.bind(target) : value;
    }
  });
}

export const memoryStore = {
  users: wrapArray(rawStore.users),
  simulations: wrapArray(rawStore.simulations),
  quizAttempts: wrapArray(rawStore.quizAttempts)
};

export function createId() {
  return crypto.randomBytes(12).toString('hex');
}
