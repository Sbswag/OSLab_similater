/**
 * Curated Operating Systems Learning Mode Content:
 * - Step-by-step algorithm explanations
 * - Interactive quizzes (with instant grading & rationale)
 * - Guided practice problems with hints and verifiable answers
 */

export const LEARNING_MODULES = [
  {
    id: 'cpu-scheduling',
    title: 'CPU Scheduling',
    summary: 'How the OS dispatcher selects processes from the ready queue to maximize utilization and fairness.',
    keyFormulas: [
      'Turnaround Time (TAT) = Completion Time - Arrival Time',
      'Waiting Time (WT) = Turnaround Time - Burst Time',
      'Response Time (RT) = First CPU Start Time - Arrival Time',
      'CPU Utilization = (Total Busy Time / Total Schedule Time) × 100%'
    ],
    algorithms: [
      {
        name: 'FCFS (First-Come, First-Served)',
        steps: [
          'Sort arriving processes strictly by Arrival Time.',
          'Run each process non-preemptively to completion.',
          'Simple and starvation-free, but suffers from the Convoy Effect when a long CPU-bound job precedes short jobs.'
        ]
      },
      {
        name: 'SJF & SRTF (Shortest Job / Remaining Time First)',
        steps: [
          'SJF selects the ready process with the smallest total burst time (non-preemptive).',
          'SRTF is the preemptive version: on any arrival, compare remaining time and preempt if the new process is shorter.',
          'Provably minimizes average waiting time, though long processes can starve.'
        ]
      },
      {
        name: 'Priority & Round Robin (RR)',
        steps: [
          'Priority scheduling picks the highest-priority ready job (aging prevents starvation).',
          'Round Robin cycles through a FIFO ready queue giving each process a fixed Time Quantum (q).',
          'Too small q causes excessive context-switch overhead; too large q degrades RR toward FCFS.'
        ]
      }
    ]
  },
  {
    id: 'memory-management',
    title: 'Memory Management',
    summary: 'Contiguous memory allocation strategies and fragmentation trade-offs.',
    keyFormulas: [
      'Internal Fragmentation = Allocated Block Size − Process Requested Size',
      'External Fragmentation = Total Free Memory when non-contiguous holes cannot satisfy a request',
      'Memory Utilization = (Total Allocated Process Size / Total Memory) × 100%'
    ],
    algorithms: [
      {
        name: 'First Fit',
        steps: [
          'Scan memory partitions from the beginning and pick the first free block >= requested size.',
          'Fastest allocation search O(n), tends to leave small fragments near the start of memory.'
        ]
      },
      {
        name: 'Best Fit',
        steps: [
          'Scan all free blocks and pick the smallest free block >= requested size.',
          'Minimizes leftover waste in fixed partitions, but can create many tiny unusable holes in variable partitioning.'
        ]
      },
      {
        name: 'Worst Fit',
        steps: [
          'Scan all free blocks and pick the largest available free block.',
          'Leaves larger remaining holes in variable partitioning, though large future requests may fail sooner.'
        ]
      }
    ]
  },
  {
    id: 'page-replacement',
    title: 'Page Replacement',
    summary: 'Virtual memory demand-paging policies deciding which frame to evict on a page fault.',
    keyFormulas: [
      'Page Fault Rate = (Page Faults / Total Page References) × 100%',
      'Page Hit Rate = (Page Hits / Total Page References) × 100%'
    ],
    algorithms: [
      {
        name: 'FIFO (First-In, First-Out)',
        steps: [
          'Maintain a queue of pages in order of arrival in memory.',
          'On a fault with full frames, evict the oldest loaded page. Note: FIFO can suffer from Belady’s Anomaly.'
        ]
      },
      {
        name: 'LRU (Least Recently Used)',
        steps: [
          'Track the last step each resident page was referenced.',
          'On a fault, evict the page whose most recent use is farthest in the past (stack algorithm, no Belady’s Anomaly).'
        ]
      },
      {
        name: 'Optimal (Belady’s Algorithm)',
        steps: [
          'Look ahead in the reference string and evict the page that will not be used for the longest time in the future.',
          'Achieves the theoretical minimum number of page faults and serves as a benchmark.'
        ]
      }
    ]
  },
  {
    id: 'deadlock',
    title: "Deadlock & Banker's Algorithm",
    summary: 'Deadlock avoidance using safe-state verification before granting resource requests.',
    keyFormulas: [
      'Need[i][j] = Max[i][j] − Allocation[i][j]',
      'Safety Condition: Process Pi can finish if Need[i] <= Work, after which Work += Allocation[i]',
      'Coffman Conditions: Mutual Exclusion, Hold & Wait, No Preemption, Circular Wait'
    ],
    algorithms: [
      {
        name: "Banker's Safety Algorithm",
        steps: [
          'Initialize Work = Available and Finish[i] = false for all processes.',
          'Find an unfinished process Pi with Need[i] <= Work.',
          'Simulate Pi completing: Work = Work + Allocation[i], Finish[i] = true, append Pi to Safe Sequence.',
          'If all Finish[i] become true, the system is SAFE; otherwise it is UNSAFE.'
        ]
      },
      {
        name: 'Resource Request Algorithm',
        steps: [
          'Check Request[i] <= Need[i] (else error: exceeded max claim).',
          'Check Request[i] <= Available (else process must wait).',
          'Pretend to allocate, then run Safety Algorithm; grant only if the resulting state is SAFE.'
        ]
      }
    ]
  },
  {
    id: 'disk-scheduling',
    title: 'Disk Scheduling',
    summary: 'Minimizing disk arm seek distance across pending cylinder I/O requests.',
    keyFormulas: [
      'Seek Distance = |Current Cylinder − Next Cylinder|',
      'Total Seek Time = Sum of all head movements',
      'Average Seek Length = Total Seek Time / Number of Requests'
    ],
    algorithms: [
      {
        name: 'FCFS & SSTF',
        steps: [
          'FCFS services requests in arrival order (fair, but large head swings).',
          'SSTF always picks the pending request closest to the current head (low seek time, possible starvation).'
        ]
      },
      {
        name: 'SCAN & C-SCAN',
        steps: [
          'SCAN (Elevator) sweeps toward one end of the disk servicing requests, hits the boundary, then reverses.',
          'C-SCAN sweeps in one direction to the boundary, jumps to the opposite end, and continues in the same direction for uniform wait times.'
        ]
      }
    ]
  },
  {
    id: 'synchronization',
    title: 'Process Synchronization',
    summary: 'Coordinating concurrent threads with semaphores & monitors without race conditions or deadlocks.',
    keyFormulas: [
      'Producer-Consumer Semaphores: mutex = 1, empty = N, full = 0',
      'Producer: wait(empty) → wait(mutex) → insert → signal(mutex) → signal(full)',
      'Consumer: wait(full) → wait(mutex) → remove → signal(mutex) → signal(empty)'
    ],
    algorithms: [
      {
        name: 'Bounded-Buffer Producer-Consumer',
        steps: [
          'Counting semaphore empty prevents buffer overflow; full prevents buffer underflow.',
          'Binary semaphore mutex guarantees mutual exclusion while modifying the shared buffer.'
        ]
      },
      {
        name: 'Dining Philosophers',
        steps: [
          'Naive solution (everyone grabs left fork then right fork) causes Circular Wait deadlock.',
          'Asymmetric solution (odd philosophers grab right first, even grab left first) breaks circular wait.',
          'Waiter/Arbitrator solution allows at most N−1 philosophers to attempt eating simultaneously.'
        ]
      }
    ]
  }
];

