import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import axios from 'axios';
import useToast from '../hooks/useToast';
import useAuth from '../hooks/useAuth';

/**
 * ImageDetailPage Component
 * Displays a single image with its details and related information
 * 
 * @returns {JSX.Element} ImageDetailPage component
 */
const ImageDetailPage = () => {
  const { id } = useParams();
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const { isAuthenticated, user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  
  // Fetch image data on component mount
  useEffect(() => {
    const fetchImageDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await axios.get(`/api/images/${id}`);
        setImage(response.data);
      } catch (err) {
        console.error('Error fetching image details:', err);
        setError(err.response?.data?.message || 'Failed to load image details');
        showToast('Failed to load image details', 'error');
      } finally {
        setLoading(false);
      }
    };
    
    fetchImageDetails();
  }, [id, showToast]);

  /**
   * Open delete confirmation modal
   */
  const openDeleteModal = () => {
    setShowDeleteModal(true);
  };

  /**
   * Close delete confirmation modal
   */
  const closeDeleteModal = () => {
    setShowDeleteModal(false);
  };
  
  /**
   * Handle image deletion after confirmation
   */
  const handleDeleteImage = async () => {
    try {
      await axios.delete(`/api/images/${id}`);
      showToast('Image deleted successfully', 'success');
      navigate('/');
    } catch (err) {
      console.error('Error deleting image:', err);
      showToast('Failed to delete image', 'error');
    } finally {
      closeDeleteModal();
    }
  };

  /**
   * Render delete confirmation modal
   */
  const renderDeleteModal = () => {
    if (!showDeleteModal) return null;
    
    return (
      <div className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center" 
        style={{ 
          backgroundColor: 'rgba(0,0,0,0.5)', 
          zIndex: 1050,
        }}
        onClick={closeDeleteModal}
      >
        <div 
          className="bg-white rounded-4 shadow-lg p-4 mx-3" 
          style={{ maxWidth: '450px' }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="d-flex justify-content-center mb-3">
            <div className="bg-danger bg-opacity-10 rounded-circle p-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="38" height="38" fill="currentColor" className="bi bi-trash text-danger" viewBox="0 0 16 16">
                <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
                <path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
              </svg>
            </div>
          </div>
          <h3 className="text-center mb-3">Delete Image</h3>
          <p className="text-center text-secondary mb-4">
            Are you sure you want to delete this image? This action cannot be undone and will permanently remove the image.
          </p>
          <div className="d-flex gap-3 justify-content-center">
            <button 
              className="btn btn-outline-secondary px-4 py-2" 
              onClick={closeDeleteModal}
            >
              Cancel
            </button>
            <button 
              className="btn btn-danger px-4 py-2" 
              onClick={handleDeleteImage}
            >
              Delete Image
            </button>
          </div>
        </div>
      </div>
    );
  };
  
  // Check if current user can edit/delete this image
  const canModify = isAuthenticated && image?.user?._id === user?._id;
  
  // Loading state
  if (loading) {
    return (
      <div className="container py-5">
        <div className="text-center">
          <div className="spinner-border text-danger" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-3 text-secondary">Loading image details...</p>
        </div>
      </div>
    );
  }
  
  // Error state
  if (error) {
    return (
      <div className="container py-5">
        <div className="alert alert-danger d-flex align-items-center" role="alert">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" className="bi bi-exclamation-triangle-fill flex-shrink-0 me-2" viewBox="0 0 16 16">
            <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
          </svg>
          <div>
            {error}
          </div>
        </div>
        <div className="text-center mt-4">
          <button 
            className="btn btn-primary me-2"
            onClick={() => navigate(-1)}
          >
            Go Back
          </button>
          <Link to="/" className="btn btn-outline-secondary">
            Go Home
          </Link>
        </div>
      </div>
    );
  }
  
  // If image not found
  if (!image) {
    return (
      <div className="container py-5 text-center">
        <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" fill="#6c757d" className="bi bi-image mb-3" viewBox="0 0 16 16">
          <path d="M6.002 5.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z"/>
          <path d="M2.002 1a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2h-12zm12 1a1 1 0 0 1 1 1v6.5l-3.777-1.947a.5.5 0 0 0-.577.093l-3.71 3.71-2.66-1.772a.5.5 0 0 0-.63.062L1.002 12V3a1 1 0 0 1 1-1h12z"/>
        </svg>
        <h2 className="fs-4 mb-3">Image Not Found</h2>
        <p className="text-secondary mb-4">
          The image you're looking for doesn't exist or has been removed.
        </p>
        <Link to="/" className="btn btn-danger">
          Go Home
        </Link>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="container py-4"
    >
      <div className="row">
        <div className="col-lg-8">
          {/* Image */}
          <div className="card border-0 shadow-sm rounded-3 overflow-hidden mb-4">
            <img 
              src={image.imageUrl} 
              alt={image.title || 'Image'} 
              className="card-img-top w-100"
              style={{ 
                maxHeight: '80vh',
                objectFit: 'contain',
                backgroundColor: '#f8f9fa'
              }}
            />
            
            {/* Image actions */}
            {canModify && (
              <div className="card-footer bg-white d-flex justify-content-end">
                <button
                  className="btn btn-outline-danger"
                  onClick={openDeleteModal}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-trash me-2" viewBox="0 0 16 16">
                    <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
                    <path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
                  </svg>
                  Delete Image
                </button>
              </div>
            )}
          </div>
        </div>
        
        <div className="col-lg-4">
          {/* Image info */}
          <div className="card border-0 shadow-sm rounded-3 p-4">
            {/* Title */}
            {image.title && (
              <h1 className="fs-3 fw-bold mb-3">{image.title}</h1>
            )}
            
            {/* Description */}
            {image.description && (
              <p className="text-secondary mb-3">{image.description}</p>
            )}
            
            {/* Tags */}
            {image.tags && image.tags.length > 0 && (
              <div className="mb-4">
                <p className="text-secondary small mb-2">Tags</p>
                <div className="d-flex flex-wrap gap-2">
                  {image.tags.map((tag, index) => (
                    <span 
                      key={index} 
                      className="badge bg-light text-dark rounded-pill px-3 py-2"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
            
            {/* User info */}
            {image.user && (
              <div className="d-flex align-items-center mt-4">
                <p className="text-secondary small mb-2 me-2">Posted by</p>
                <Link 
                  to={`/user/${image.user.username}`}
                  className="d-flex align-items-center text-decoration-none"
                >
                  {image.user.avatarUrl ? (
                    <img 
                      src={image.user.avatarUrl} 
                      alt={image.user.username} 
                      className="rounded-circle me-2"
                      width="32"
                      height="32"
                      style={{ objectFit: 'cover' }}
                    />
                  ) : (
                    <div 
                      className="rounded-circle me-2 d-flex align-items-center justify-content-center bg-danger text-white"
                      style={{ width: '32px', height: '32px', fontSize: '14px' }}
                    >
                      {image.user.username[0].toUpperCase()}
                    </div>
                  )}
                  <span className="fw-medium">
                    {image.user.displayName || image.user.username}
                  </span>
                </Link>
              </div>
            )}
            
            {/* Date info */}
            {image.createdAt && (
              <div className="mt-4">
                <p className="text-secondary small mb-0">
                  Posted on {new Date(image.createdAt).toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
            )}
            
            {/* Action buttons */}
            <div className="d-flex mt-4">
              <button 
                className="btn btn-outline-secondary me-2"
                onClick={() => navigate(-1)}
              >
                Go Back
              </button>
              <Link to="/" className="btn btn-outline-primary">
                Home
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      {renderDeleteModal()}
    </motion.div>
  );
};

export default ImageDetailPage;