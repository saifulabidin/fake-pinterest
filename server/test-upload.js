/**
 * Test script to verify image upload and URL validation functionality
 * Run with: node test-upload.js
 */
const axios = require('axios');
const fs = require('fs');
const FormData = require('form-data');
const path = require('path');

// Test configuration
const API_BASE_URL = 'http://localhost:5000/api';
const TEST_IMAGE_URL = 'https://picsum.photos/800/600'; // Random image from Lorem Picsum
const LOCAL_IMAGE_PATH = path.join(__dirname, 'test-image.jpg');

// Function to download a test image for local upload testing
async function downloadTestImage() {
  console.log('Downloading test image...');
  try {
    const response = await axios({
      method: 'get',
      url: TEST_IMAGE_URL,
      responseType: 'stream'
    });

    const writer = fs.createWriteStream(LOCAL_IMAGE_PATH);
    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on('finish', () => {
        console.log(`Test image downloaded to ${LOCAL_IMAGE_PATH}`);
        resolve(LOCAL_IMAGE_PATH);
      });
      writer.on('error', reject);
    });
  } catch (error) {
    console.error('Error downloading test image:', error.message);
    throw error;
  }
}

// Test URL validation function
async function testUrlValidation() {
  console.log('\n=== Testing URL Validation ===');
  try {
    const response = await axios.post(`${API_BASE_URL}/images/url`, {
      imageUrl: TEST_IMAGE_URL,
      title: 'Test Image via URL',
      description: 'This is a test image uploaded via URL',
      tags: ['test', 'url', 'validation']
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });

    console.log('✅ URL validation successful!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.error('❌ URL validation failed:', error.response?.data || error.message);
    return null;
  }
}

// Test file upload function
async function testFileUpload() {
  console.log('\n=== Testing File Upload ===');
  try {
    // Make sure we have a test image
    await downloadTestImage();

    // Create form data for file upload
    const formData = new FormData();
    formData.append('file', fs.createReadStream(LOCAL_IMAGE_PATH));
    formData.append('title', 'Test Image Upload');
    formData.append('description', 'This is a test image uploaded via file upload');
    formData.append('tags', JSON.stringify(['test', 'file', 'upload']));

    const response = await axios.post(`${API_BASE_URL}/images/upload`, formData, {
      headers: {
        ...formData.getHeaders()
      }
    });

    console.log('✅ File upload successful!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.error('❌ File upload failed:', error.response?.data || error.message);
    return null;
  }
}

// Test image deletion
async function testImageDeletion(imageId) {
  console.log('\n=== Testing Image Deletion ===');
  if (!imageId) {
    console.log('⚠️ No image ID provided for deletion test');
    return;
  }

  try {
    const response = await axios.delete(`${API_BASE_URL}/images/${imageId}`);
    console.log('✅ Image deletion successful!');
    console.log('Response:', JSON.stringify(response.data, null, 2));
    return response.data;
  } catch (error) {
    console.error('❌ Image deletion failed:', error.response?.data || error.message);
    return null;
  }
}

// Main test function
async function runTests() {
  console.log('Starting Pinterest Clone API tests...\n');
  
  // Test health endpoint
  try {
    const health = await axios.get(`${API_BASE_URL}/health`);
    console.log('API Health Check:', health.data);
  } catch (error) {
    console.error('API Health Check Failed:', error.message);
    console.log('Make sure your server is running on port 5000');
    return;
  }

  // Run tests sequentially
  let uploadedImage;
  
  // Test URL upload
  const urlResult = await testUrlValidation();
  
  // Test file upload
  const fileResult = await testFileUpload();
  
  // Use the result from either test for deletion test
  uploadedImage = urlResult || fileResult;
  
  // Test image deletion if we have an image ID
  if (uploadedImage && uploadedImage._id) {
    await testImageDeletion(uploadedImage._id);
  }
  
  // Clean up
  try {
    if (fs.existsSync(LOCAL_IMAGE_PATH)) {
      fs.unlinkSync(LOCAL_IMAGE_PATH);
      console.log('\nTest image file cleaned up.');
    }
  } catch (error) {
    console.error('Error cleaning up test file:', error.message);
  }
  
  console.log('\nTests completed!');
}

// Run the tests
runTests().catch(err => {
  console.error('Test execution error:', err.message);
});