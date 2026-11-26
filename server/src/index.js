import dotenv from 'dotenv';
import app from './app.js';
import { connectDB } from './config/db.js';

dotenv.config();

const PORT = Number(process.env.PORT) || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/os_learning_platform';

async function start() {
  await connectDB(MONGO_URI);
  app.listen(PORT, () => {
    console.log(`[API] Server listening on http://localhost:${PORT}`);
  });
}

start();
