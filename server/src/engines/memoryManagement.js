/**
 * Memory Management Simulation Engine
 * Supports: FIRST_FIT, BEST_FIT, WORST_FIT
 * Modes:
 *  - fixed: classic partitioned memory (leftover space inside a block is internal fragmentation)
 *  - variable: dynamic partitioning (allocating splits free space into allocated + free hole)
 */

const VALID_ALGORITHMS = ['FIRST_FIT', 'BEST_FIT', 'WORST_FIT'];

function normalizeBlocks(blocks) {
  if (!Array.isArray(blocks) || blocks.length === 0) {
    throw new Error('At least one memory block is required.');
  }

  return blocks.map((b, idx) => {
    const size = typeof b === 'number' ? b : Number(b?.size);
    if (!Number.isFinite(size) || size <= 0) {
      throw new Error(`Invalid size for memory block #${idx + 1}. Must be > 0.`);
    }
    return {
      id: typeof b === 'object' && b?.id ? String(b.id) : `B${idx + 1}`,
      originalSize: size,
      size,
      allocatedTo: null,
      allocatedSize: 0,
      internalFragmentation: 0
    };
  });
}

function normalizeRequests(requests) {
  if (!Array.isArray(requests) || requests.length === 0) {
    throw new Error('At least one process memory request is required.');
  }

  return requests.map((r, idx) => {
    const pid = typeof r === 'object' && r?.pid ? String(r.pid) : `P${idx + 1}`;
    const size = typeof r === 'number' ? r : Number(r?.size);
    if (!Number.isFinite(size) || size <= 0) {
      throw new Error(`Invalid request size for ${pid}. Must be > 0.`);
    }
    return { pid, size };
  });
}

function pickCandidateIndex(blocks, requestSize, algorithm) {
  const candidates = [];
  blocks.forEach((block, index) => {
    if (block.allocatedTo === null && block.size >= requestSize) {
      candidates.push({ index, size: block.size });
    }
  });

  if (candidates.length === 0) return -1;

  if (algorithm === 'FIRST_FIT') {
    return candidates[0].index;
  }
  if (algorithm === 'BEST_FIT') {
    candidates.sort((a, b) => a.size - b.size || a.index - b.index);
    return candidates[0].index;
  }
  // WORST_FIT
  candidates.sort((a, b) => b.size - a.size || a.index - b.index);
  return candidates[0].index;
}

export function simulateMemoryManagement({
  blocks,
  requests,
  algorithm = 'FIRST_FIT',
  partitionMode = 'fixed'
}) {
  const algo = String(algorithm).toUpperCase();
  if (!VALID_ALGORITHMS.includes(algo)) {
    throw new Error(`Unsupported memory algorithm: ${algorithm}`);
  }

  const mode = partitionMode === 'variable' ? 'variable' : 'fixed';
  let currentBlocks = normalizeBlocks(blocks);
  const reqs = normalizeRequests(requests);

  const allocations = [];
  const steps = [];

  for (const req of reqs) {
    const chosenIdx = pickCandidateIndex(currentBlocks, req.size, algo);
    if (chosenIdx === -1) {
      allocations.push({
        pid: req.pid,
        requestedSize: req.size,
        allocated: false,
        blockId: null,
        internalFragmentation: 0
      });
      steps.push({
        pid: req.pid,
        requestedSize: req.size,
        status: 'FAILED',
        message: `${req.pid} (${req.size} KB) could not be allocated — no free block large enough.`,
        blocksSnapshot: currentBlocks.map((b) => ({ ...b }))
      });
      continue;
    }

    const target = currentBlocks[chosenIdx];

    if (mode === 'fixed') {
      target.allocatedTo = req.pid;
      target.allocatedSize = req.size;
      target.internalFragmentation = target.size - req.size;

      allocations.push({
        pid: req.pid,
        requestedSize: req.size,
        allocated: true,
        blockId: target.id,
        blockSize: target.size,
        internalFragmentation: target.internalFragmentation
      });
    } else {
      const leftover = target.size - req.size;
      const allocatedBlock = {
        id: target.id,
        originalSize: req.size,
        size: req.size,
        allocatedTo: req.pid,
        allocatedSize: req.size,
        internalFragmentation: 0
      };

      const replacement = [allocatedBlock];
      if (leftover > 0) {
        replacement.push({
          id: `${target.id}-hole`,
          originalSize: leftover,
          size: leftover,
          allocatedTo: null,
          allocatedSize: 0,
          internalFragmentation: 0
        });
      }

      currentBlocks.splice(chosenIdx, 1, ...replacement);

      allocations.push({
        pid: req.pid,
        requestedSize: req.size,
        allocated: true,
        blockId: allocatedBlock.id,
        blockSize: req.size,
        internalFragmentation: 0
      });
    }

    steps.push({
      pid: req.pid,
      requestedSize: req.size,
      status: 'ALLOCATED',
      blockId: target.id,
      message: `${req.pid} (${req.size} KB) allocated to block ${target.id} using ${algo.replace('_', ' ')}.`,
      blocksSnapshot: currentBlocks.map((b) => ({ ...b }))
    });
  }

  const totalMemory = currentBlocks.reduce((sum, b) => sum + b.size, 0);
  const usedMemory = currentBlocks.reduce((sum, b) => sum + b.allocatedSize, 0);
  const internalFragmentation = currentBlocks.reduce(
    (sum, b) => sum + b.internalFragmentation,
    0
  );
  const freeMemory = currentBlocks
    .filter((b) => b.allocatedTo === null)
    .reduce((sum, b) => sum + b.size, 0);
  const unallocated = allocations.filter((a) => !a.allocated);

  // External fragmentation occurs when total free memory >= smallest unallocated request, yet none fit contiguously
  const externalFragmentation =
    unallocated.length > 0 && freeMemory >= Math.min(...unallocated.map((u) => u.requestedSize))
      ? freeMemory
      : 0;

  return {
    algorithm: algo,
    partitionMode: mode,
    blocks: currentBlocks,
    allocations,
    unallocated,
    metrics: {
      totalMemory,
      usedMemory,
      freeMemory,
      internalFragmentation,
      externalFragmentation,
      utilizationPercent: totalMemory > 0 ? Number(((usedMemory / totalMemory) * 100).toFixed(2)) : 0,
      allocatedCount: allocations.length - unallocated.length,
      failedCount: unallocated.length
    },
    steps
  };
}

export function compareMemoryAlgorithms({ blocks, requests, partitionMode = 'fixed' }) {
  return VALID_ALGORITHMS.map((algo) => {
    const res = simulateMemoryManagement({ blocks, requests, algorithm: algo, partitionMode });
    return {
      algorithm: algo,
      ...res.metrics
    };
  });
}
