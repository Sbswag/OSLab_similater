/**
 * CPU Scheduling Simulation Engine
 * Supports: FCFS, SJF (Non-preemptive), SRTF (Preemptive SJF),
 * Priority (Preemptive & Non-preemptive), and Round Robin (RR).
 */

const VALID_ALGORITHMS = ['FCFS', 'SJF', 'SRTF', 'PRIORITY', 'RR'];

function normalizeProcesses(processes) {
  if (!Array.isArray(processes) || processes.length === 0) {
    throw new Error('At least one process is required.');
  }

  return processes.map((p, idx) => {
    const pid = String(p.pid || `P${idx + 1}`).trim();
    const arrivalTime = Number(p.arrivalTime);
    const burstTime = Number(p.burstTime);
    const priority = p.priority === undefined || p.priority === '' ? 1 : Number(p.priority);

    if (!Number.isFinite(arrivalTime) || arrivalTime < 0) {
      throw new Error(`Invalid arrivalTime for process ${pid}. Must be >= 0.`);
    }
    if (!Number.isFinite(burstTime) || burstTime <= 0) {
      throw new Error(`Invalid burstTime for process ${pid}. Must be > 0.`);
    }
    if (!Number.isFinite(priority)) {
      throw new Error(`Invalid priority for process ${pid}.`);
    }

    return {
      pid,
      arrivalTime,
      burstTime,
      priority,
      remainingTime: burstTime,
      startTime: null,
      completionTime: null
    };
  });
}

function appendGantt(gantt, pid, start, end) {
  if (end <= start) return;
  const last = gantt[gantt.length - 1];
  if (last && last.pid === pid && last.end === start) {
    last.end = end;
  } else {
    gantt.push({ pid, start, end });
  }
}

function buildResult(procs, gantt, steps, algorithm) {
  let totalTat = 0;
  let totalWt = 0;
  let totalRt = 0;
  let busyTime = 0;

  const processResults = procs.map((p) => {
    const turnaroundTime = p.completionTime - p.arrivalTime;
    const waitingTime = turnaroundTime - p.burstTime;
    const responseTime = p.startTime - p.arrivalTime;
    totalTat += turnaroundTime;
    totalWt += waitingTime;
    totalRt += responseTime;
    busyTime += p.burstTime;

    return {
      pid: p.pid,
      arrivalTime: p.arrivalTime,
      burstTime: p.burstTime,
      priority: p.priority,
      startTime: p.startTime,
      completionTime: p.completionTime,
      turnaroundTime,
      waitingTime,
      responseTime
    };
  });

  const totalTime = gantt.length > 0 ? gantt[gantt.length - 1].end : 0;
  const nonIdleSegments = gantt.filter((seg) => seg.pid !== 'IDLE');
  const contextSwitches = Math.max(0, nonIdleSegments.length - 1);
  const n = procs.length;

  return {
    algorithm,
    gantt,
    processes: processResults,
    metrics: {
      avgTurnaroundTime: Number((totalTat / n).toFixed(2)),
      avgWaitingTime: Number((totalWt / n).toFixed(2)),
      avgResponseTime: Number((totalRt / n).toFixed(2)),
      cpuUtilization: totalTime > 0 ? Number(((busyTime / totalTime) * 100).toFixed(2)) : 0,
      throughput: totalTime > 0 ? Number((n / totalTime).toFixed(4)) : 0,
      totalTime,
      contextSwitches
    },
    steps
  };
}

function comparePriority(a, b, higherNumberHigherPriority) {
  if (a.priority !== b.priority) {
    return higherNumberHigherPriority ? b.priority - a.priority : a.priority - b.priority;
  }
  if (a.arrivalTime !== b.arrivalTime) return a.arrivalTime - b.arrivalTime;
  return a.pid.localeCompare(b.pid);
}

function selectNonPreemptive(ready, algorithm, higherNumberHigherPriority) {
  const sorted = [...ready];
  if (algorithm === 'FCFS') {
    sorted.sort((a, b) => a.arrivalTime - b.arrivalTime || a.pid.localeCompare(b.pid));
  } else if (algorithm === 'SJF') {
    sorted.sort((a, b) => a.burstTime - b.burstTime || a.arrivalTime - b.arrivalTime || a.pid.localeCompare(b.pid));
  } else if (algorithm === 'PRIORITY') {
    sorted.sort((a, b) => comparePriority(a, b, higherNumberHigherPriority));
  }
  return sorted[0];
}

function selectPreemptive(ready, algorithm, higherNumberHigherPriority) {
  const sorted = [...ready];
  if (algorithm === 'SRTF') {
    sorted.sort(
      (a, b) =>
        a.remainingTime - b.remainingTime ||
        a.arrivalTime - b.arrivalTime ||
        a.pid.localeCompare(b.pid)
    );
  } else if (algorithm === 'PRIORITY') {
    sorted.sort((a, b) => comparePriority(a, b, higherNumberHigherPriority));
  }
  return sorted[0];
}

