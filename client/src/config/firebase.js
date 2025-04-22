/**
 * Firebase client configuration
 * Sets up Firebase authentication and initializes the Firebase app
 */
import { initializeApp } from 'firebase/app';
import { getAuth, GithubAuthProvider, signInWithPopup, setPersistence, browserLocalPersistence } from 'firebase/auth';

// Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize authentication service
const auth = getAuth(app);

// GitHub auth provider
const githubProvider = new GithubAuthProvider();
githubProvider.addScope('user:email'); // Request email scope from GitHub

/**
 * Sign in with GitHub using a popup
 * 
 * @returns {Promise<Object|null>} Firebase user credential or null if cancelled
 */
export const signInWithGithub = async () => {
  try {
    // Set persistence to LOCAL to keep the user signed in
    await setPersistence(auth, browserLocalPersistence);
    return await signInWithPopup(auth, githubProvider);
  } catch (error) {
    // Don't treat popup closure as a critical error
    if (error.code === 'auth/popup-closed-by-user') {
      console.log('Authentication popup was closed by the user');
      return null;
    }
    
    console.error('Error signing in with GitHub:', error);
    throw error;
  }
};

/**
 * Sign out the current user
 * 
 * @returns {Promise<void>}
 */
export const signOut = async () => {
  try {
    return await auth.signOut();
  } catch (error) {
    console.error('Error signing out:', error);
    throw error;
  }
};

export { auth };