export const QUIZ_QUESTIONS = [
  {
    id: 'q-cpu-1',
    module: 'cpu-scheduling',
    question: 'Which CPU scheduling algorithm minimizes average waiting time for a known set of processes?',
    options: ['FCFS', 'Round Robin', 'SRTF (Preemptive SJF)', 'Priority Non-Preemptive'],
    correctIndex: 2,
    explanation: 'SRTF is provably optimal for minimizing average waiting time when burst times are known.'
  },
  {
    id: 'q-cpu-2',
    module: 'cpu-scheduling',
    question: 'What happens in Round Robin scheduling when the Time Quantum becomes very large?',
    options: [
      'It behaves like SRTF',
      'It degenerates into FCFS',
      'Context switches increase infinitely',
      'Starvation becomes guaranteed'
    ],
    correctIndex: 1,
    explanation: 'If the time quantum exceeds the longest burst time, every process finishes within one turn, behaving identically to FCFS.'
  },
  {
    id: 'q-mem-1',
    module: 'memory-management',
    question: 'Given blocks [100, 500, 200, 300, 600] and requests [212, 417, 112, 426] (fixed partitions), which strategy successfully allocates all 4 processes?',
    options: ['First Fit', 'Best Fit', 'Worst Fit', 'None of them'],
    correctIndex: 1,
    explanation: 'Best Fit places 212→300, 417→500, 112→200, and 426→600, fitting every request.'
  },
  {
    id: 'q-mem-2',
    module: 'memory-management',
    question: 'Unused space inside an already-allocated fixed memory partition is called:',
    options: ['External fragmentation', 'Thrashing', 'Internal fragmentation', 'Compaction'],
    correctIndex: 2,
    explanation: 'Space wasted inside an allocated partition that cannot be assigned to another process is internal fragmentation.'
  },
  {
    id: 'q-page-1',
    module: 'page-replacement',
    question: 'Which page replacement algorithm can exhibit Belady’s Anomaly (more frames causing more page faults)?',
    options: ['LRU', 'Optimal', 'FIFO', 'LFU'],
    correctIndex: 2,
    explanation: 'FIFO is not a stack algorithm, so increasing frame count can paradoxically increase page faults for certain reference strings.'
  },
  {
    id: 'q-page-2',
    module: 'page-replacement',
    question: 'Which algorithm replaces the page that will not be used for the longest duration in the future?',
    options: ['FIFO', 'LRU', 'Optimal', 'Second Chance'],
    correctIndex: 2,
    explanation: 'Optimal (Belady’s algorithm) looks ahead in the reference string to evict the farthest-future-use page.'
  },
  {
    id: 'q-deadlock-1',
    module: 'deadlock',
    question: 'In Banker’s Algorithm, how is the Need matrix computed?',
    options: ['Max + Allocation', 'Max - Allocation', 'Available - Allocation', 'Allocation - Max'],
    correctIndex: 1,
    explanation: 'Need[i][j] = Max[i][j] - Allocation[i][j] represents remaining resources a process may still request.'
  },
  {
    id: 'q-deadlock-2',
    module: 'deadlock',
    question: 'An unsafe state in Banker’s Algorithm means:',
    options: [
      'A deadlock has definitely already occurred',
      'No safe sequence exists, so deadlock may occur depending on future requests',
      'All processes have zero Need',
      'Mutual exclusion was violated'
    ],
    correctIndex: 1,
    explanation: 'An unsafe state does not guarantee immediate deadlock, but the OS can no longer guarantee a deadlock-free execution order.'
  },
  {
    id: 'q-disk-1',
    module: 'disk-scheduling',
    question: 'Which disk scheduling algorithm provides the most uniform wait time by sweeping in only one direction and wrapping around?',
    options: ['FCFS', 'SSTF', 'SCAN', 'C-SCAN'],
    correctIndex: 3,
    explanation: 'C-SCAN services requests in one direction, jumps back to the start cylinder, and sweeps again, avoiding bias against outer/inner tracks.'
  },
  {
    id: 'q-disk-2',
    module: 'disk-scheduling',
    question: 'What is the main drawback of SSTF (Shortest Seek Time First)?',
    options: [
      'Highest average seek time',
      'Possible starvation of distant cylinder requests',
      'Requires knowing burst times',
      'Causes Belady’s Anomaly'
    ],
    correctIndex: 1,
    explanation: 'Continuously arriving requests near the head can indefinitely starve requests at far cylinders.'
  },
  {
    id: 'q-sync-1',
    module: 'synchronization',
    question: 'In Producer-Consumer, what happens if the Producer calls wait(mutex) BEFORE wait(empty) when the buffer is full?',
    options: [
      'Higher throughput',
      'Deadlock (Producer holds mutex while Consumer waits for mutex to empty a slot)',
      'Buffer expands automatically',
      'No effect'
    ],
    correctIndex: 1,
    explanation: 'Holding mutex while blocking on empty prevents any Consumer from entering the critical section to free a slot, causing deadlock.'
  },
  {
    id: 'q-sync-2',
    module: 'synchronization',
    question: 'How does the Asymmetric Dining Philosophers strategy prevent deadlock?',
    options: [
      'Increases the number of forks to 10',
      'Odd philosophers pick right fork first while even pick left fork first, breaking Circular Wait',
      'Allows two philosophers to share one fork',
      'Disables thinking state'
    ],
    correctIndex: 1,
    explanation: 'Reversing fork acquisition order for odd philosophers breaks the Coffman Circular Wait condition.'
  }
];

