/**
 * Authentication middleware for protecting routes
 * @module middleware/authMiddleware
 */
const admin = require('firebase-admin');
const User = require('../models/User');

module.exports = {
  /**
   * Middleware to check if the user is authenticated
   * If authenticated, proceeds to the next middleware
   * Otherwise, returns a 401 Unauthorized response
   *
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   * @returns {void}
   */
  ensureAuthenticated: async function(req, res, next) {
    try {
      // Check if user ID exists in session
      const userId = req.session.userId;
      
      if (userId) {
        // Session-based authentication
        const user = await User.findById(userId);
        
        if (!user) {
          return res.status(401).json({
            message: 'User not found. Please log in again.',
            authenticated: false,
            error: 'USER_NOT_FOUND'
          });
        }
        
        // Attach user to request
        req.user = user;
        return next();
      }
      
      // Check for Firebase authentication token in Authorization header
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const idToken = authHeader.split('Bearer ')[1];
        
        try {
          // Verify the Firebase ID token
          const decodedToken = await admin.auth().verifyIdToken(idToken);
          const { uid } = decodedToken;
          
          // Find user by Firebase UID
          const user = await User.findOne({ firebaseUid: uid });
          
          if (!user) {
            return res.status(401).json({
              message: 'User not found. Please log in again.',
              authenticated: false,
              error: 'USER_NOT_FOUND'
            });
          }
          
          // Store user ID in session for future requests
          req.session.userId = user._id;
          
          // Attach user to request
          req.user = user;
          return next();
        } catch (tokenError) {
          console.error('Token verification error:', tokenError);
          return res.status(401).json({
            message: 'Invalid or expired authentication token.',
            authenticated: false,
            error: 'INVALID_TOKEN'
          });
        }
      }
      
      // No valid authentication method found
      return res.status(401).json({
        message: 'Authentication required. Please log in to access this resource.',
        authenticated: false,
        error: 'UNAUTHORIZED_ACCESS'
      });
    } catch (err) {
      console.error('Authentication error:', err);
      res.status(500).json({
        message: 'Server error during authentication.',
        authenticated: false,
        error: 'INTERNAL_SERVER_ERROR'
      });
    }
  },

  /**
   * Optional middleware to check if the user is authenticated
   * Always proceeds to next middleware, but adds isAuthenticated flag to req object
   * Useful for routes that can be accessed by both authenticated and unauthenticated users
   *
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next middleware function
   * @returns {void}
   */
  checkAuthentication: async function(req, res, next) {
    try {
      // Check if user ID exists in session
      const userId = req.session.userId;
      
      if (userId) {
        // Session-based authentication
        const user = await User.findById(userId);
        req.isUserAuthenticated = !!user;
        req.user = user;
        return next();
      }
      
      // Check for Firebase authentication token
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const idToken = authHeader.split('Bearer ')[1];
        
        try {
          // Verify the Firebase ID token
          const decodedToken = await admin.auth().verifyIdToken(idToken);
          const { uid } = decodedToken;
          
          // Find user by Firebase UID
          const user = await User.findOne({ firebaseUid: uid });
          
          if (user) {
            // Store user ID in session for future requests
            req.session.userId = user._id;
            req.isUserAuthenticated = true;
            req.user = user;
            return next();
          }
        } catch (tokenError) {
          console.error('Token verification error:', tokenError);
          // Continue with unauthenticated status
        }
      }
      
      // Default to unauthenticated if all checks fail
      req.isUserAuthenticated = false;
      req.user = null;
      next();
    } catch (err) {
      console.error('Error checking authentication:', err);
      req.isUserAuthenticated = false;
      req.user = null;
      next();
    }
  },
  
  /**
   * Middleware to check if the authenticated user is the owner of a resource
   * Use this after ensureAuthenticated to verify resource ownership
   * 
   * @param {Function} getResourceOwnerId - Function that returns the owner ID from the request
   * @returns {Function} Middleware function
   */
  isResourceOwner: function(getResourceOwnerId) {
    return async function(req, res, next) {
      try {
        const ownerId = await getResourceOwnerId(req);
        
        if (!ownerId) {
          return res.status(404).json({
            message: 'Resource not found',
            error: 'RESOURCE_NOT_FOUND'
          });
        }
        
        if (ownerId.toString() !== req.user._id.toString()) {
          return res.status(403).json({
            message: 'You do not have permission to perform this action',
            error: 'FORBIDDEN_ACTION'
          });
        }
        
        next();
      } catch (err) {
        console.error('Error checking resource ownership:', err);
        res.status(500).json({
          message: 'Server error while verifying permissions',
          error: 'INTERNAL_SERVER_ERROR'
        });
      }
    };
  }
};