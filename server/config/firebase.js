/**
 * Firebase Admin SDK configuration
 * Initializes Firebase admin for server-side operations
 */
const admin = require('firebase-admin');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

// Initialize Firebase Admin
try {
  // Check if we're in a production environment with directly injected credentials
  if (process.env.FIREBASE_CREDENTIALS) {
    // Parse credentials from JSON string if provided
    try {
      const credentials = JSON.parse(process.env.FIREBASE_CREDENTIALS);
      admin.initializeApp({
        credential: admin.credential.cert(credentials)
      });
    } catch (parseError) {
      console.error('Error parsing Firebase credentials JSON:', parseError);
      throw parseError;
    }
  } 
  // Check for individual credential components
  else if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        // The private key comes as a string with escaped newlines, so we need to replace them
        privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
    });
  } else {
    console.warn('Firebase credentials not provided. Authentication features will not work.');
    // Don't throw an error - just warn and continue without Firebase
  }
  
  console.log('Firebase Admin SDK initialized successfully');
} catch (error) {
  console.error('Error initializing Firebase Admin SDK:', error);
  // Don't exit the process in production as other parts of the app might still work
  if (process.env.NODE_ENV !== 'production') {
    process.exit(1);
  }
}

module.exports = admin;