import mongoose from 'mongoose';
import { env } from './env.js';

export async function connectDb() {
  try {
    mongoose.set('strictQuery', true);

    await mongoose.connect(env.mongoUri);

    console.log("✅ MongoDB Connected");
  } catch (error) {
    console.error("❌ MongoDB Connection Error:");
    console.error(error.message);
    process.exit(1);
  }
}