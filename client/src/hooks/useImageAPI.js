import { useState, useCallback } from 'react';
import axios from 'axios';
import { useToast } from '../context/ToastContext';

/**
 * Custom hook for handling image-related API operations
 * Provides methods for fetching, uploading, updating, and deleting images
 * Enhanced with toast notifications for better user feedback
 * 
 * @returns {Object} API methods and state
 */
const useImageAPI = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const toast = useToast();

  /**
   * Clears any current error
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Fetches all images or filtered by user ID
   * 
   * @param {Object} options - Query options
   * @param {string} [options.userId] - Optional user ID to filter images by
   * @param {number} [options.limit] - Optional limit of images to fetch
   * @param {number} [options.page] - Optional page number for pagination
   * @param {string} [options.sortBy] - Optional sort field
   * @param {string} [options.sortOrder] - Optional sort order ('asc' or 'desc')
   * @returns {Promise<Object>} Promise resolving to object with images array and pagination data
   */
  const getAllImages = useCallback(async (options = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      const queryParams = new URLSearchParams();
      
      if (options.limit) queryParams.append('limit', options.limit.toString());
      if (options.page) queryParams.append('page', options.page.toString());
      if (options.sortBy) queryParams.append('sortBy', options.sortBy);
      if (options.sortOrder) queryParams.append('sortOrder', options.sortOrder);
      
      const url = `/api/images${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await axios.get(url);
      
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch images';
      setError(errorMessage);
      toast.showError(errorMessage);
      console.error('Error fetching images:', err);
      return { images: [], pagination: { total: 0, page: 1, limit: 10, pages: 0 } };
    } finally {
      setLoading(false);
    }
  }, [toast]);

  /**
   * Fetches images for a specific user by username
   * 
   * @param {string} username - Username to fetch images for
   * @param {Object} options - Query options for pagination
   * @returns {Promise<Object>} Promise resolving to object with images array and user data
   */
  const getUserImages = useCallback(async (username, options = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      const queryParams = new URLSearchParams();
      if (options.limit) queryParams.append('limit', options.limit.toString());
      if (options.page) queryParams.append('page', options.page.toString());
      
      const url = `/api/images/user/${username}${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      const response = await axios.get(url);
      
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || `Failed to fetch images for user ${username}`;
      setError(errorMessage);
      toast.showError(errorMessage);
      console.error(`Error fetching user images for ${username}:`, err);
      return { images: [], pagination: { total: 0 }, user: null };
    } finally {
      setLoading(false);
    }
  }, [toast]);

  /**
   * Fetches images for the currently logged-in user
   * 
   * @returns {Promise<Array>} Promise resolving to array of image objects
   */
  const getMyImages = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get('/api/images/myimages');
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch your images';
      setError(errorMessage);
      toast.showError(errorMessage);
      console.error('Error fetching my images:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, [toast]);

  /**
   * Fetches a single image by ID
   * 
   * @param {string} imageId - The ID of the image to fetch
   * @returns {Promise<Object|null>} Promise resolving to image object or null
   */
  const getImageById = useCallback(async (imageId) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.get(`/api/images/${imageId}`);
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to fetch image';
      setError(errorMessage);
      toast.showError(errorMessage);
      console.error(`Error fetching image ${imageId}:`, err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  /**
   * Adds a new image using URL
   * 
   * @param {Object} imageData - Image data including URL, title, description and tags
   * @returns {Promise<Object|null>} Promise resolving to created image or null on error
   */
  const addImageUrl = useCallback(async (imageData) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.post('/api/images/url', imageData);
      toast.showSuccess('Image added successfully!');
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to add image';
      setError(errorMessage);
      toast.showError(errorMessage);
      console.error('Error adding image:', err);
      throw err; // Re-throw to allow the component to handle it
    } finally {
      setLoading(false);
    }
  }, [toast]);

  /**
   * Uploads a new image file (not just URL)
   * 
   * @param {FormData} formData - Form data containing image file and metadata
   * @returns {Promise<Object|null>} Promise resolving to created image or null on error
   */
  const uploadImage = useCallback(async (formData) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.post('/api/images/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      toast.showSuccess('Image uploaded successfully!');
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to upload image';
      setError(errorMessage);
      toast.showError(errorMessage);
      console.error('Error uploading image:', err);
      throw err; // Re-throw to allow the component to handle it
    } finally {
      setLoading(false);
    }
  }, [toast]);

  /**
   * Updates an existing image by ID
   * 
   * @param {string} imageId - ID of the image to update
   * @param {Object} updateData - Data to update (description, tags, etc.)
   * @returns {Promise<Object|null>} Promise resolving to updated image or null
   */
  const updateImage = useCallback(async (imageId, updateData) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.patch(`/api/images/${imageId}`, updateData);
      toast.showSuccess('Image updated successfully!');
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to update image';
      setError(errorMessage);
      toast.showError(errorMessage);
      console.error(`Error updating image ${imageId}:`, err);
      return null;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  /**
   * Deletes an image by ID
   * 
   * @param {string} imageId - ID of the image to delete
   * @returns {Promise<boolean>} Promise resolving to success status
   */
  const deleteImage = useCallback(async (imageId) => {
    try {
      setLoading(true);
      setError(null);
      
      await axios.delete(`/api/images/${imageId}`);
      toast.showSuccess('Image deleted successfully');
      return true;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to delete image';
      setError(errorMessage);
      toast.showError(errorMessage);
      console.error(`Error deleting image ${imageId}:`, err);
      return false;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  /**
   * Search for images by query string (searches title, description, tags)
   * 
   * @param {string} query - Search query string
   * @param {Object} options - Pagination options
   * @returns {Promise<Object>} Promise resolving to search results
   */
  const searchImages = useCallback(async (query, options = {}) => {
    try {
      setLoading(true);
      setError(null);
      
      const queryParams = new URLSearchParams();
      queryParams.append('q', query);
      
      if (options.limit) queryParams.append('limit', options.limit.toString());
      if (options.page) queryParams.append('page', options.page.toString());
      
      const response = await axios.get(`/api/images/search?${queryParams.toString()}`);
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to search images';
      setError(errorMessage);
      toast.showError(errorMessage);
      console.error('Error searching images:', err);
      return { images: [], pagination: { total: 0, page: 1, limit: 10, pages: 0 } };
    } finally {
      setLoading(false);
    }
  }, [toast]);

  /**
   * Toggles like status of an image
   * 
   * @param {string} imageId - ID of the image to like/unlike
   * @param {boolean} isLiked - Whether the image is already liked (to toggle)
   * @returns {Promise<Object>} Updated image data
   */
  const toggleLikeImage = useCallback(async (imageId, isLiked) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await axios.post(`/api/images/${imageId}/like`, { 
        action: isLiked ? 'unlike' : 'like' 
      });
      
      // Show toast only for 'like' action to avoid excessive notifications
      if (!isLiked) {
        toast.showSuccess('Image added to your likes');
      }
      
      return response.data;
    } catch (err) {
      const errorMessage = err.response?.data?.message || 'Failed to process like';
      setError(errorMessage);
      
      // Only show error toast, not for unauthorized which is handled by auth
      if (err.response?.status !== 401) {
        toast.showError(errorMessage);
      }
      
      throw err;
    } finally {
      setLoading(false);
    }
  }, [toast]);

  return {
    loading,
    error,
    clearError,
    getAllImages,
    getUserImages,
    getMyImages,
    getImageById,
    addImageUrl,
    uploadImage,
    updateImage,
    deleteImage,
    searchImages,
    toggleLikeImage
  };
};

export default useImageAPI;