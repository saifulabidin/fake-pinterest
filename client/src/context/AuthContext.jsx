import { useState, useEffect, useMemo } from 'react';
import axios from 'axios';
import { auth, signInWithGithub, signOut } from '../config/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import AuthContext from './createAuthContext';

/**
 * @typedef {Object} User
 * @property {string} _id - User's unique identifier
 * @property {string} username - User's GitHub username
 * @property {string} [displayName] - User's display name
 * @property {string} [profileUrl] - URL to user's GitHub profile
 * @property {string} [avatarUrl] - URL to user's avatar/profile image
 * @property {boolean} isAdmin - Whether the user has admin privileges
 */

/**
 * @typedef {Object} AuthContextValue
 * @property {User|null} user - The authenticated user object or null if not authenticated
 * @property {Function} setUser - Function to update the user state
 * @property {string|null} error - Authentication error message or null
 * @property {boolean} isAuthenticated - Computed property indicating authentication status
 * @property {boolean} isAdmin - Computed property indicating admin status
 * @property {Function} logout - Function to log the user out
 * @property {Function} login - Function to log the user in with GitHub
 * @property {boolean} loading - Whether authentication state is being loaded
 */

/**
 * Provider component for authentication context
 * Handles fetching and maintaining user auth state
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 * @returns {JSX.Element} The provider component
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  // Handle Firebase authentication state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      
      if (firebaseUser) {
        try {
          // Get the ID token from Firebase
          const idToken = await firebaseUser.getIdToken();
          
          // Store the token in localStorage for use in axios interceptors
          localStorage.setItem('firebase_token', idToken);
          
          // Send the token to our backend to verify and get user data
          const response = await axios.post('/api/auth/firebase-auth', { idToken });
          
          // Set the user data from our backend
          setUser(response.data);
          setError(null);
        } catch (err) {
          console.error('Auth verification error:', err);
          setError('Authentication verification failed. Please try again.');
          setUser(null);
          localStorage.removeItem('firebase_token');
        }
      } else {
        setUser(null);
        localStorage.removeItem('firebase_token');
      }
      
      setLoading(false);
    });

    // Clean up subscription
    return () => unsubscribe();
  }, []);

  // Login function using GitHub authentication
  const login = async () => {
    try {
      const result = await signInWithGithub();
      
      // User closed the popup - return null
      if (!result) {
        return null;
      }
      
      // Get the Firebase ID token
      const idToken = await result.user.getIdToken();
      
      // Store the token in localStorage for use in axios interceptors
      localStorage.setItem('firebase_token', idToken);
      
      try {
        // Try to verify with backend but don't fail if endpoint doesn't exist
        await axios.post('/api/auth/firebase-auth', { idToken });
      } catch (verifyError) {
        // If backend verification fails but it's not a critical feature
        // (e.g., your app can work without it or it's not set up yet),
        // log the error but don't reject the login
        console.warn('Auth verification error: ', verifyError);
      }
      
      // Set the authenticated user
      setUser(result.user);
      setLoading(false);
      
      return { success: true, user: result.user };
    } catch (error) {
      console.error('Login error:', error);
      setLoading(false);
      throw error;
    }
  };

  // Logout function
  const logout = async () => {
    try {
      setLoading(true);
      await signOut();
      // User state will be cleared by the onAuthStateChanged listener
    } catch (err) {
      console.error('Logout error:', err);
      setError('Error during logout. Please try again.');
      setLoading(false);
    }
  };

  // Compute derived auth states with memoization for performance
  const contextValue = useMemo(() => ({
    user,
    setUser,
    error,
    isAuthenticated: !!user,
    isAdmin: user?.isAdmin || false,
    login,
    logout,
    loading
  }), [user, error, loading]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};