export const PRACTICE_PROBLEMS = [
  {
    id: 'prac-cpu-1',
    module: 'cpu-scheduling',
    title: 'Compute Average Waiting Time (SJF Non-Preemptive)',
    prompt:
      'Processes P1 (AT=0, BT=7), P2 (AT=2, BT=4), P3 (AT=4, BT=1), P4 (AT=5, BT=4) are scheduled using Non-Preemptive SJF. What is the Average Waiting Time?',
    hint: 'P1 runs 0..7 first because only P1 is available at t=0. At t=7, all of P2, P3, P4 have arrived—pick shortest BT next!',
    expectedAnswer: '4',
    unit: 'ms',
    tolerance: 0.05,
    solution:
      'Order: P1(0-7, WT=0), P3(7-8, WT=7-4=3), P2(8-12, WT=8-2=6), P4(12-16, WT=12-5=7). Average WT = (0 + 3 + 6 + 7) / 4 = 4.00.'
  },
  {
    id: 'prac-page-1',
    module: 'page-replacement',
    title: 'Count Page Faults (FIFO, 3 Frames)',
    prompt:
      'For reference string [1, 2, 3, 4, 1, 2, 5, 1, 2, 3, 4, 5] with 3 frames using FIFO, how many total Page Faults occur?',
    hint: 'This is the classic Belady’s Anomaly sequence with 3 frames! Track the queue carefully.',
    expectedAnswer: '9',
    unit: 'faults',
    tolerance: 0,
    solution:
      'Faults occur at steps: 1, 2, 3, 4(replaces 1), 1(replaces 2), 2(replaces 3), 5(replaces 4), 3(replaces 1), 4(replaces 2). Hits at 1, 2, 5. Total = 9 page faults.'
  },
  {
    id: 'prac-disk-1',
    module: 'disk-scheduling',
    title: 'Calculate Total Seek Distance (SSTF)',
    prompt:
      'Disk head starts at cylinder 50. Pending requests are [82, 170, 43, 140, 24, 16, 190]. Using SSTF, what is the total head movement (seek distance)?',
    hint: 'From 50, closest is 43 (dist 7), then 24 (dist 19), then 16 (dist 8), then jump to 82...',
    expectedAnswer: '208',
    unit: 'cylinders',
    tolerance: 0,
    solution:
      'Path: 50 → 43 (7) → 24 (19) → 16 (8) → 82 (66) → 140 (58) → 170 (30) → 190 (20). Total = 7+19+8+66+58+30+20 = 208 cylinders.'
  },
  {
    id: 'prac-banker-1',
    module: 'deadlock',
    title: 'Verify Safe Sequence (Banker’s Algorithm)',
    prompt:
      'Suppose P0 has Alloc=[0,1,0], Max=[7,5,3]; P1 has Alloc=[2,0,0], Max=[3,2,2]; P2 has Alloc=[3,0,2], Max=[9,0,2]; P3 has Alloc=[2,1,1], Max=[2,2,2]; P4 has Alloc=[0,0,2], Max=[4,3,3], and Available=[3,3,2]. Which process MUST appear first in the lowest-index safe sequence?',
    hint: 'Compute Need = Max - Alloc and check from P0 upward which process satisfies Need <= [3,3,2].',
    expectedAnswer: 'P1',
    unit: 'process',
    tolerance: 0,
    solution:
      'Need(P0)=[7,4,3] > [3,3,2]; Need(P1)=[1,2,2] <= [3,3,2], so P1 runs first! Valid lowest-index safe sequence is P1, P3, P4, P0, P2.'
  }
];