export function simulateCpuScheduling({
  processes,
  algorithm = 'FCFS',
  timeQuantum = 2,
  preemptive = false,
  higherNumberHigherPriority = false
}) {
  const algo = String(algorithm).toUpperCase();
  if (!VALID_ALGORITHMS.includes(algo)) {
    throw new Error(`Unsupported CPU algorithm: ${algorithm}. Supported: ${VALID_ALGORITHMS.join(', ')}`);
  }

  const procs = normalizeProcesses(processes);
  const gantt = [];
  const steps = [];
  let completed = 0;
  let time = 0;

  if (algo === 'RR') {
    const q = Number(timeQuantum);
    if (!Number.isFinite(q) || q <= 0) {
      throw new Error('Time quantum must be a positive number for Round Robin.');
    }

    const sortedByArrival = [...procs].sort((a, b) => a.arrivalTime - b.arrivalTime);
    const readyQueue = [];
    let nextIdx = 0;

    const enqueueArrivals = (upToTime) => {
      while (nextIdx < sortedByArrival.length && sortedByArrival[nextIdx].arrivalTime <= upToTime) {
        readyQueue.push(sortedByArrival[nextIdx]);
        nextIdx++;
      }
    };

    enqueueArrivals(0);

    while (completed < procs.length) {
      if (readyQueue.length === 0) {
        const nextArrival = sortedByArrival[nextIdx].arrivalTime;
        appendGantt(gantt, 'IDLE', time, nextArrival);
        steps.push({
          time,
          event: `CPU idle until t=${nextArrival}`,
          runningPid: 'IDLE',
          readyQueue: []
        });
        time = nextArrival;
        enqueueArrivals(time);
        continue;
      }

      const current = readyQueue.shift();
      if (current.startTime === null) current.startTime = time;

      const execSlice = Math.min(q, current.remainingTime);
      const sliceStart = time;
      time += execSlice;
      current.remainingTime -= execSlice;

      appendGantt(gantt, current.pid, sliceStart, time);
      enqueueArrivals(time);

      if (current.remainingTime === 0) {
        current.completionTime = time;
        completed++;
        steps.push({
          time: sliceStart,
          event: `${current.pid} runs [${sliceStart}-${time}] and completes`,
          runningPid: current.pid,
          readyQueue: readyQueue.map((p) => p.pid)
        });
      } else {
        readyQueue.push(current);
        steps.push({
          time: sliceStart,
          event: `${current.pid} runs [${sliceStart}-${time}] (rem: ${current.remainingTime})`,
          runningPid: current.pid,
          readyQueue: readyQueue.map((p) => p.pid)
        });
      }
    }

    return buildResult(procs, gantt, steps, algo);
  }

  const isPreemptive = algo === 'SRTF' || (algo === 'PRIORITY' && Boolean(preemptive));

  if (!isPreemptive) {
    while (completed < procs.length) {
      const ready = procs.filter((p) => p.arrivalTime <= time && p.completionTime === null);
      if (ready.length === 0) {
        const nextArrival = Math.min(
          ...procs.filter((p) => p.completionTime === null).map((p) => p.arrivalTime)
        );
        appendGantt(gantt, 'IDLE', time, nextArrival);
        steps.push({
          time,
          event: `CPU idle until t=${nextArrival}`,
          runningPid: 'IDLE',
          readyQueue: []
        });
        time = nextArrival;
        continue;
      }

      const current = selectNonPreemptive(ready, algo, higherNumberHigherPriority);
      current.startTime = time;
      const start = time;
      time += current.burstTime;
      current.remainingTime = 0;
      current.completionTime = time;
      completed++;

      appendGantt(gantt, current.pid, start, time);
      steps.push({
        time: start,
        event: `${current.pid} selected and runs [${start}-${time}]`,
        runningPid: current.pid,
        readyQueue: ready.filter((p) => p.pid !== current.pid).map((p) => p.pid)
      });
    }

    return buildResult(procs, gantt, steps, algo);
  }

  // Preemptive execution (SRTF or Preemptive Priority) at unit-time or event-driven steps
  let lastPid = null;
  while (completed < procs.length) {
    const ready = procs.filter((p) => p.arrivalTime <= time && p.remainingTime > 0);
    if (ready.length === 0) {
      const nextArrival = Math.min(
        ...procs.filter((p) => p.remainingTime > 0).map((p) => p.arrivalTime)
      );
      appendGantt(gantt, 'IDLE', time, nextArrival);
      steps.push({
        time,
        event: `CPU idle until t=${nextArrival}`,
        runningPid: 'IDLE',
        readyQueue: []
      });
      lastPid = 'IDLE';
      time = nextArrival;
      continue;
    }

    const current = selectPreemptive(ready, algo, higherNumberHigherPriority);
    if (current.startTime === null) current.startTime = time;

    // Advance to next arrival or completion of current
    const futureArrivals = procs
      .filter((p) => p.arrivalTime > time && p.remainingTime > 0)
      .map((p) => p.arrivalTime);
    const nextEventTime = futureArrivals.length > 0 ? Math.min(...futureArrivals) : Infinity;
    const stepDuration = Math.min(current.remainingTime, nextEventTime - time);

    const segStart = time;
    time += stepDuration;
    current.remainingTime -= stepDuration;
    appendGantt(gantt, current.pid, segStart, time);

    if (lastPid !== current.pid || current.remainingTime === 0) {
      steps.push({
        time: segStart,
        event:
          current.remainingTime === 0
            ? `${current.pid} runs [${segStart}-${time}] and completes`
            : `${current.pid} runs [${segStart}-${time}] (rem: ${current.remainingTime})`,
        runningPid: current.pid,
        readyQueue: ready.filter((p) => p.pid !== current.pid).map((p) => p.pid)
      });
    }
    lastPid = current.pid;

    if (current.remainingTime === 0) {
      current.completionTime = time;
      completed++;
    }
  }

  return buildResult(procs, gantt, steps, algo);
}

export function compareCpuAlgorithms({
  processes,
  timeQuantum = 2,
  preemptive = false,
  higherNumberHigherPriority = false
}) {
  return VALID_ALGORITHMS.map((algo) => {
    const res = simulateCpuScheduling({
      processes,
      algorithm: algo,
      timeQuantum,
      preemptive,
      higherNumberHigherPriority
    });
    return {
      algorithm: algo,
      ...res.metrics
    };
  });
}
