import { useState, useRef, useEffect, memo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useImageLoader from '../hooks/useImageLoader';
import useToast from '../hooks/useToast';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';

/**
 * ImageCard Component with enhanced UI/UX features
 * Displays an image with title, description, user info, and actions
 * Has loading states, error handling, and animations
 * 
 * @param {Object} props - Component props
 * @param {Object} props.image - Image data object
 * @param {boolean} props.showUser - Whether to show user info
 * @param {boolean} props.canDelete - Whether user can delete this image
 * @param {Function} props.refreshImages - Function to refresh images after action
 * @returns {JSX.Element} ImageCard component
 */
const ImageCard = ({ image, showUser = true, canDelete = false, refreshImages }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [imageDimensions, setImageDimensions] = useState({ width: 0, height: 0 });
  const [imageRatio, setImageRatio] = useState(1);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const navigate = useNavigate();
  const imageRef = useRef(null);
  const { showSuccess, showError } = useToast();
  
  // Use custom hook for image loading with fallback
  const { currentSrc, error: imageError, loading: imageLoading } = useImageLoader(
    image?.imageUrl || '', 
    '', 
    'https://via.placeholder.com/300?text=Image+Not+Found'
  );
  
  // Update local state based on the hook
  useEffect(() => {
    setLoading(imageLoading);
    if (imageError) setError(imageError);
  }, [imageLoading, imageError]);

  /**
   * Open delete confirmation modal
   */
  const openDeleteModal = (e) => {
    e.stopPropagation();
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
      await axios.delete(`/api/images/${image._id}`);
      showSuccess('Image deleted successfully');
      if (refreshImages) {
        refreshImages();
      }
      closeDeleteModal();
    } catch (error) {
      console.error('Error deleting image:', error);
      showError('Failed to delete image');
      closeDeleteModal();
    }
  };

  /**
   * Toggle description expansion state
   */
  const toggleDescriptionExpand = () => {
    setShowFullDescription(!showFullDescription);
  };

  /**
   * Render delete button if user has permission
   * 
   * @returns {JSX.Element|null} Delete button or null
   */
  const renderDeleteButton = () => {
    if (!canDelete) return null;
    
    return (
      <button 
        className="btn btn-sm position-absolute top-0 end-0 m-2 bg-white bg-opacity-75 rounded-circle p-1"
        aria-label="Delete image"
        onClick={openDeleteModal}
        style={{ width: '32px', height: '32px', zIndex: 10 }}
      >
        {loading ? (
          <div className="spinner-border spinner-border-sm text-danger" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-trash text-danger" viewBox="0 0 16 16">
            <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
            <path fillRule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
          </svg>
        )}
      </button>
    );
  };

  /**
   * Render custom delete confirmation modal
   * 
   * @returns {JSX.Element} Delete confirmation modal
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
          className="bg-white rounded-4 shadow p-4 mx-3" 
          style={{ maxWidth: '400px' }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="d-flex justify-content-center mb-3">
            <div className="bg-danger bg-opacity-10 rounded-circle p-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" fill="currentColor" className="bi bi-exclamation-circle text-danger" viewBox="0 0 16 16">
                <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                <path d="M7.002 11a1 1 0 1 1 2 0 1 1 0 0 1-2 0zM7.1 4.995a.905.905 0 1 1 1.8 0l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 4.995z"/>
              </svg>
            </div>
          </div>
          <h4 className="text-center mb-3">Delete Image</h4>
          <p className="text-center text-secondary mb-4">
            Are you sure you want to delete this image? This action cannot be undone.
          </p>
          <div className="d-flex gap-2 justify-content-center">
            <button 
              className="btn btn-outline-secondary px-4" 
              onClick={closeDeleteModal}
            >
              Cancel
            </button>
            <button 
              className="btn btn-danger px-4" 
              onClick={handleDeleteImage}
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    );
  };

  /**
   * Renders action buttons that appear on hover
   * 
   * @returns {JSX.Element} Action buttons
   */
  const renderActionButtons = () => {
    return (
      <div className={`position-absolute bottom-0 end-0 m-2 d-flex gap-2 transition ${
        isHovered ? 'opacity-100' : 'opacity-0'
      }`} style={{zIndex: 20, transform: isHovered ? 'translateY(0)' : 'translateY(8px)', transition: 'all 0.2s'}}>
        <button 
          className="btn btn-sm btn-light rounded-circle shadow-sm p-2"
          aria-label="Save image"
          onClick={(e) => e.stopPropagation()}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-bookmark-fill text-danger" viewBox="0 0 16 16">
            <path d="M2 2v13.5a.5.5 0 0 0 .74.439L8 13.069l5.26 2.87A.5.5 0 0 0 14 15.5V2a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2z"/>
          </svg>
        </button>
        
        <button 
          className="btn btn-sm btn-light rounded-circle shadow-sm p-2"
          aria-label="Share image"
          onClick={(e) => e.stopPropagation()}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-share text-primary" viewBox="0 0 16 16">
            <path d="M13.5 1a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zM11 2.5a2.5 2.5 0 1 1 .603 1.628l-6.718 3.12a2.499 2.499 0 0 1 0 1.504l6.718 3.12a2.5 2.5 0 1 1-.488.876l-6.718-3.12a2.5 2.5 0 1 1 0-3.256l6.718-3.12A2.5 2.5 0 0 1 11 2.5zm-8.5 4a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zm11 5.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z"/>
          </svg>
        </button>
      </div>
    );
  };

  /**
   * Renders title with appropriate handling for missing values
   * 
   * @returns {JSX.Element|null} Title component or null
   */
  const renderTitle = () => {
    if (!image.title) return null;
    
    return (
      <h3 className="h6 mb-2">
        {image.title}
      </h3>
    );
  };

  /**
   * Renders description with show more/less functionality
   * 
   * @returns {JSX.Element|null} Description component or null
   */
  const renderDescription = () => {
    if (!image.description) return null;
    
    const shouldTruncate = image.description.length > 100;
    const displayText = shouldTruncate && !showFullDescription 
      ? `${image.description.substring(0, 100)}...` 
      : image.description;
    
    return (
      <div>
        <p className="text-muted small mb-1">
          {displayText}
        </p>
        
        {shouldTruncate && (
          <button
            type="button"
            onClick={toggleDescriptionExpand}
            className="btn btn-link btn-sm text-danger p-0 small fw-medium"
          >
            {showFullDescription ? 'Show less' : 'Show more'}
          </button>
        )}
      </div>
    );
  };
  
  /**
   * Renders tags associated with the image
   * 
   * @returns {JSX.Element|null} Tags component or null
   */
  const renderTags = () => {
    if (!image.tags || !image.tags.length) return null;
    
    return (
      <div className="d-flex flex-wrap gap-1 mt-2 mb-1">
        {image.tags.slice(0, 3).map((tag, index) => (
          <span 
            key={index}
            className="badge bg-light text-secondary rounded-pill px-2 py-1"
          >
            #{tag}
          </span>
        ))}
        {image.tags.length > 3 && (
          <span className="badge bg-light text-secondary rounded-pill px-2 py-1">
            +{image.tags.length - 3}
          </span>
        )}
      </div>
    );
  };

  /**
   * Calculate dynamic height for image based on aspect ratio and min/max constraints
   * 
   * @returns {string} CSS style for image height
   */
  const getImageHeight = () => {
    if (imageRatio === 1) return '240px'; // Default square
    
    // Tall images (portrait)
    if (imageRatio > 1.5) return '320px';
    // Wide images (landscape)
    if (imageRatio < 0.7) return '180px';
    
    // Standard images
    return '240px';
  };

  /**
   * Handle card click to navigate
   */
  const handleCardClick = () => {
    navigate(`/image/${image._id}`);
  };

  /**
   * Renders user info if showUser prop is true
   * 
   * @returns {JSX.Element|null} User info component or null
   */
  const renderUserInfo = () => {
    if (!showUser || !image.user) return null;
    
    return (
      <div className="mt-2 d-flex align-items-center">
        <Link 
          to={`/user/${image.user.username}`}
          className="d-flex align-items-center text-decoration-none"
          onClick={(e) => e.stopPropagation()}
        >
          {image.user.avatarUrl ? (
            <img 
              src={image.user.avatarUrl} 
              alt={image.user.username} 
              className="rounded-circle me-2"
              width="24"
              height="24"
              style={{ objectFit: 'cover' }}
            />
          ) : (
            <div 
              className="rounded-circle me-2 d-flex align-items-center justify-content-center bg-danger text-white"
              style={{ width: '24px', height: '24px' }}
            >
              {image.user.username[0].toUpperCase()}
            </div>
          )}
          <span className="small text-muted">
            {image.user.displayName || image.user.username}
          </span>
        </Link>
      </div>
    );
  };

  return (
    <div 
      className="card rounded-3 border-0 shadow-sm h-100 overflow-hidden"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={handleCardClick}
      style={{ cursor: 'pointer', transition: 'transform 0.3s, box-shadow 0.3s' }}
      onMouseOver={(e) => e.currentTarget.style.transform = 'translateY(-4px)'}
      onMouseOut={(e) => e.currentTarget.style.transform = 'translateY(0)'}
    >
      {error && !loading && (
        <div className="text-center p-4">
          <div className="alert alert-danger d-flex align-items-center" role="alert">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" className="bi bi-exclamation-circle-fill flex-shrink-0 me-2" viewBox="0 0 16 16">
              <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM8 4a.905.905 0 0 0-.9.995l.35 3.507a.552.552 0 0 0 1.1 0l.35-3.507A.905.905 0 0 0 8 4zm.002 6a1 1 0 1 0 0 2 1 1 0 0 0 0-2z"/>
            </svg>
            {error || "Failed to load image"}
          </div>
        </div>
      )}

      <div className="position-relative overflow-hidden">
        {/* Image overlay gradient on hover */}
        <div className="position-absolute top-0 start-0 w-100 h-100" 
          style={{ 
            background: 'linear-gradient(to bottom, rgba(0,0,0,0.1), transparent 50%, rgba(0,0,0,0.3))',
            opacity: isHovered ? 1 : 0,
            zIndex: 5,
            transition: 'opacity 0.3s'
          }}>
        </div>
        
        {/* Loading skeleton */}
        {loading && (
          <div className="position-absolute top-0 start-0 w-100 h-100 bg-light" style={{height: getImageHeight()}}>
            <div className="h-100 w-100 d-flex align-items-center justify-content-center">
              <div className="spinner-border text-secondary" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          </div>
        )}
        
        <img
          ref={imageRef}
          src={currentSrc}
          alt={image.title || image.description || 'Image'}
          className={`w-100 ${loading ? 'opacity-0' : 'opacity-100'}`}
          style={{ 
            height: getImageHeight(),
            objectFit: 'cover',
            transition: 'transform 0.7s ease-in-out',
            transform: isHovered ? 'scale(1.1)' : 'scale(1)',
            filter: isHovered ? 'brightness(0.95)' : 'brightness(1)'
          }}
          loading="lazy"
          onLoad={() => {
            if (imageRef.current) {
              const { naturalWidth, naturalHeight } = imageRef.current;
              setImageDimensions({ width: naturalWidth, height: naturalHeight });
              setImageRatio(naturalHeight / naturalWidth);
            }
          }}
        />
        
        {/* Show image dimensions badge */}
        {!loading && imageDimensions.width > 0 && (
          <div className="position-absolute top-0 start-0 m-2 bg-dark bg-opacity-50 text-white p-1 rounded small"
            style={{ 
              backdropFilter: 'blur(4px)', 
              opacity: isHovered ? 1 : 0, 
              transition: 'opacity 0.2s',
              zIndex: 20
            }}>
            <div className="d-flex align-items-center gap-1">
              <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" fill="currentColor" className="bi bi-aspect-ratio" viewBox="0 0 16 16">
                <path d="M0 3.5A1.5 1.5 0 0 1 1.5 2h13A1.5 1.5 0 0 1 16 3.5v9a.5.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 0 12.5v-9zM1.5 3a.5.5 0 0 0-.5.5v9a.5.5 0 0 0 .5.5h13a.5.5 0 0 0 .5-.5v-9a.5.5 0 0 0-.5-.5h-13z"/>
                <path d="M2 4.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 0 1H3v2.5a.5.5 0 0 1-1 0v-3zm12 7a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1 0-1H13V8.5a.5.5 0 0 1 1 0v3z"/>
              </svg>
              <span>{imageDimensions.width} × {imageDimensions.height}</span>
            </div>
          </div>
        )}
        
        {renderDeleteButton()}
        {renderActionButtons()}
      </div>

      <div className="p-3">
        {renderTitle()}
        {renderDescription()}
        {renderTags()}
        {renderUserInfo()}
      </div>

      {renderDeleteModal()}
    </div>
  );
};

// Memoize the component to prevent unnecessary re-renders
export default memo(ImageCard);