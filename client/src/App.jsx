import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion'; // Add missing motion import
import axios from 'axios';
import HomePage from './pages/HomePage';
import ProfilePage from './pages/ProfilePage';
import ImageDetailPage from './pages/ImageDetailPage';
import Navbar from './components/Navbar';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import useAuth from './hooks/useAuth';
import useTheme from './hooks/useTheme';
import './App.css';

// Set base URL for API requests
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';
axios.defaults.baseURL = API_BASE_URL;
axios.defaults.withCredentials = true; // Enable cookies for cross-origin requests

// Setup axios interceptors once outside of component to avoid recreation on every render
const setupAxiosInterceptors = () => {
  const requestInterceptor = axios.interceptors.request.use(
    async (config) => {
      try {
        // Check if we have a token in local storage
        const token = localStorage.getItem('firebase_token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
      } catch (error) {
        console.error('Error setting auth token:', error);
      }
      return config;
    },
    (error) => Promise.reject(error)
  );
  
  const responseInterceptor = axios.interceptors.response.use(
    response => response,
    error => {
      // Handle global errors like auth errors or server down
      if (!error.response) {
        // Network error or server down
        console.error('Network error or server unavailable');
      } else if (error.response.status === 401) {
        // Unauthorized - clear token
        localStorage.removeItem('firebase_token');
      }
      
      return Promise.reject(error);
    }
  );

  // Return interceptor IDs for cleanup
  return { requestInterceptor, responseInterceptor };
};

// Define page transition animations
const pageVariants = {
  initial: {
    opacity: 0,
  },
  in: {
    opacity: 1,
  },
  out: {
    opacity: 0,
  }
};

const pageTransition = {
  type: "tween",
  ease: "easeInOut",
  duration: 0.3
};

/**
 * AnimatedRoutes component that adds transitions between routes
 * 
 * @returns {JSX.Element} Animated routes with transitions
 */
const AnimatedRoutes = () => {
  const location = useLocation();
  const { loading } = useAuth();
  
  // Loading spinner for authentication state
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100 bg-light">
        <div className="spinner-border text-danger" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={
          <motion.div
            initial="initial"
            animate="in"
            exit="out"
            variants={pageVariants}
            transition={pageTransition}
          >
            <HomePage />
          </motion.div>
        } />
        <Route path="/profile" element={
          <ProtectedRoute>
            <motion.div
              initial="initial"
              animate="in"
              exit="out"
              variants={pageVariants}
              transition={pageTransition}
            >
              <ProfilePage />
            </motion.div>
          </ProtectedRoute>
        } />
        <Route path="/user/:username" element={
          <motion.div
            initial="initial"
            animate="in"
            exit="out"
            variants={pageVariants}
            transition={pageTransition}
          >
            <ProfilePage />
          </motion.div>
        } />
        <Route path="/explore" element={
          <motion.div
            initial="initial"
            animate="in"
            exit="out"
            variants={pageVariants}
            transition={pageTransition}
          >
            <ExplorePage />
          </motion.div>
        } /> 
        <Route path="/settings" element={
          <ProtectedRoute>
            <motion.div
              initial="initial"
              animate="in"
              exit="out"
              variants={pageVariants}
              transition={pageTransition}
            >
              <SettingsPage />
            </motion.div>
          </ProtectedRoute>
        } />
        <Route path="/image/:id" element={
          <motion.div
            initial="initial"
            animate="in"
            exit="out"
            variants={pageVariants}
            transition={pageTransition}
          >
            <ImageDetailPage />
          </motion.div>
        } />
        <Route path="*" element={
          <motion.div
            initial="initial"
            animate="in"
            exit="out"
            variants={pageVariants}
            transition={pageTransition}
          >
            <NotFoundPage />
          </motion.div>
        } />
      </Routes>
    </AnimatePresence>
  );
};

/**
 * MainApp component that handles routing while using the authentication context
 * 
 * @returns {JSX.Element} The application's routing structure
 */
const MainApp = () => {
  const { theme } = useTheme();
  
  return (
    <Router>
      <div className={`min-vh-100 ${theme === 'dark' ? 'bg-dark text-light' : 'bg-light text-dark'} transition`}>
        <Navbar />
        <main>
          <AnimatedRoutes />
        </main>
      </div>
    </Router>
  );
};

/**
 * Protected route component that redirects unauthenticated users
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to render if authenticated
 * @returns {JSX.Element} The component or a redirect
 */
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center min-vh-100">
        <div className="spinner-border text-danger" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }
  
  return isAuthenticated ? children : <Navigate to="/" replace />;
};

/**
 * Placeholder Explore Page component with improved styling
 */
const ExplorePage = () => (
  <div className="container py-5">
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white shadow-sm rounded p-4 text-center mx-auto" style={{ maxWidth: '42rem' }}
    >
      <div className="bg-danger bg-opacity-10 rounded-circle p-4 d-flex align-items-center justify-content-center mx-auto mb-4" style={{ width: '4rem', height: '4rem' }}>
        <svg className="text-danger" style={{ width: '2rem', height: '2rem' }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
        </svg>
      </div>
      <h2 className="fs-1 fw-bold mb-4 text-danger">Explore Amazing Content</h2>
      <p className="text-secondary mb-4">Discover trending images and connect with creative minds from around the world.</p>
      <div className="bg-light p-3 rounded">
        <p className="small fw-medium text-dark">Coming Soon!</p>
      </div>
    </motion.div>
  </div>
);

/**
 * Placeholder Settings Page component with Bootstrap styling
 */
const SettingsPage = () => (
  <div className="container py-5">
    <motion.div 
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
      className="row g-4 justify-content-center"
    >
      <div className="col-md-8 col-lg-6">
        <div className="bg-white shadow-sm rounded p-4 mb-4">
          <h2 className="fs-4 fw-bold mb-3 d-flex align-items-center">
            <svg className="text-primary me-2" style={{ width: '1.5rem', height: '1.5rem' }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Account Settings
          </h2>
          <div className="alert alert-info d-flex align-items-center" role="alert">
            <svg className="flex-shrink-0 me-2" style={{ width: '1.25rem', height: '1.25rem' }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>Settings page is under development</div>
          </div>
        </div>
      </div>
    </motion.div>
  </div>
);

/**
 * NotFoundPage component with Bootstrap styling
 */
const NotFoundPage = () => (
  <div className="container d-flex flex-column align-items-center justify-content-center py-5 min-vh-100 text-center">
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mb-4"
    >
      <svg className="text-danger mb-4" style={{ width: '5rem', height: '5rem' }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
      <h1 className="display-4 fw-bold">404</h1>
      <h2 className="fs-1 mb-3">Page Not Found</h2>
      <p className="lead text-muted mb-4">Sorry, we couldn't find the page you're looking for.</p>
      <Link to="/" className="btn btn-primary btn-lg d-inline-flex align-items-center gap-2">
        <svg style={{ width: '1.25rem', height: '1.25rem' }} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Go Home
      </Link>
    </motion.div>
  </div>
);

/**
 * Main application component that wraps the app with necessary providers
 * 
 * @returns {JSX.Element} The fully wrapped application
 */
function App() {
  // Setup and cleanup axios interceptors
  useEffect(() => {
    const interceptors = setupAxiosInterceptors();
    
    // Cleanup function to eject interceptors when component unmounts
    return () => {
      axios.interceptors.request.eject(interceptors.requestInterceptor);
      axios.interceptors.response.eject(interceptors.responseInterceptor);
    };
  }, []);

  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <MainApp />
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;