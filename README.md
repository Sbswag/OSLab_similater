# Interactive Operating System Learning & Simulation Platform (OSLab Studio)

A unified full-stack Operating Systems laboratory combining **CPU Scheduling**, **Memory Management**, **Page Replacement**, **Deadlock Management (Banker's Algorithm)**, **Disk Scheduling**, **Process Synchronization**, and an interactive **Learning Mode** (guides, quizzes, and practice problems) in a single web application.

## Tech Stack
- **Frontend**: React 18, Vite, Tailwind CSS, Chart.js (`react-chartjs-2`), Lucide Icons
- **Backend**: Node.js, Express.js
- **Database & Persistence**: Works **100% out-of-the-box with zero database setup** via built-in local JSON storage (`server/data/store.json`), with optional **MongoDB + Mongoose** support if `USE_MONGODB=true` is enabled in `server/.env`.
- **Authentication**: JWT (`jsonwebtoken`) + `bcryptjs`

## Project Structure
```text
├── client/                  # React + Tailwind + Chart.js frontend
├── server/
│   ├── src/
│   │   ├── engines/         # Pure JS simulation engines for all 6 OS modules
│   │   ├── models/          # Mongoose schemas (User, SimulationHistory, QuizAttempt)
│   │   ├── controllers/     # Auth, Simulation, Learning controllers
│   │   ├── routes/          # Express REST API routes
│   │   └── data/            # Learning guides, quizzes & practice problems
│   └── tests/               # Node test suite (engines + Mongoose + JWT API)
└── docs/
    ├── PROJECT_DOCUMENTATION.md
    ├── TEST_CASES.md
    └── screenshots/
```

## Quick Start
1. Install dependencies:
   ```bash
   npm run install:all
   ```
2. Optional configuration in `server/.env` (works out-of-the-box with no database needed!):
   ```env
   PORT=5000
   USE_MONGODB=false
   JWT_SECRET=your_secret_key
   ```
3. Run development servers (API on `:5000`, React on `:5173`):
   ```bash
   npm run dev
   ```
4. Build production frontend and start unified server:
   ```bash
   npm run build
   npm start
   ```
5. Run automated tests:
   ```bash
   npm test
   ```

## Documentation
- Full Project Report: [docs/PROJECT_DOCUMENTATION.md](docs/PROJECT_DOCUMENTATION.md)
- Detailed Test Cases: [docs/TEST_CASES.md](docs/TEST_CASES.md)
