import express from 'express';
import cors from 'cors';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import authRoutes from './routes/authRoutes.js';
import simulationRoutes from './routes/simulationRoutes.js';
import learningRoutes from './routes/learningRoutes.js';
import { isDatabaseConnected } from './config/db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const clientDistPath = path.resolve(__dirname, '../../client/dist');

const app = express();

app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'Interactive OS Learning & Simulation Platform API',
    database: isDatabaseConnected() ? 'mongodb' : 'built-in-local',
    timestamp: new Date().toISOString()
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/simulations', simulationRoutes);
app.use('/api/learning', learningRoutes);

if (fs.existsSync(clientDistPath)) {
  app.use(express.static(clientDistPath));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    return res.sendFile(path.join(clientDistPath, 'index.html'));
  });
}

app.use((err, _req, res, _next) => {
  console.error('[API Error]', err);
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

export default app;
