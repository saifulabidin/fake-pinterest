const mongoose = require('mongoose');
const Schema = mongoose.Schema;

/**
 * Image Schema for storing Pinterest-like image pins
 * @typedef {Object} Image
 * @property {string} imageUrl - URL to the image
 * @property {string} title - Title of the image
 * @property {string} description - User-provided description of the image
 * @property {Array<string>} tags - Array of tags associated with the image
 * @property {ObjectId} user - Reference to the user who added the image
 * @property {Array<ObjectId>} likes - Users who liked the image
 * @property {Date} createdAt - Timestamp when the image was added
 */
const ImageSchema = new Schema({
  imageUrl: {
    type: String,
    required: [true, 'Image URL is required'],
    trim: true
  },
  title: {
    type: String,
    trim: true,
    maxlength: [100, 'Title cannot exceed 100 characters']
  },
  description: {
    type: String,
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  tags: [{
    type: String,
    trim: true,
    lowercase: true,
    maxlength: [30, 'Tag cannot exceed 30 characters']
  }],
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User reference is required'],
    index: true
  },
  likes: [{
    type: Schema.Types.ObjectId,
    ref: 'User'
  }],
  createdAt: {
    type: Date,
    default: Date.now,
    index: true
  }
});

// Add full text search index for title, description and tags
ImageSchema.index({
  title: 'text',
  description: 'text',
  tags: 'text'
});

// Virtual for formatted creation date
ImageSchema.virtual('formattedDate').get(function() {
  return this.createdAt.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
});

// Virtual for like count
ImageSchema.virtual('likeCount').get(function() {
  return this.likes ? this.likes.length : 0;
});

// Format image URL to ensure it's properly formed
ImageSchema.pre('save', function(next) {
  // If URL doesn't start with http or https, add https
  if (this.imageUrl && !this.imageUrl.match(/^https?:\/\//)) {
    this.imageUrl = 'https://' + this.imageUrl;
  }
  next();
});

module.exports = mongoose.model('Image', ImageSchema);