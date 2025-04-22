const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const User = require('../models/User');

/**
 * Handle Firebase authentication
 * Validates the Firebase ID token and creates/updates user in our database
 */
router.post('/firebase-auth', async (req, res) => {
  try {
    const { idToken } = req.body;
    
    if (!idToken) {
      return res.status(400).json({ message: 'ID token is required' });
    }
    
    // Verify the Firebase ID token
    let decodedToken;
    try {
      decodedToken = await admin.auth().verifyIdToken(idToken);
    } catch (tokenError) {
      console.error('Token verification error:', tokenError);
      return res.status(401).json({ 
        message: 'Invalid authentication token',
        error: tokenError.code || 'token_invalid' 
      });
    }
    
    // Extract user information from the token
    const { uid, email, name, picture, firebase } = decodedToken;
    const sign_in_provider = firebase?.sign_in_provider;
    
    // Only allow GitHub authentication
    if (!sign_in_provider || !sign_in_provider.includes('github')) {
      return res.status(403).json({ message: 'Only GitHub authentication is supported' });
    }
    
    try {
      // Find or create the user in our database
      let user = await User.findOne({ firebaseUid: uid });
      
      if (!user) {
        // Create a new user if one doesn't exist
        const username = name || (email ? email.split('@')[0] : `user_${Date.now()}`);
        
        user = new User({
          firebaseUid: uid,
          username,
          email,
          displayName: name || username,
          avatarUrl: picture,
          isAdmin: false // Default to non-admin
        });
        
        await user.save();
      } else {
        // Update existing user information if changed
        const updates = {};
        if (name && user.displayName !== name) updates.displayName = name;
        if (picture && user.avatarUrl !== picture) updates.avatarUrl = picture;
        if (email && user.email !== email) updates.email = email;
        
        // Only update if there are changes
        if (Object.keys(updates).length > 0) {
          Object.assign(user, updates);
          await user.save();
        }
      }
      
      // Create session
      req.session.userId = user._id;
      
      // Return user data
      return res.status(200).json({
        _id: user._id,
        username: user.username,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl,
        isAdmin: user.isAdmin
      });
    } catch (dbError) {
      console.error('Database error during authentication:', dbError);
      return res.status(500).json({ 
        message: 'Error processing user data', 
        error: dbError.message 
      });
    }
  } catch (error) {
    console.error('Firebase authentication error:', error);
    return res.status(500).json({ message: 'Authentication failed', error: error.message });
  }
});

/**
 * Get current authenticated user
 */
router.get('/user', async (req, res) => {
  try {
    // Check if user is authenticated via session
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ message: 'Not authenticated' });
    }
    
    // Find user by ID from session
    const user = await User.findById(req.session.userId).select('-__v');
    
    if (!user) {
      // Clear invalid session
      req.session.destroy(err => {
        if (err) console.error('Error destroying session:', err);
      });
      return res.status(401).json({ message: 'User not found' });
    }
    
    return res.status(200).json({
      _id: user._id,
      username: user.username,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      isAdmin: user.role === 'admin'
    });
  } catch (error) {
    console.error('Error fetching user:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * Get user profile by username
 * This route is used for public profile pages
 */
router.get('/user/:username', async (req, res) => {
  try {
    const { username } = req.params;
    
    // Find user by username, excluding sensitive fields
    const user = await User.findOne({ username }).select('username displayName avatarUrl bio createdAt');
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    // Get image count for the user
    const imageCount = await require('../models/Image').countDocuments({ user: user._id });
    
    // Return user data with image count
    return res.status(200).json({
      _id: user._id,
      username: user.username,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      bio: user.bio || '',
      createdAt: user.createdAt,
      imageCount
    });
  } catch (error) {
    console.error('Error fetching user by username:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

/**
 * Logout route
 */
router.get('/logout', (req, res) => {
  if (!req.session) {
    return res.status(200).json({ message: 'Already logged out' });
  }
  
  req.session.destroy(err => {
    if (err) {
      console.error('Error during logout:', err);
      return res.status(500).json({ message: 'Error during logout', error: err.message });
    }
    
    res.clearCookie('connect.sid'); // Clear the session cookie
    return res.status(200).json({ message: 'Logged out successfully' });
  });
});

module.exports = router;
