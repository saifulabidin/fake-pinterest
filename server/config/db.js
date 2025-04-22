/**
 * MongoDB database connection configuration
 * Handles connection to MongoDB with proper error handling and optimizations
 * 
 * @module config/db
 */
const mongoose = require('mongoose');

/**
 * Connects to MongoDB database with optimized configuration
 * 
 * @returns {Promise<void>} - Promise that resolves when connected
 */
const connectDB = async () => {
  try {
    const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/pinterest-clone';
    
    // Connection options to improve performance and reliability
    const options = {
      serverSelectionTimeoutMS: 5000, // Keep trying to send operations for 5 seconds
      socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
      family: 4, // Use IPv4, skip trying IPv6
      maxPoolSize: 10 // Maintain up to 10 socket connections
    };

    const conn = await mongoose.connect(MONGO_URI, options);

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    
    // Add listeners for connection events
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected. Attempting to reconnect...');
    });

    mongoose.connection.on('reconnected', () => {
      console.log('MongoDB reconnected');
    });

    // Handle application termination
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      console.log('MongoDB connection closed due to application termination');
      process.exit(0);
    });

  } catch (err) {
    console.error(`Error connecting to MongoDB: ${err.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;