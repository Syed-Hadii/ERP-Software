const mongoose = require("mongoose");
require('dotenv').config();
const dns = require('dns');

// Function to check internet connectivity
const checkInternetConnection = () => {
  return new Promise((resolve) => {
    dns.lookup('mongodb.com', (err) => {
      if (err) {
        console.log('No internet connection or DNS issue');
        resolve(false);
      } else {
        resolve(true);
      }
    });
  });
};

const connectDB = async () => {
  try {
    const isConnected = await checkInternetConnection();

    if (!isConnected) {
      console.log("No internet connection detected. Cannot connect to MongoDB Atlas.");
      // You might want to implement a local fallback here
      return null;
    }

    // Get MongoDB URI from environment variables, or use default if not provided
    const MONGO_URI = process.env.MONGO_URI || "mongodb+srv://LMS:jk6HG0iCNheY3zdH@cluster0.74vjq.mongodb.net/";

    // Add options for better reliability and performance
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    // Connect to MongoDB
    const conn = await mongoose.connect(MONGO_URI);

    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error("MongoDB connection error:", error);

    // If the error is related to DNS, provide more specific guidance
    if (error.code === 'ECONNREFUSED' || error.code === 'ENOTFOUND') {
      console.log("DNS resolution failed. Check your internet connection and firewall settings.");
      console.log("You may need to add MongoDB Atlas IP addresses to your firewall allowlist.");
      console.log("Or try connecting from a different network.");
    } else if (error.name === 'MongoServerSelectionError') {
      console.log("Could not connect to any MongoDB server in the cluster.");
      console.log("Check your connection string and make sure your IP is whitelisted.");
    }

    // Don't exit the process, let the calling code handle the error
    return null;
  }
};

module.exports = { connectDB };
