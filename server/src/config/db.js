import mongoose from 'mongoose';

let dbConnected = false;

export async function connectDB(uri) {
  const useMongo = String(process.env.USE_MONGODB || 'false').toLowerCase() === 'true';
  if (!useMongo || !uri) {
    dbConnected = false;
    console.log('[Storage] Running in zero-config standalone mode (no external database required).');
    return false;
  }

  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: 2500 });
    dbConnected = true;
    console.log(`[DB] Connected to MongoDB via Mongoose (${mongoose.connection.name})`);
    return true;
  } catch (err) {
    dbConnected = false;
    console.warn(`[DB] MongoDB unavailable (${err.message}). Using built-in local storage.`);
    return false;
  }
}

export function isDatabaseConnected() {
  return dbConnected && mongoose.connection.readyState === 1;
}
