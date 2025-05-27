const mongoose = require('mongoose');
require('dotenv').config();

const connectDB = async () => {
  try {
    // Always use local MongoDB - hardcoded for consistency
    const MONGODB_URI = 'mongodb://localhost:27017/maintenance_web';
    
    const conn = await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`Error connecting to MongoDB: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
