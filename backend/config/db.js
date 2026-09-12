const mongoose = require('mongoose');
const seedUsers = require('../utils/seedUsers');

/**
 * Connects to MongoDB (Primary Atlas with Local fallback) and seeds default accounts
 */
const connectDB = async () => {
  try {
    console.log('Connecting to primary MongoDB (Atlas)...');
    await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 4000 });
    console.log('MongoDB (Atlas) connected successfully');
    await seedUsers();
  } catch (err) {
    console.warn('MongoDB Atlas connection failed:', err.message);
    console.log('Attempting local MongoDB fallback (mongodb://127.0.0.1:27017/verifitor)...');
    try {
      await mongoose.connect('mongodb://127.0.0.1:27017/verifitor', { serverSelectionTimeoutMS: 4000 });
      console.log('MongoDB (Local Fallback) connected successfully!');
      await seedUsers();
    } catch (localErr) {
      console.error('Critical Database Error: Both Atlas and Local MongoDB connections failed!');
      console.error('Local error:', localErr.message);
      process.exit(1);
    }
  }
};

module.exports = connectDB;
