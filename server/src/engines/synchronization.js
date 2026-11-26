/**
 * Process Synchronization Simulation Engine
 * Supports:
 *  - Producer-Consumer (Bounded Buffer with mutex, empty, full semaphores)
 *  - Dining Philosophers (Naive deadlock-prone vs Asymmetric / Waiter deadlock-free strategies)
 */

export function simulateProducerConsumer({
  bufferSize = 5,
  actions = ['PRODUCE', 'PRODUCE', 'CONSUME', 'PRODUCE', 'PRODUCE', 'PRODUCE', 'PRODUCE', 'CONSUME', 'CONSUME']
}) {
  const capacity = Number(bufferSize);
  if (!Number.isInteger(capacity) || capacity < 1 || capacity > 12) {
    throw new Error('Buffer size must be an integer between 1 and 12.');
  }
  if (!Array.isArray(actions) || actions.length === 0) {
    throw new Error('At least one synchronization action is required.');
  }

  const buffer = [];
  let empty = capacity;
  let full = 0;
  let mutex = 1;
  let itemCounter = 1;
  let producedCount = 0;
  let consumedCount = 0;
  let blockedProducers = 0;
  let blockedConsumers = 0;

  const trace = [];

  actions.forEach((rawAction, idx) => {
    const action = String(rawAction).toUpperCase();
    const stepNum = idx + 1;

    if (action === 'PRODUCE') {
      if (empty === 0) {
        blockedProducers++;
        trace.push({
          step: stepNum,
          action: 'PRODUCE',
          status: 'BLOCKED',
          item: null,
          semaphores: { mutex, empty, full },
          buffer: [...buffer],
          message: `Producer blocked: wait(empty) failed (buffer FULL at ${capacity}/${capacity}).`
        });
        return;
      }

      empty--;
      mutex = 0;
      const item = `Item-${itemCounter++}`;
      buffer.push(item);
      producedCount++;
      mutex = 1;
      full++;

      trace.push({
        step: stepNum,
        action: 'PRODUCE',
        status: 'SUCCESS',
        item,
        semaphores: { mutex, empty, full },
        buffer: [...buffer],
        message: `Producer acquired mutex, inserted ${item}, signaled(full=${full}, empty=${empty}).`
      });
    } else if (action === 'CONSUME') {
      if (full === 0) {
        blockedConsumers++;
        trace.push({
          step: stepNum,
          action: 'CONSUME',
          status: 'BLOCKED',
          item: null,
          semaphores: { mutex, empty, full },
          buffer: [...buffer],
          message: `Consumer blocked: wait(full) failed (buffer EMPTY 0/${capacity}).`
        });
        return;
      }

      full--;
      mutex = 0;
      const item = buffer.shift();
      consumedCount++;
      mutex = 1;
      empty++;

      trace.push({
        step: stepNum,
        action: 'CONSUME',
        status: 'SUCCESS',
        item,
        semaphores: { mutex, empty, full },
        buffer: [...buffer],
        message: `Consumer acquired mutex, removed ${item}, signaled(empty=${empty}, full=${full}).`
      });
    } else {
      throw new Error(`Invalid Producer-Consumer action: "${rawAction}". Use PRODUCE or CONSUME.`);
    }
  });

  return {
    problem: 'PRODUCER_CONSUMER',
    bufferSize: capacity,
    finalBuffer: buffer,
    finalSemaphores: { mutex, empty, full },
    metrics: {
      totalActions: actions.length,
      producedCount,
      consumedCount,
      blockedProducers,
      blockedConsumers
    },
    trace
  };
}

export function simulateDiningPhilosophers({
  philosopherCount = 5,
  strategy = 'asymmetric',
  rounds = 6
}) {
  const n = Number(philosopherCount);
  if (!Number.isInteger(n) || n < 3 || n > 8) {
    throw new Error('Philosopher count must be an integer between 3 and 8.');
  }
  const strat = String(strategy).toLowerCase();
  if (!['naive', 'asymmetric', 'waiter'].includes(strat)) {
    throw new Error('Strategy must be one of: naive, asymmetric, waiter.');
  }

  const totalRounds = Math.min(Math.max(Number(rounds) || 6, 1), 20);
  const states = new Array(n).fill('THINKING');
  const forks = new Array(n).fill(null); // null = free, or philosopher index
  const eatCounts = new Array(n).fill(0);
  const trace = [];
  let deadlockDetected = false;

  const snapshot = (round, event) => {
    trace.push({
      round,
      event,
      states: [...states],
      forks: [...forks],
      eatCounts: [...eatCounts],
      deadlockDetected
    });
  };

  if (strat === 'naive') {
    // Round 1: All philosophers become HUNGRY and pick up their LEFT fork simultaneously -> Circular Wait Deadlock!
    for (let i = 0; i < n; i++) {
      states[i] = 'HUNGRY';
      forks[i] = i;
    }
    snapshot(1, 'All philosophers became HUNGRY and acquired their LEFT fork simultaneously.');
    deadlockDetected = forks.every((owner) => owner !== null) && states.every((s) => s === 'HUNGRY');
    snapshot(
      2,
      'DEADLOCK DETECTED: Every philosopher holds their left fork and waits indefinitely for their right fork (Circular Wait).'
    );

    return {
      problem: 'DINING_PHILOSOPHERS',
      philosopherCount: n,
      strategy: strat,
      deadlockDetected,
      finalStates: states,
      finalForks: forks,
      eatCounts,
      trace
    };
  }

  // Deadlock-free strategies: asymmetric or waiter
  for (let r = 1; r <= totalRounds; r++) {
    // Release forks from philosophers who were eating in the previous round
    for (let i = 0; i < n; i++) {
      if (states[i] === 'EATING') {
        const left = i;
        const right = (i + 1) % n;
        forks[left] = null;
        forks[right] = null;
        states[i] = 'THINKING';
      }
    }

    const activeEaters = [];
    let waiterPermits = n - 1;

    // Rotate starting philosopher each round for fairness
    const startIdx = (r - 1) % n;
    for (let offset = 0; offset < n; offset++) {
      const i = (startIdx + offset) % n;
      const left = i;
      const right = (i + 1) % n;

      states[i] = 'HUNGRY';

      if (strat === 'waiter' && waiterPermits <= 0) {
        continue;
      }

      const firstFork = strat === 'asymmetric' && i % 2 === 1 ? right : left;
      const secondFork = firstFork === left ? right : left;

      if (forks[firstFork] === null && forks[secondFork] === null) {
        forks[firstFork] = i;
        forks[secondFork] = i;
        states[i] = 'EATING';
        eatCounts[i]++;
        if (strat === 'waiter') waiterPermits--;
        activeEaters.push(`P${i}`);
      }
    }

    snapshot(
      r,
      `Round ${r}: ${activeEaters.length > 0 ? activeEaters.join(', ') : 'None'} acquired both forks and are EATING; others THINK/WAIT.`
    );
  }

  return {
    problem: 'DINING_PHILOSOPHERS',
    philosopherCount: n,
    strategy: strat,
    deadlockDetected: false,
    finalStates: states,
    finalForks: forks,
    eatCounts,
    trace
  };
}
