# Test Cases & Verification Report

All automated unit and integration tests are implemented in:
- `server/tests/engines.test.js`
- `server/tests/api.test.js`

Command executed: `npm --prefix server test` (`node --test tests/*.test.js`)

## 1. Functional & Algorithm Test Cases

| Test ID | Module | Input Scenario | Expected Output | Observed Result | Status |
|---|---|---|---|---|---|
| TC-01 | CPU Scheduling (FCFS) | `P1(0,6), P2(1,4), P3(2,2)` | Gantt: `P1 → P2 → P3`, Total Time = `12`, Avg TAT = `8.33` | Exact match (`8.33`, total `12`) | Pass |
| TC-02 | CPU Scheduling (SJF) | `P1(0,6), P2(1,4), P3(2,2)` | Non-preemptive order: `P1 → P3 → P2` | Exact match | Pass |
| TC-03 | CPU Scheduling (SRTF) | `P1(0,6), P2(1,4), P3(2,2)` | Preemptive segments: `P1:0-1, P2:1-2, P3:2-4, P2:4-7, P1:7-12` | Exact match | Pass |
| TC-04 | CPU Scheduling (RR) | `P1(0,6), P2(1,4), P3(2,2)`, `q=2` | Total time `12`, `>= 5` time slices, 5-algorithm comparison array | Exact match | Pass |
| TC-05 | Memory (First Fit) | Blocks `[100, 500, 200, 300, 600]`, Req `[212, 417, 112, 426]` | 3 allocated, 1 failed (`P4 = 426 KB` cannot fit) | Exact match (`3` allocated, `1` failed) | Pass |
| TC-06 | Memory (Best Fit) | Blocks `[100, 500, 200, 300, 600]`, Req `[212, 417, 112, 426]` | All 4 processes allocated (`0` failed) | Exact match (`4` allocated, `0` failed) | Pass |
| TC-07 | Memory (Worst Fit) | Blocks `[100, 500, 200, 300, 600]`, Req `[212, 417, 112, 426]` | 3 allocated, 1 failed | Exact match (`3` allocated, `1` failed) | Pass |
| TC-08 | Page Replacement | Ref `[7,0,1,2,0,3,0,4,2,3,0,3,2]`, 3 frames | Faults: `FIFO=10`, `LRU=9`, `Optimal=7` (`6` hits) | Exact match (`10`, `9`, `7`) | Pass |
| TC-09 | Banker's Algorithm (Safe) | 5×3 matrix, `Avail=[3,3,2]`, Req `P1:[1,0,2]` | `isSafe=true`, Safe seq `P1→P3→P4→P0→P2`, Request granted | Exact match | Pass |
| TC-10 | Banker's Algorithm (Unsafe) | 2×2 matrix, `Alloc=[[1,0],[0,1]]`, `Max=[[3,2],[2,3]]`, `Avail=[0,0]` | `isSafe=false`, `unfinished.length === 2` | Exact match | Pass |
| TC-11 | Disk Scheduling | Queue `[98,183,37,122,14,124,65,67]`, `head=53`, `size=200` | Seek: `FCFS=640`, `SSTF=236`, `SCAN(up)=331`, `C-SCAN(up)=382` | Exact match (`640`, `236`, `331`, `382`) | Pass |
| TC-12 | Synchronization (P-C) | `bufferSize=2`, `[P,P,P,C,C,C]` | `produced=2`, `blockedProducers=1`, `consumed=2`, `blockedConsumers=1`, `mutex=1, empty=2, full=0` | Exact match | Pass |
| TC-13 | Synchronization (Dining) | `5` philosophers: `naive` vs `asymmetric` | `naive` sets `deadlockDetected=true`; `asymmetric` runs `5` rounds with `deadlockDetected=false` | Exact match | Pass |

## 2. Backend, Mongoose & Security Test Cases

| Test ID | Layer | Scenario | Expected Behavior | Status |
|---|---|---|---|---|
| TC-14 | Mongoose Schemas | Validate `User`, `SimulationHistory`, `QuizAttempt` with invalid & valid payloads | Invalid fields rejected by `validateSync()`; valid schema passes | Pass |
| TC-15 | Auth & JWT | `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me` | `201` with JWT token; unauthenticated `/me` returns `401`; Bearer token returns `200` | Pass |
| TC-16 | Simulation API & History | Run all 6 `/api/simulations/:module` endpoints, save RR run, list & delete history | All 6 return `200`; saved item retrieved & deleted cleanly | Pass |
| TC-17 | Learning Mode API | `GET /api/learning/content`, `POST /api/learning/quiz`, `POST /api/learning/practice/check` | `6` modules returned; quiz graded `2/2 (100%)` & saved; practice verified `isCorrect: true` | Pass |
| TC-18 | Frontend Production Build | `npm --prefix client run build` (Vite + React + Tailwind + Chart.js) | `1618` modules transformed, clean bundle generated in `client/dist/` | Pass |
