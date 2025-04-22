import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion'; // Add missing motion import
import axios from 'axios';
import ImageCard from '../components/ImageCard';
import ImageUploadForm from '../components/ImageUploadForm';
import useImageAPI from '../hooks/useImageAPI';
import useAuth from '../hooks/useAuth';
import { useToast } from '../context/ToastContext';
import 'bootstrap/dist/css/bootstrap.min.css';

/**
 * HomePage component displaying a Pinterest-like grid of image cards
 * Enhanced with animations, loading states, and error handling
 * 
 * @returns {JSX.Element} HomePage component
 */
function HomePage() {
  const [images, setImages] = useState([]);
  const [showUploadForm, setShowUploadForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const { isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const { loading, error, getAllImages } = useImageAPI();

  /**
   * Load all images from the API when the component mounts
   */
  useEffect(() => {
    async function loadImages() {
      try {
        const imagesData = await getAllImages();
        // Fix: Extract the images array from the response
        setImages(imagesData.images || []);
      } catch (err) {
        console.error('Error loading images:', err);
      }
    }
    
    loadImages();
  }, [getAllImages]);

  /**
   * Handle successful image upload and refresh the image list
   * 
   * @param {Object} newImage - The newly uploaded image data
   */
  const handleImageUploaded = useCallback((newImage) => {
    setImages(prevImages => [newImage, ...prevImages]);
    setShowUploadForm(false);
    showToast('Image uploaded successfully!', 'success');
  }, [showToast]);

  /**
   * Filter images based on search term
   * 
   * @returns {Array} Filtered array of images
   */
  // Fix: Ensure filteredImages is always an array
  const filteredImages = searchTerm && Array.isArray(images)
    ? images.filter(img => 
        img.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        img.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        img.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()))
      )
    : Array.isArray(images) ? images : [];

  /**
   * Calculate the breakpoint columns for the Masonry grid
   * 
   * @returns {Object} Object with breakpoint keys and column values
   */
  const BREAKPOINT_COLUMNS_OBJ = {
    default: 5,
    1400: 4,
    1100: 3,
    768: 2,
    576: 1
  };

  /**
   * Render loading skeletons during data fetch
   * 
   * @returns {JSX.Element} A grid of skeleton loaders
   */
  const renderSkeletons = () => (
    <div className="row g-4">
      {Array.from({ length: 8 }).map((_, index) => (
        <div key={`skeleton-${index}`} className="col-md-6 col-lg-4 col-xl-3">
          <div className="card rounded-3 shadow-sm overflow-hidden h-100">
            <div className="position-relative bg-light placeholder-glow" style={{ height: '320px' }}>
              <div className="placeholder w-100 h-100"></div>
            </div>
            <div className="p-3">
              <div className="placeholder w-75 mb-2"></div>
              <div className="placeholder w-50"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  /**
   * Render error state
   * 
   * @returns {JSX.Element} Error message component
   */
  const renderError = () => (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="alert alert-danger p-4 rounded-3 shadow-sm"
    >
      <div className="d-flex align-items-center">
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" className="bi bi-exclamation-triangle me-3 flex-shrink-0" viewBox="0 0 16 16">
          <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
        </svg>
        <div>
          <h4 className="fw-bold mb-1">Error Loading Images</h4>
          <p className="mb-0">{error || 'Failed to load images. Please try again.'}</p>
        </div>
      </div>
      <button 
        className="btn btn-outline-danger mt-3"
        onClick={() => window.location.reload()}
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-arrow-repeat me-2" viewBox="0 0 16 16">
          <path d="M11.534 7h3.932a.25.25 0 0 1 .192.41l-1.966 2.36a.25.25 0 0 1-.384 0l-1.966-2.36a.25.25 0 0 1 .192-.41zm-11 2h3.932a.25.25 0 0 0 .192-.41L2.692 6.23a.25.25 0 0 0-.384 0L.342 8.59A.25.25 0 0 0 .534 9z"/>
          <path fillRule="evenodd" d="M8 3c-1.552 0-2.94.707-3.857 1.818a.5.5 0 1 1-.771-.636A6.002 6.002 0 0 1 13.917 7H12.9A5.002 5.002 0 0 0 8 3zM3.1 9a5.002 5.002 0 0 0 8.757 2.182.5.5 0 1 1 .771.636A6.002 6.002 0 0 1 2.083 9H3.1z"/>
        </svg>
        Retry
      </button>
    </motion.div>
  );

  /**
   * Render empty state when no images match the search
   * 
   * @returns {JSX.Element} Empty state component
   */
  const renderEmptyState = () => (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="text-center p-5 bg-light rounded-3 shadow-sm mt-4"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" fill="#6c757d" className="bi bi-images mb-3" viewBox="0 0 16 16">
        <path d="M4.502 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z"/>
        <path d="M14.002 13a2 2 0 0 1-2 2h-10a2 2 0 0 1-2-2V5A2 2 0 0 1 2 3a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v8a2 2 0 0 1-1.998 2zM14 2H4a1 1 0 0 0-1 1h9.002a2 2 0 0 1 2 2v7A1 1 0 0 0 15 11V3a1 1 0 0 0-1-1zM2.002 4a1 1 0 0 0-1 1v8l2.646-2.354a.5.5 0 0 1 .63-.062l2.66 1.773 3.71-3.71a.5.5 0 0 1 .577-.094l1.777 1.947V5a1 1 0 0 0-1-1h-10z"/>
      </svg>
      <h3 className="fs-4 mb-3">No Images Found</h3>
      <p className="text-muted mb-4">
        {searchTerm 
          ? "We couldn't find any images matching your search. Try different keywords." 
          : "No images have been uploaded yet. Be the first to share!"}
      </p>
      <div className="d-flex justify-content-center gap-3">
        {searchTerm && (
          <button 
            className="btn btn-outline-danger"
            onClick={() => setSearchTerm('')}
          >
            Clear Search
          </button>
        )}
        {isAuthenticated && (
          <button 
            className="btn btn-danger"
            onClick={() => setShowUploadForm(true)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-cloud-upload me-2" viewBox="0 0 16 16">
              <path fillRule="evenodd" d="M4.406 1.342A5.53 5.53 0 0 1 8 0c2.69 0 4.923 2 5.166 4.579C14.758 4.804 16 6.137 16 7.773 16 9.569 14.502 11 12.687 11H10a.5.5 0 0 1 0-1h2.688C13.979 10 15 8.988 15 7.773c0-1.216-1.02-2.228-2.313-2.228h-.5v-.5C12.188 2.825 10.328 1 8 1a4.53 4.53 0 0 0-2.941 1.1c-.757.652-1.153 1.438-1.153 2.055v.448l-.445.049C2.064 4.805 1 5.952 1 7.318 1 8.785 2.23 10 3.781 10H6a.5.5 0 0 1 0 1H3.781C1.708 11 0 9.366 0 7.318c0-1.763 1.266-3.223 2.942-3.593.143-.863.698-1.723 1.464-2.383z"/>
              <path fillRule="evenodd" d="M7.646 4.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 5.707V14.5a.5.5 0 0 1-1 0V5.707L5.354 7.854a.5.5 0 1 1-.708-.708l3-3z"/>
            </svg>
            Upload an Image
          </button>
        )}
      </div>
    </motion.div>
  );

  return (
    <div className="container py-4">
      {/* Header section with search and upload button */}
      <div className="row align-items-center mb-4">
        <div className="col-md-6 mb-3 mb-md-0">
          <div className="input-group">
            <span className="input-group-text bg-white border-end-0">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-search" viewBox="0 0 16 16">
                <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001c.03.04.062.078.098.115l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85a.007.007 0 0 0-.115-.1zM12 6.5a5.5 5.5 0 1 1-11 0 5.5 5.5 0 0 1 11 0z"/>
              </svg>
            </span>
            <input
              type="text"
              className="form-control border-start-0"
              placeholder="Search images by title, description, or tag..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <div className="col-md-6 d-flex justify-content-md-end">
          {isAuthenticated && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="btn btn-danger d-flex align-items-center"
              onClick={() => setShowUploadForm(true)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" className="bi bi-cloud-upload me-2" viewBox="0 0 16 16">
                <path fillRule="evenodd" d="M4.406 1.342A5.53 5.53 0 0 1 8 0c2.69 0 4.923 2 5.166 4.579C14.758 4.804 16 6.137 16 7.773 16 9.569 14.502 11 12.687 11H10a.5.5 0 0 1 0-1h2.688C13.979 10 15 8.988 15 7.773c0-1.216-1.02-2.228-2.313-2.228h-.5v-.5C12.188 2.825 10.328 1 8 1a4.53 4.53 0 0 0-2.941 1.1c-.757.652-1.153 1.438-1.153 2.055v.448l-.445.049C2.064 4.805 1 5.952 1 7.318 1 8.785 2.23 10 3.781 10H6a.5.5 0 0 1 0 1H3.781C1.708 11 0 9.366 0 7.318c0-1.763 1.266-3.223 2.942-3.593.143-.863.698-1.723 1.464-2.383z"/>
                <path fillRule="evenodd" d="M7.646 4.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 5.707V14.5a.5.5 0 0 1-1 0V5.707L5.354 7.854a.5.5 0 1 1-.708-.708l3-3z"/>
              </svg>
              Upload Image
            </motion.button>
          )}
        </div>
      </div>

      {/* Upload form modal */}
      {showUploadForm && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{ zIndex: 1050, backdropFilter: 'blur(5px)', backgroundColor: 'rgba(0,0,0,0.5)' }}
          onClick={() => setShowUploadForm(false)}
        >
          <div 
            className="bg-white rounded-3 shadow p-4 m-3" 
            style={{ maxWidth: '600px', width: '100%', maxHeight: '90vh', overflowY: 'auto' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h3 className="fs-4 fw-bold m-0">Upload New Image</h3>
              <button
                className="btn btn-sm btn-outline-secondary rounded-circle"
                onClick={() => setShowUploadForm(false)}
                aria-label="Close"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" className="bi bi-x" viewBox="0 0 16 16">
                  <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.646 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
                </svg>
              </button>
            </div>
            <ImageUploadForm onImageUploaded={handleImageUploaded} />
          </div>
        </motion.div>
      )}

      {/* Main content - conditionally render based on state */}
      {loading ? (
        renderSkeletons()
      ) : error ? (
        renderError()
      ) : filteredImages.length === 0 ? (
        renderEmptyState()
      ) : (
        <div className="row g-4">
          {filteredImages.map((image) => (
            <div key={image._id} className="col-sm-6 col-md-4 col-lg-3 col-xl-2">
              <ImageCard image={image} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default HomePage;