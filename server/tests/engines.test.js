import test from 'node:test';
import assert from 'node:assert/strict';

import { simulateCpuScheduling, compareCpuAlgorithms } from '../src/engines/cpuScheduling.js';
import { simulateMemoryManagement, compareMemoryAlgorithms } from '../src/engines/memoryManagement.js';
import { simulatePageReplacement, comparePageAlgorithms } from '../src/engines/pageReplacement.js';
import { simulateBankersAlgorithm } from '../src/engines/deadlockBanker.js';
import { simulateDiskScheduling, compareDiskAlgorithms } from '../src/engines/diskScheduling.js';
import {
  simulateProducerConsumer,
  simulateDiningPhilosophers
} from '../src/engines/synchronization.js';

test('CPU Scheduling: FCFS, SJF, SRTF, Priority, and Round Robin', () => {
  const processes = [
    { pid: 'P1', arrivalTime: 0, burstTime: 6, priority: 2 },
    { pid: 'P2', arrivalTime: 1, burstTime: 4, priority: 1 },
    { pid: 'P3', arrivalTime: 2, burstTime: 2, priority: 3 }
  ];

  const fcfs = simulateCpuScheduling({ processes, algorithm: 'FCFS' });
  assert.deepEqual(
    fcfs.gantt.map((g) => g.pid),
    ['P1', 'P2', 'P3']
  );
  assert.equal(fcfs.metrics.totalTime, 12);
  assert.equal(fcfs.metrics.avgTurnaroundTime, 8.33);

  const sjf = simulateCpuScheduling({ processes, algorithm: 'SJF' });
  // P1 runs 0..6, then P3 (burst 2) runs 6..8, then P2 (burst 4) runs 8..12
  assert.deepEqual(
    sjf.gantt.map((g) => g.pid),
    ['P1', 'P3', 'P2']
  );

  const srtf = simulateCpuScheduling({ processes, algorithm: 'SRTF' });
  // t=0..1 P1(rem 5); t=1..2 P2(rem 3); t=2..4 P3(rem 0); t=4..7 P2(rem 0); t=7..12 P1(rem 0)
  assert.deepEqual(
    srtf.gantt.map((g) => `${g.pid}:${g.start}-${g.end}`),
    ['P1:0-1', 'P2:1-2', 'P3:2-4', 'P2:4-7', 'P1:7-12']
  );

  const priority = simulateCpuScheduling({
    processes,
    algorithm: 'PRIORITY',
    preemptive: false
  });
  assert.deepEqual(
    priority.gantt.map((g) => g.pid),
    ['P1', 'P2', 'P3']
  );

  const rr = simulateCpuScheduling({ processes, algorithm: 'RR', timeQuantum: 2 });
  assert.equal(rr.metrics.totalTime, 12);
  assert.ok(rr.gantt.length >= 5);

  const comparison = compareCpuAlgorithms({ processes, timeQuantum: 2 });
  assert.equal(comparison.length, 5);
});

test('Memory Management: First Fit, Best Fit, Worst Fit', () => {
  const blocks = [100, 500, 200, 300, 600];
  const requests = [
    { pid: 'P1', size: 212 },
    { pid: 'P2', size: 417 },
    { pid: 'P3', size: 112 },
    { pid: 'P4', size: 426 }
  ];

  const firstFit = simulateMemoryManagement({ blocks, requests, algorithm: 'FIRST_FIT' });
  // Classic textbook result: P4 (426) fails in First Fit!
  assert.equal(firstFit.metrics.allocatedCount, 3);
  assert.equal(firstFit.metrics.failedCount, 1);

  const bestFit = simulateMemoryManagement({ blocks, requests, algorithm: 'BEST_FIT' });
  // Classic textbook result: all 4 allocated in Best Fit!
  assert.equal(bestFit.metrics.allocatedCount, 4);
  assert.equal(bestFit.metrics.failedCount, 0);

  const worstFit = simulateMemoryManagement({ blocks, requests, algorithm: 'WORST_FIT' });
  assert.equal(worstFit.metrics.allocatedCount, 3);
  assert.equal(worstFit.metrics.failedCount, 1);

  const cmp = compareMemoryAlgorithms({ blocks, requests });
  assert.equal(cmp.length, 3);
});

