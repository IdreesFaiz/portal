import mongoose from "mongoose";

const FALLBACK_URI = "mongodb://127.0.0.1:27017/schoolSystem";
const MONGO_URI = process.env.MONGO_URI ?? FALLBACK_URI;

let cached = (global as any).mongoose;
if (!cached) cached = (global as any).mongoose = { conn: null, promise: null };

export async function connectDB() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    console.info(`[db] Connecting to MongoDB Atlas...`);
    cached.promise = mongoose
      .connect(MONGO_URI, { serverSelectionTimeoutMS: 10_000 })
      .then((conn) => {
        console.info(`[db] Connected to MongoDB: ${MONGO_URI.includes("127.0.0.1") ? "local" : "Atlas"}`);
        return conn;
      })
      .catch(async (err) => {
        console.error(`[db] Failed to connect to Atlas: ${err.message}`);
        if (MONGO_URI !== FALLBACK_URI) {
          console.info("[db] Trying fallback local MongoDB...");
          return mongoose.connect(FALLBACK_URI, { serverSelectionTimeoutMS: 10_000 });
        }
        throw err;
      });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}