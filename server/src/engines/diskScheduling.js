/**
 * Disk Scheduling Simulation Engine
 * Supports: FCFS, SSTF, SCAN, C-SCAN
 */

const VALID_ALGORITHMS = ['FCFS', 'SSTF', 'SCAN', 'C-SCAN'];

function normalizeDiskInputs({ requests, head, diskSize = 200, direction = 'up' }) {
  const size = Number(diskSize);
  if (!Number.isInteger(size) || size <= 1) {
    throw new Error('Disk size must be an integer greater than 1.');
  }

  const startHead = Number(head);
  if (!Number.isInteger(startHead) || startHead < 0 || startHead >= size) {
    throw new Error(`Initial head position must be an integer between 0 and ${size - 1}.`);
  }

  if (!Array.isArray(requests) || requests.length === 0) {
    throw new Error('At least one disk cylinder request is required.');
  }

  const reqs = requests.map((r, idx) => {
    const val = Number(r);
    if (!Number.isInteger(val) || val < 0 || val >= size) {
      throw new Error(`Request[${idx}] (${r}) must be an integer between 0 and ${size - 1}.`);
    }
    return val;
  });

  const dir = String(direction).toLowerCase() === 'down' ? 'down' : 'up';
  return { reqs, startHead, size, dir };
}

export function simulateDiskScheduling({
  requests,
  head = 53,
  diskSize = 200,
  algorithm = 'FCFS',
  direction = 'up'
}) {
  const algo = String(algorithm).toUpperCase();
  if (!VALID_ALGORITHMS.includes(algo)) {
    throw new Error(`Unsupported disk scheduling algorithm: ${algorithm}`);
  }

  const { reqs, startHead, size, dir } = normalizeDiskInputs({
    requests,
    head,
    diskSize,
    direction
  });

  const path = [{ pos: startHead, isWrapJump: false, isBoundary: false }];

  if (algo === 'FCFS') {
    for (const r of reqs) {
      path.push({ pos: r, isWrapJump: false, isBoundary: false });
    }
  } else if (algo === 'SSTF') {
    const remaining = [...reqs];
    let current = startHead;
    while (remaining.length > 0) {
      let bestIdx = 0;
      let bestDist = Math.abs(remaining[0] - current);
      for (let i = 1; i < remaining.length; i++) {
        const d = Math.abs(remaining[i] - current);
        if (d < bestDist) {
          bestDist = d;
          bestIdx = i;
        }
      }
      const next = remaining.splice(bestIdx, 1)[0];
      path.push({ pos: next, isWrapJump: false, isBoundary: false });
      current = next;
    }
  } else {
    // SCAN or C-SCAN
    const left = reqs.filter((r) => r < startHead).sort((a, b) => a - b);
    const right = reqs.filter((r) => r >= startHead).sort((a, b) => a - b);
    const maxCyl = size - 1;

    if (algo === 'SCAN') {
      if (dir === 'up') {
        right.forEach((r) => path.push({ pos: r, isWrapJump: false, isBoundary: false }));
        if (left.length > 0 && path[path.length - 1].pos !== maxCyl) {
          path.push({ pos: maxCyl, isWrapJump: false, isBoundary: true });
        }
        [...left].reverse().forEach((r) => path.push({ pos: r, isWrapJump: false, isBoundary: false }));
      } else {
        [...left].reverse().forEach((r) => path.push({ pos: r, isWrapJump: false, isBoundary: false }));
        if (right.length > 0 && path[path.length - 1].pos !== 0) {
          path.push({ pos: 0, isWrapJump: false, isBoundary: true });
        }
        right.forEach((r) => path.push({ pos: r, isWrapJump: false, isBoundary: false }));
      }
    } else {
      // C-SCAN
      if (dir === 'up') {
        right.forEach((r) => path.push({ pos: r, isWrapJump: false, isBoundary: false }));
        if (left.length > 0) {
          if (path[path.length - 1].pos !== maxCyl) {
            path.push({ pos: maxCyl, isWrapJump: false, isBoundary: true });
          }
          path.push({ pos: 0, isWrapJump: true, isBoundary: true });
          left.forEach((r) => path.push({ pos: r, isWrapJump: false, isBoundary: false }));
        }
      } else {
        [...left].reverse().forEach((r) => path.push({ pos: r, isWrapJump: false, isBoundary: false }));
        if (right.length > 0) {
          if (path[path.length - 1].pos !== 0) {
            path.push({ pos: 0, isWrapJump: false, isBoundary: true });
          }
          path.push({ pos: maxCyl, isWrapJump: true, isBoundary: true });
          [...right].reverse().forEach((r) => path.push({ pos: r, isWrapJump: false, isBoundary: false }));
        }
      }
    }
  }

  let totalSeekTime = 0;
  let maxSeek = 0;
  const movements = [];

  for (let i = 1; i < path.length; i++) {
    const from = path[i - 1].pos;
    const to = path[i].pos;
    const distance = Math.abs(to - from);
    totalSeekTime += distance;
    if (distance > maxSeek) maxSeek = distance;

    movements.push({
      step: i,
      from,
      to,
      distance,
      cumulativeSeek: totalSeekTime,
      isWrapJump: path[i].isWrapJump,
      isBoundary: path[i].isBoundary
    });
  }

  return {
    algorithm: algo,
    direction: dir,
    diskSize: size,
    head: startHead,
    requests: reqs,
    sequence: path.map((p) => p.pos),
    movements,
    metrics: {
      totalSeekTime,
      averageSeekTime: Number((totalSeekTime / reqs.length).toFixed(2)),
      requestCount: reqs.length,
      maxSeek
    }
  };
}

export function compareDiskAlgorithms({
  requests,
  head = 53,
  diskSize = 200,
  direction = 'up'
}) {
  return VALID_ALGORITHMS.map((algo) => {
    const res = simulateDiskScheduling({ requests, head, diskSize, algorithm: algo, direction });
    return {
      algorithm: algo,
      ...res.metrics
    };
  });
}