test('Page Replacement: FIFO, LRU, Optimal', () => {
  const referenceString = [7, 0, 1, 2, 0, 3, 0, 4, 2, 3, 0, 3, 2];
  const frameCount = 3;

  const fifo = simulatePageReplacement({ referenceString, frameCount, algorithm: 'FIFO' });
  const lru = simulatePageReplacement({ referenceString, frameCount, algorithm: 'LRU' });
  const optimal = simulatePageReplacement({ referenceString, frameCount, algorithm: 'OPTIMAL' });

  assert.equal(fifo.metrics.pageFaults, 10);
  assert.equal(lru.metrics.pageFaults, 9);
  assert.equal(optimal.metrics.pageFaults, 7);
  assert.equal(optimal.metrics.pageHits, 6);

  const cmp = comparePageAlgorithms({ referenceString, frameCount });
  assert.equal(cmp.length, 3);
});

test("Deadlock Management: Banker's Algorithm safe & unsafe states + resource request", () => {
  const allocation = [
    [0, 1, 0],
    [2, 0, 0],
    [3, 0, 2],
    [2, 1, 1],
    [0, 0, 2]
  ];
  const max = [
    [7, 5, 3],
    [3, 2, 2],
    [9, 0, 2],
    [2, 2, 2],
    [4, 3, 3]
  ];
  const available = [3, 3, 2];

  const safeRes = simulateBankersAlgorithm({
    allocation,
    max,
    available,
    request: { processIndex: 1, resources: [1, 0, 2] }
  });

  assert.equal(safeRes.isSafe, true);
  assert.deepEqual(safeRes.safeSequence, ['P1', 'P3', 'P4', 'P0', 'P2']);
  assert.equal(safeRes.requestResult.granted, true);

  // Unsafe state test
  const unsafeRes = simulateBankersAlgorithm({
    allocation: [
      [1, 0],
      [0, 1]
    ],
    max: [
      [3, 2],
      [2, 3]
    ],
    available: [0, 0]
  });
  assert.equal(unsafeRes.isSafe, false);
  assert.equal(unsafeRes.unfinished.length, 2);
});

test('Disk Scheduling: FCFS, SSTF, SCAN, C-SCAN', () => {
  const requests = [98, 183, 37, 122, 14, 124, 65, 67];
  const head = 53;
  const diskSize = 200;

  const fcfs = simulateDiskScheduling({ requests, head, diskSize, algorithm: 'FCFS' });
  assert.equal(fcfs.metrics.totalSeekTime, 640);

  const sstf = simulateDiskScheduling({ requests, head, diskSize, algorithm: 'SSTF' });
  assert.equal(sstf.metrics.totalSeekTime, 236);

  const scanUp = simulateDiskScheduling({
    requests,
    head,
    diskSize,
    algorithm: 'SCAN',
    direction: 'up'
  });
  assert.equal(scanUp.metrics.totalSeekTime, 331);

  const cscanUp = simulateDiskScheduling({
    requests,
    head,
    diskSize,
    algorithm: 'C-SCAN',
    direction: 'up'
  });
  assert.equal(cscanUp.metrics.totalSeekTime, 382);

  const cmp = compareDiskAlgorithms({ requests, head, diskSize, direction: 'up' });
  assert.equal(cmp.length, 4);
});

test('Process Synchronization: Producer-Consumer and Dining Philosophers', () => {
  const pc = simulateProducerConsumer({
    bufferSize: 2,
    actions: ['PRODUCE', 'PRODUCE', 'PRODUCE', 'CONSUME', 'CONSUME', 'CONSUME']
  });
  assert.equal(pc.metrics.producedCount, 2);
  assert.equal(pc.metrics.blockedProducers, 1);
  assert.equal(pc.metrics.consumedCount, 2);
  assert.equal(pc.metrics.blockedConsumers, 1);
  assert.deepEqual(pc.finalSemaphores, { mutex: 1, empty: 2, full: 0 });

  const dpNaive = simulateDiningPhilosophers({ philosopherCount: 5, strategy: 'naive' });
  assert.equal(dpNaive.deadlockDetected, true);

  const dpAsym = simulateDiningPhilosophers({
    philosopherCount: 5,
    strategy: 'asymmetric',
    rounds: 5
  });
  assert.equal(dpAsym.deadlockDetected, false);
  assert.ok(dpAsym.eatCounts.reduce((a, b) => a + b, 0) > 0);
});
