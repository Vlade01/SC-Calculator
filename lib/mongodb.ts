import mongoose from "mongoose";

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

const globalAny = global as unknown as { mongoose?: MongooseCache };

let uri = process.env.MONGODB_URI || "";

if (!globalAny.mongoose) {
  globalAny.mongoose = { conn: null, promise: null };
}

let cached: MongooseCache = globalAny.mongoose;

async function dbConnect() {
  uri = process.env.MONGODB_URI || uri;

  if (!uri) {
    throw new Error("Please define the MONGODB_URI environment variable in .env.local");
  }

  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    cached.promise = mongoose.connect(uri).then((mongooseInstance) => {
      return mongooseInstance;
    });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

export default dbConnect;
