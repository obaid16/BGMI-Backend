const mongoose = require('mongoose');

const connectDB = async () => {
  const primaryUri = process.env.MONGODB_URI || process.env.MONGO_URI;
  const localUri = 'mongodb://127.0.0.1:27017/bgmi_esports';

  if (primaryUri) {
    try {
      const conn = await mongoose.connect(primaryUri, {
        serverSelectionTimeoutMS: 5000
      });
      console.log(`MongoDB Connected (Atlas): ${conn.connection.host}`);
      return;
    } catch (error) {
      console.warn(`[DB WARNING] MongoDB Atlas connection failed (${error.message}). Trying local MongoDB...`);
    }
  }

  try {
    const conn = await mongoose.connect(localUri, {
      serverSelectionTimeoutMS: 3000
    });
    console.log(`MongoDB Connected (Local): ${conn.connection.host}`);
  } catch (localErr) {
    console.error(`[DB ERROR] Could not connect to local MongoDB (${localErr.message}). App running with in-memory state fallback.`);
  }
};

module.exports = connectDB;
