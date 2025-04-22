const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * User Schema for storing user account information
 * @typedef {Object} User
 * @property {string} firebaseUid - Firebase user ID
 * @property {string} githubId - GitHub account ID for OAuth authentication (legacy support)
 * @property {string} username - User's GitHub username
 * @property {string} email - User's email address
 * @property {string} displayName - User's display name
 * @property {string} profileUrl - URL to user's GitHub profile
 * @property {string} avatarUrl - URL to user's avatar/profile image
 * @property {Date} createdAt - Account creation timestamp
 */
const UserSchema = new Schema({
  firebaseUid: {
    type: String,
    required: [true, 'Firebase UID is required'],
    unique: true,
    index: true
  },
  githubId: {
    type: String,
    unique: true,
    sparse: true,
    index: true
  },
  email: {
    type: String,
    trim: true,
    index: true
  },
  username: {
    type: String,
    required: [true, 'Username is required'],
    trim: true,
    index: true
  },
  displayName: {
    type: String,
    trim: true
  },
  profileUrl: {
    type: String,
    trim: true
  },
  avatarUrl: {
    type: String,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  },
  // Role field for admin functionality
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  }
});

// Virtual property to identify if user is an admin
UserSchema.virtual('isAdmin').get(function() {
  return this.role === 'admin';
});

// Create text index on username and displayName for search functionality
UserSchema.index({ 
  username: 'text', 
  displayName: 'text',
  email: 'text'
});

module.exports = mongoose.model('User', UserSchema);