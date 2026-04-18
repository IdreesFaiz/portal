import mongoose from "mongoose";

const FALLBACK_URI = "mongodb://127.0.0.1:27017/schoolSystem";
const MONGO_URI = process.env.MONGO_URI ?? FALLBACK_URI;
const ALLOW_LOCAL_FALLBACK =
  process.env.NODE_ENV !== "production" && process.env.DB_ALLOW_LOCAL_FALLBACK !== "false";

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

/**
 * Cached connection stored on globalThis to survive HMR in development.
 * Uses a symbol-free approach with a typed global augmentation.
 */
const globalWithMongoose = globalThis as typeof globalThis & {
  __mongooseCache?: MongooseCache;
};

if (!globalWithMongoose.__mongooseCache) {
  globalWithMongoose.__mongooseCache = { conn: null, promise: null };
}

const cached: MongooseCache = globalWithMongoose.__mongooseCache;

/**
 * Returns (or creates) a singleton Mongoose connection.
 * Falls back to local MongoDB if Atlas connection fails.
 */
export async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    console.info("[db] Connecting to MongoDB...");
    cached.promise = mongoose
      .connect(MONGO_URI, { serverSelectionTimeoutMS: 10_000 })
      .then((conn) => {
        console.info(
          `[db] Connected to MongoDB: ${MONGO_URI.includes("127.0.0.1") ? "local" : "Atlas"}`
        );
        return conn;
      })
      .catch(async (err: Error) => {
        console.error(`[db] Failed to connect to Atlas: ${err.message}`);
        if (ALLOW_LOCAL_FALLBACK && MONGO_URI !== FALLBACK_URI) {
          console.info("[db] Trying fallback local MongoDB...");
          return mongoose.connect(FALLBACK_URI, {
            serverSelectionTimeoutMS: 10_000,
          });
        }
        throw err;
      });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}
