import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    const maxPoolSize = Math.max(Number(process.env.MONGO_MAX_POOL_SIZE) || 20, 5);
    const minPoolSize = Math.max(Number(process.env.MONGO_MIN_POOL_SIZE) || 5, 0);
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      maxPoolSize,
      minPoolSize,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`MongoDB connection error: ${error.message}`);
    process.exit(1);
  }
};

export default connectDB;
