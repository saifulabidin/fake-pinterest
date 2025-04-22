const express = require('express');
const router = express.Router();
const { ensureAuthenticated } = require('../middleware/authMiddleware');
const Image = require('../models/Image');
const User = require('../models/User');
const axios = require('axios');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads');
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Generate unique filename with original extension
    const uniqueFilename = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueFilename);
  }
});

// Filter function to validate file types
const fileFilter = (req, file, cb) => {
  // Accept only image files
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

// Initialize multer with configuration
const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // Limit to 10MB
});

/**
 * Validates if a URL points to an accessible image
 * 
 * @param {string} url - URL to validate
 * @returns {Promise<boolean>} Whether the URL is a valid image
 */
async function isValidImageUrl(url) {
  try {
    if (!url) return false;
    
    // Basic URL validation
    const pattern = /^(https?:\/\/)([\w.-]+)([/\w.-]*)*\/?$/;
    if (!pattern.test(url)) return false;
    
    // Try to fetch headers to check content type
    const response = await axios.head(url, { 
      timeout: 5000, // 5 second timeout
      validateStatus: status => status < 400 // Any success status code
    });
    
    const contentType = response.headers['content-type'];
    return contentType && contentType.startsWith('image/');
  } catch (error) {
    console.error(`Error validating image URL ${url}:`, error.message);
    return false;
  }
}

/**
 * @desc    Add a new image via URL
 * @route   POST /images/url
 * @access  Private
 */
router.post('/url', ensureAuthenticated, async (req, res) => {
  const { imageUrl, title, description, tags } = req.body;

  if (!imageUrl) {
    return res.status(400).json({ message: 'Image URL is required' });
  }

  try {
    // Validate that the URL points to an actual image
    const isValid = await isValidImageUrl(imageUrl);
    if (!isValid) {
      return res.status(400).json({ 
        message: 'Invalid image URL. Please provide a direct link to an image file.' 
      });
    }

    const newImage = new Image({
      imageUrl,
      title: title || '',
      description: description || '',
      tags: Array.isArray(tags) ? tags : [],
      user: req.user.id
    });

    const image = await newImage.save();
    
    // Return the populated image for immediate display
    const populatedImage = await Image.findById(image._id)
      .populate('user', 'username displayName avatarUrl');
      
    res.status(201).json(populatedImage);
  } catch (err) {
    console.error('Error creating image:', err.message);
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
});

/**
 * @desc    Add a new image via file upload
 * @route   POST /images/upload
 * @access  Private
 */
router.post('/upload', ensureAuthenticated, upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No image file uploaded' });
    }

    // Get file path and create URL for the uploaded file
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    const relativePath = `/uploads/${req.file.filename}`;
    const imageUrl = `${baseUrl}${relativePath}`;

    // Extract other form data
    const title = req.body.title || '';
    const description = req.body.description || '';
    const tags = req.body.tags ? JSON.parse(req.body.tags) : [];

    const newImage = new Image({
      imageUrl,
      title,
      description,
      tags,
      user: req.user.id
    });

    const image = await newImage.save();
    
    // Return the populated image for immediate display
    const populatedImage = await Image.findById(image._id)
      .populate('user', 'username displayName avatarUrl');
      
    res.status(201).json(populatedImage);
  } catch (err) {
    console.error('Error uploading image:', err.message);
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
});

/**
 * @desc    Get all images for the logged-in user
 * @route   GET /images/myimages
 * @access  Private
 */
router.get('/myimages', ensureAuthenticated, async (req, res) => {
  try {
    // Use lean() for better performance when we don't need full mongoose documents
    const images = await Image.find({ user: req.user.id })
      .sort({ createdAt: -1 })
      .populate('user', 'username displayName avatarUrl')
      .lean();
      
    res.json(images);
  } catch (err) {
    console.error('Error fetching user images:', err.message);
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
});

/**
 * @desc    Get all public images
 * @route   GET /images
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const { limit = 50, page = 1 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const images = await Image.find()
      .populate('user', 'username displayName avatarUrl')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();
      
    // Get total count for pagination
    const total = await Image.countDocuments();
    
    res.json({
      images,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (err) {
    console.error('Error fetching all images:', err.message);
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
});

/**
 * @desc    Get all images for a specific user by username
 * @route   GET /images/user/:username
 * @access  Public
 */
router.get('/user/:username', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    
    const { limit = 50, page = 1 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    const images = await Image.find({ user: user._id })
      .populate('user', 'username displayName avatarUrl')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .lean();
    
    // Get total count for pagination
    const total = await Image.countDocuments({ user: user._id });
    
    res.json({
      images,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      },
      user: {
        username: user.username,
        displayName: user.displayName,
        avatarUrl: user.avatarUrl
      }
    });
  } catch (err) {
    console.error('Error fetching user images:', err.message);
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
});

/**
 * @desc    Search for images by title, description, or tags
 * @route   GET /images/search
 * @access  Public
 */
router.get('/search', async (req, res) => {
  try {
    const { q, limit = 50, page = 1 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);
    
    if (!q) {
      return res.status(400).json({ message: 'Search query is required' });
    }
    
    // Create text search query
    const query = {
      $text: { $search: q }
    };
    
    const images = await Image.find(query)
      .populate('user', 'username displayName avatarUrl')
      .sort({ score: { $meta: 'textScore' } }) // Sort by relevance
      .skip(skip)
      .limit(parseInt(limit))
      .lean();
    
    // Get total count for pagination
    const total = await Image.countDocuments(query);
    
    res.json({
      images,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / parseInt(limit))
      },
      query: q
    });
  } catch (err) {
    console.error('Error searching images:', err.message);
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
});

/**
 * @desc    Get image by ID
 * @route   GET /images/:id
 * @access  Public
 */
router.get('/:id', async (req, res) => {
  try {
    const image = await Image.findById(req.params.id)
      .populate('user', 'username displayName avatarUrl');
    
    if (!image) {
      return res.status(404).json({ message: 'Image not found' });
    }
    
    res.json(image);
  } catch (err) {
    console.error('Error fetching image by ID:', err);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Invalid image ID format' });
    }
    
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
});

/**
 * @desc    Delete an image
 * @route   DELETE /images/:id
 * @access  Private
 */
router.delete('/:id', ensureAuthenticated, async (req, res) => {
  try {
    const image = await Image.findById(req.params.id);

    if (!image) {
      return res.status(404).json({ message: 'Image not found' });
    }

    // Check if user is authorized (owner or admin)
    const isAdmin = req.user.role === 'admin';
    const isOwner = image.user.toString() === req.user.id;
    
    if (!isOwner && !isAdmin) {
      return res.status(403).json({ message: 'Not authorized to delete this image' });
    }

    // Delete the file if it's a local upload
    if (image.imageUrl.includes('/uploads/')) {
      const filePath = image.imageUrl.split('/uploads/')[1];
      const fullPath = path.join(__dirname, '../uploads', filePath);
      
      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }
    }

    await Image.findByIdAndDelete(req.params.id);
    res.json({ message: 'Image successfully removed', imageId: req.params.id });
  } catch (err) {
    console.error('Error deleting image:', err);
    
    if (err.kind === 'ObjectId') {
      return res.status(404).json({ message: 'Invalid image ID format' });
    }
    
    res.status(500).json({ message: 'Server Error', error: err.message });
  }
});

module.exports = router;
