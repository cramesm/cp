const mongoose = require('mongoose');
const seedUsers = require('../utils/seedUsers');
const syncNotifications = require('../utils/syncNotifications');

let cachedConnection = null;

/**
 * Serverless-optimized MongoDB connection with connection pooling and caching
 */
const connectDB = async () => {
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (cachedConnection) {
    return cachedConnection;
  }

  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;
  if (!uri) {
    console.error('CRITICAL: Neither MONGODB_URI nor MONGO_URI is defined in process.env!');
    console.error('Available env keys:', Object.keys(process.env).filter(k => !k.startsWith('npm_') && !k.startsWith('VERCEL_')));
    return null;
  }

  try {
    console.log('Connecting to primary MongoDB (Atlas)...');
    cachedConnection = mongoose.connect(uri, {
      serverSelectionTimeoutMS: 15000,
      connectTimeoutMS: 15000,
      bufferCommands: true,
    });

    await cachedConnection;
    console.log('MongoDB (Atlas) connected successfully');

    // Run seed and sync non-blockingly so serverless requests respond promptly
    seedUsers().catch(e => console.warn('Background seed notice:', e.message));
    syncNotifications().catch(e => console.warn('Background sync notice:', e.message));

    return mongoose.connection;
  } catch (err) {
    cachedConnection = null;
    console.error('MongoDB Atlas connection failed:', err.message);

    // Only attempt local fallback in local development
    if (process.env.NODE_ENV !== 'production' && !process.env.VERCEL) {
      console.log('Attempting local MongoDB fallback (mongodb://127.0.0.1:27017/verifitor)...');
      try {
        await mongoose.connect('mongodb://127.0.0.1:27017/verifitor', { serverSelectionTimeoutMS: 4000 });
        console.log('MongoDB (Local Fallback) connected successfully!');
        seedUsers().catch(e => console.warn('Background seed notice:', e.message));
        syncNotifications().catch(e => console.warn('Background sync notice:', e.message));
        return mongoose.connection;
      } catch (localErr) {
        console.error('Local MongoDB connection failed:', localErr.message);
      }
    }

    // Never call process.exit(1) on Vercel/serverless
    return null;
  }
};

module.exports = connectDB;
