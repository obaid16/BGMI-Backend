const mongoose = require('mongoose');

const connectDB = async () => {
  const primaryUri = process.env.MONGODB_URI || process.env.MONGO_URI;
  const localUri = 'mongodb://127.0.0.1:27017/bgmi_esports';

  if (primaryUri) {
    try {
      const conn = await mongoose.connect(primaryUri, {
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 10000,
        socketTimeoutMS: 45000,
        maxPoolSize: 50,
        minPoolSize: 10,
        family: 4 // Force IPv4 to avoid IPv6 DNS delays on Windows
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
