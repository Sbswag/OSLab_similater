/**
 * Deadlock Management Simulation Engine (Banker's Algorithm)
 * Supports:
 *  - Safety Check & Safe Sequence discovery
 *  - Step-by-step Work & Need evaluation trace
 *  - Resource Request verification (Request <= Need, Request <= Available, tentative safety check)
 */

function validateMatrix(matrix, rows, cols, name) {
  if (!Array.isArray(matrix) || matrix.length !== rows) {
    throw new Error(`${name} matrix must have ${rows} rows.`);
  }
  return matrix.map((row, rIdx) => {
    if (!Array.isArray(row) || row.length !== cols) {
      throw new Error(`${name} row ${rIdx} must have ${cols} resource columns.`);
    }
    return row.map((val, cIdx) => {
      const num = Number(val);
      if (!Number.isInteger(num) || num < 0) {
        throw new Error(`${name}[${rIdx}][${cIdx}] must be a non-negative integer.`);
      }
      return num;
    });
  });
}

function runSafetyCheck(allocation, need, available, processNames) {
  const n = allocation.length;
  const m = available.length;
  const work = [...available];
  const finish = new Array(n).fill(false);
  const safeSequence = [];
  const steps = [];

  let madeProgress = true;
  while (safeSequence.length < n && madeProgress) {
    madeProgress = false;
    for (let i = 0; i < n; i++) {
      if (finish[i]) continue;
      const canRun = need[i].every((needed, j) => needed <= work[j]);

      if (canRun) {
        const workBefore = [...work];
        for (let j = 0; j < m; j++) {
          work[j] += allocation[i][j];
        }
        finish[i] = true;
        safeSequence.push(processNames[i]);
        madeProgress = true;
        steps.push({
          process: processNames[i],
          passed: true,
          need: [...need[i]],
          workBefore,
          workAfter: [...work],
          explanation: `${processNames[i]} Need [${need[i].join(', ')}] <= Work [${workBefore.join(', ')}]. Allocated resources released -> Work becomes [${work.join(', ')}].`
        });
      } else {
        steps.push({
          process: processNames[i],
          passed: false,
          need: [...need[i]],
          workBefore: [...work],
          workAfter: [...work],
          explanation: `${processNames[i]} Need [${need[i].join(', ')}] > Work [${work.join(', ')}]. Must wait.`
        });
      }
    }
  }

  const isSafe = safeSequence.length === n;
  const unfinished = processNames.filter((_, idx) => !finish[idx]);

  return {
    isSafe,
    safeSequence,
    unfinished,
    finalWork: work,
    steps
  };
}

export function simulateBankersAlgorithm({
  allocation,
  max,
  available,
  processNames,
  resourceNames,
  request = null
}) {
  if (!Array.isArray(allocation) || allocation.length === 0) {
    throw new Error('Allocation matrix must contain at least one process.');
  }
  if (!Array.isArray(available) || available.length === 0) {
    throw new Error('Available vector must contain at least one resource type.');
  }

  const n = allocation.length;
  const m = available.length;

  const alloc = validateMatrix(allocation, n, m, 'Allocation');
  const maxMat = validateMatrix(max, n, m, 'Max');
  const avail = available.map((v, idx) => {
    const num = Number(v);
    if (!Number.isInteger(num) || num < 0) {
      throw new Error(`Available[${idx}] must be a non-negative integer.`);
    }
    return num;
  });

  const pNames =
    Array.isArray(processNames) && processNames.length === n
      ? processNames.map(String)
      : Array.from({ length: n }, (_, i) => `P${i}`);

  const rNames =
    Array.isArray(resourceNames) && resourceNames.length === m
      ? resourceNames.map(String)
      : Array.from({ length: m }, (_, j) => String.fromCharCode(65 + j));

  const need = alloc.map((row, i) =>
    row.map((a, j) => {
      if (a > maxMat[i][j]) {
        throw new Error(
          `Allocation[${i}][${j}] (${a}) cannot exceed Max[${i}][${j}] (${maxMat[i][j]}).`
        );
      }
      return maxMat[i][j] - a;
    })
  );

  const safety = runSafetyCheck(alloc, need, avail, pNames);

  let requestResult = null;
  if (request && request.resources) {
    const pIdx = Number(request.processIndex);
    if (!Number.isInteger(pIdx) || pIdx < 0 || pIdx >= n) {
      throw new Error(`Invalid request processIndex: ${request.processIndex}`);
    }
    const reqVec = request.resources.map((v, j) => {
      const num = Number(v);
      if (!Number.isInteger(num) || num < 0) {
        throw new Error(`Request[${j}] must be a non-negative integer.`);
      }
      return num;
    });
    if (reqVec.length !== m) {
      throw new Error(`Request vector must have ${m} elements.`);
    }

    const exceedsNeed = reqVec.some((r, j) => r > need[pIdx][j]);
    const exceedsAvailable = reqVec.some((r, j) => r > avail[j]);

    if (exceedsNeed) {
      requestResult = {
        granted: false,
        process: pNames[pIdx],
        requested: reqVec,
        reason: `Denied: ${pNames[pIdx]} exceeded its maximum claim (Request > Need).`
      };
    } else if (exceedsAvailable) {
      requestResult = {
        granted: false,
        process: pNames[pIdx],
        requested: reqVec,
        reason: `Must Wait: Resources not currently available (Request > Available).`
      };
    } else {
      const newAvail = avail.map((a, j) => a - reqVec[j]);
      const newAlloc = alloc.map((row, i) =>
        i === pIdx ? row.map((a, j) => a + reqVec[j]) : [...row]
      );
      const newNeed = need.map((row, i) =>
        i === pIdx ? row.map((nd, j) => nd - reqVec[j]) : [...row]
      );

      const postSafety = runSafetyCheck(newAlloc, newNeed, newAvail, pNames);
      requestResult = {
        granted: postSafety.isSafe,
        process: pNames[pIdx],
        requested: reqVec,
        reason: postSafety.isSafe
          ? `Granted: Resulting state is SAFE with sequence <${postSafety.safeSequence.join(' -> ')}>.`
          : `Denied (Unsafe): Granting request leads to an UNSAFE state (risk of deadlock).`,
        newAvailable: newAvail,
        newAllocation: newAlloc,
        newNeed,
        safetyCheck: postSafety
      };
    }
  }

  return {
    processNames: pNames,
    resourceNames: rNames,
    allocation: alloc,
    max: maxMat,
    available: avail,
    need,
    ...safety,
    requestResult
  };
}
