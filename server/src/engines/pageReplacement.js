/**
 * Page Replacement Simulation Engine
 * Supports: FIFO, LRU, OPTIMAL
 */

const VALID_ALGORITHMS = ['FIFO', 'LRU', 'OPTIMAL'];

function normalizeReferences(referenceString) {
  if (!Array.isArray(referenceString) || referenceString.length === 0) {
    throw new Error('Reference string must be a non-empty array of page numbers.');
  }
  return referenceString.map((val, idx) => {
    const num = Number(val);
    if (!Number.isInteger(num) || num < 0) {
      throw new Error(`Invalid page number at index ${idx}: "${val}". Must be a non-negative integer.`);
    }
    return num;
  });
}

export function simulatePageReplacement({
  referenceString,
  frameCount = 3,
  algorithm = 'FIFO'
}) {
  const algo = String(algorithm).toUpperCase();
  if (!VALID_ALGORITHMS.includes(algo)) {
    throw new Error(`Unsupported page replacement algorithm: ${algorithm}`);
  }

  const capacity = Number(frameCount);
  if (!Number.isInteger(capacity) || capacity <= 0 || capacity > 16) {
    throw new Error('Frame count must be an integer between 1 and 16.');
  }

  const refs = normalizeReferences(referenceString);
  const frames = new Array(capacity).fill(null);
  const fifoQueue = [];
  const lastUsed = new Map();

  let pageFaults = 0;
  let pageHits = 0;
  const steps = [];

  for (let i = 0; i < refs.length; i++) {
    const page = refs[i];
    const existingIdx = frames.indexOf(page);

    if (existingIdx !== -1) {
      pageHits++;
      lastUsed.set(page, i);
      steps.push({
        step: i + 1,
        page,
        frames: [...frames],
        hit: true,
        fault: false,
        replacedPage: null,
        explanation: `Page ${page} is already in Frame ${existingIdx + 1} (Page Hit).`
      });
      continue;
    }

    pageFaults++;
    let replacedPage = null;
    const emptyIdx = frames.indexOf(null);

    if (emptyIdx !== -1) {
      frames[emptyIdx] = page;
      fifoQueue.push(page);
      lastUsed.set(page, i);
      steps.push({
        step: i + 1,
        page,
        frames: [...frames],
        hit: false,
        fault: true,
        replacedPage: null,
        explanation: `Page ${page} loaded into empty Frame ${emptyIdx + 1} (Page Fault).`
      });
      continue;
    }

    let victimIdx = 0;
    let reason = '';

    if (algo === 'FIFO') {
      const oldestPage = fifoQueue.shift();
      victimIdx = frames.indexOf(oldestPage);
      replacedPage = oldestPage;
      fifoQueue.push(page);
      reason = `replaced oldest loaded page ${replacedPage} (FIFO)`;
    } else if (algo === 'LRU') {
      let minStep = Infinity;
      frames.forEach((fPage, idx) => {
        const usedAt = lastUsed.get(fPage) ?? -1;
        if (usedAt < minStep) {
          minStep = usedAt;
          victimIdx = idx;
        }
      });
      replacedPage = frames[victimIdx];
      reason = `replaced least recently used page ${replacedPage} (last used at step ${minStep + 1})`;
    } else {
      // OPTIMAL: replace page not used for the longest period of time in the future
      let farthestNextUse = -1;
      frames.forEach((fPage, idx) => {
        const nextIdx = refs.indexOf(fPage, i + 1);
        if (nextIdx === -1) {
          if (farthestNextUse !== Infinity) {
            farthestNextUse = Infinity;
            victimIdx = idx;
          }
        } else if (nextIdx > farthestNextUse && farthestNextUse !== Infinity) {
          farthestNextUse = nextIdx;
          victimIdx = idx;
        }
      });
      replacedPage = frames[victimIdx];
      reason =
        farthestNextUse === Infinity
          ? `replaced page ${replacedPage} (never referenced again)`
          : `replaced page ${replacedPage} (next referenced farthest at step ${farthestNextUse + 1})`;
    }

    frames[victimIdx] = page;
    lastUsed.set(page, i);

    steps.push({
      step: i + 1,
      page,
      frames: [...frames],
      hit: false,
      fault: true,
      replacedPage,
      explanation: `Page Fault on ${page}: ${reason} in Frame ${victimIdx + 1}.`
    });
  }

  const totalReferences = refs.length;
  return {
    algorithm: algo,
    frameCount: capacity,
    referenceString: refs,
    steps,
    metrics: {
      totalReferences,
      pageFaults,
      pageHits,
      faultRate: Number(((pageFaults / totalReferences) * 100).toFixed(2)),
      hitRate: Number(((pageHits / totalReferences) * 100).toFixed(2))
    }
  };
}

export function comparePageAlgorithms({ referenceString, frameCount = 3 }) {
  return VALID_ALGORITHMS.map((algo) => {
    const res = simulatePageReplacement({ referenceString, frameCount, algorithm: algo });
    return {
      algorithm: algo,
      ...res.metrics
    };
  });
}
