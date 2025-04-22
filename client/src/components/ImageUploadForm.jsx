import { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import useImageAPI from '../hooks/useImageAPI';

/**
 * Enhanced Image Upload Form with modern UI/UX
 * Features drag-and-drop functionality, image preview, and progress indicators
 * Supports both URL linking and file uploading
 * 
 * @param {Object} props - Component props
 * @param {Function} props.onImageAdded - Callback function when an image is successfully added
 * @returns {JSX.Element} Enhanced image upload form
 */
const ImageUploadForm = ({ onImageAdded }) => {
  const { isAuthenticated } = useAuth();
  const { uploadImage, addImageUrl } = useImageAPI();
  const navigate = useNavigate();
  
  const [expanded, setExpanded] = useState(false);
  const [uploadMode, setUploadMode] = useState('file'); // 'file' or 'url'
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    tags: '',
    imageUrl: ''
  });
  
  const [selectedFile, setSelectedFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});
  
  const fileInputRef = useRef(null);
  const formRef = useRef(null);
  
  // Form expansion toggle
  const toggleExpand = () => {
    if (!expanded && !selectedFile) {
      // Focus file input when expanding form with no file selected
      setTimeout(() => {
        if (fileInputRef.current && uploadMode === 'file') {
          fileInputRef.current.click();
        }
      }, 100);
    }
    setExpanded(!expanded);
  };
  
  // Toggle between URL and file upload modes
  const toggleUploadMode = useCallback((mode) => {
    if (mode === uploadMode) return;
    
    // Reset form state when switching modes
    setSelectedFile(null);
    setImagePreview(null);
    setValidationErrors({});
    setError(null);
    setFormData(prev => ({
      ...prev,
      imageUrl: ''
    }));
    
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    
    setUploadMode(mode);
  }, [uploadMode]);
  
  /**
   * Validates form data before submission
   * 
   * @returns {boolean} Whether the form is valid
   */
  const validateForm = useCallback(() => {
    const errors = {};
    
    if (uploadMode === 'file' && !selectedFile) {
      errors.file = 'Please select an image to upload';
    }
    
    if (uploadMode === 'url' && !formData.imageUrl.trim()) {
      errors.imageUrl = 'Please enter an image URL';
    }
    
    if (!formData.title.trim()) {
      errors.title = 'Please provide a title for your image';
    }
    
    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [uploadMode, selectedFile, formData.imageUrl, formData.title]);

  /**
   * Handles image URL input change and preview generation
   */
  const handleUrlChange = useCallback((e) => {
    const url = e.target.value;
    setFormData(prev => ({
      ...prev,
      imageUrl: url
    }));
    
    // Clear validation error
    if (validationErrors.imageUrl) {
      setValidationErrors(prev => ({ ...prev, imageUrl: undefined }));
    }
    
    // Generate preview for valid-looking URLs
    if (url && url.match(/^https?:\/\/.+\.(jpg|jpeg|png|gif|webp|svg)/i)) {
      setImagePreview(url);
    } else {
      setImagePreview(null);
    }
  }, [validationErrors.imageUrl]);

  /**
   * Handles file selection for both input and drag-and-drop
   * 
   * @param {File} file - Selected file object
   */
  const handleFileSelection = useCallback((file) => {
    setError(null);
    setValidationErrors(prev => ({ ...prev, file: undefined }));
    
    // Validate file type
    if (!file) return;
    
    if (!file.type.match('image.*')) {
      setError('Please select an image file (JPEG, PNG, GIF, etc.)');
      return;
    }
    
    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size exceeds the 10MB limit');
      return;
    }

    setSelectedFile(file);
    setExpanded(true);
    
    // Generate image preview
    const reader = new FileReader();
    reader.onload = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  }, []);

  /**
   * Handles file input change
   * 
   * @param {Event} e - File input change event
   */
  const handleFileChange = useCallback((e) => {
    const file = e.target.files[0];
    handleFileSelection(file);
  }, [handleFileSelection]);

  /**
   * Handles form input changes
   * 
   * @param {Event} e - Input change event
   */
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
    
    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors(prev => ({ ...prev, [name]: undefined }));
    }
  }, [validationErrors]);

  /**
   * Simulates upload progress
   * Used for better user experience during upload
   */
  const simulateProgress = useCallback(() => {
    const interval = setInterval(() => {
      setUploadProgress((prevProgress) => {
        // Cap at 95% for actual server response
        if (prevProgress >= 95) {
          clearInterval(interval);
          return 95;
        }
        return prevProgress + Math.floor(Math.random() * 5) + 1;
      });
    }, 300);

    return interval;
  }, []);

  /**
   * Handles form submission for both URL and file uploads
   * 
   * @param {Event} e - Form submit event
   */
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      // Scroll to first error if any
      const firstErrorField = Object.keys(validationErrors)[0];
      if (firstErrorField && formRef.current) {
        const errorElement = formRef.current.querySelector(`[name="${firstErrorField}"]`);
        if (errorElement) {
          errorElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
          errorElement.focus();
        }
      }
      return;
    }

    try {
      setError(null);
      setIsUploading(true);
      setUploadProgress(0);
      
      // Start progress simulation
      const progressInterval = simulateProgress();
      
      // Process the tags as an array
      const tagsArray = formData.tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag !== '');
      
      let result;
      
      if (uploadMode === 'file') {
        // File upload mode
        const uploadFormData = new FormData();
        uploadFormData.append('file', selectedFile);
        uploadFormData.append('title', formData.title);
        uploadFormData.append('description', formData.description);
        uploadFormData.append('tags', JSON.stringify(tagsArray));
        
        // Perform file upload
        result = await uploadImage(uploadFormData);
      } else {
        // URL mode
        result = await addImageUrl({
          imageUrl: formData.imageUrl,
          title: formData.title,
          description: formData.description,
          tags: tagsArray
        });
      }
      
      // Cleanup
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      // Notify parent component about new image
      if (typeof onImageAdded === 'function') {
        onImageAdded(result);
      }
      
      // Reset form after a short delay to show completion
      setTimeout(() => {
        setFormData({
          title: '',
          description: '',
          tags: '',
          imageUrl: ''
        });
        setSelectedFile(null);
        setImagePreview(null);
        setIsUploading(false);
        setUploadProgress(0);
        setExpanded(false);
      }, 1000);
      
    } catch (err) {
      setError(err.message || 'Failed to upload image. Please try again.');
      setUploadProgress(0);
      setIsUploading(false);
    }
  }, [validateForm, validationErrors, simulateProgress, formData, uploadMode, selectedFile, uploadImage, addImageUrl, onImageAdded]);

  /**
   * Handles drag events for the drop zone
   * 
   * @param {Event} e - Drag event
   * @param {string} type - Event type
   */
  const handleDrag = useCallback((e, type) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (type === 'dragover' || type === 'dragenter') {
      setIsDragOver(true);
    } else if (type === 'dragleave' || type === 'drop') {
      setIsDragOver(false);
    }
  }, []);

  /**
   * Handles file drop in the drop zone
   * 
   * @param {Event} e - Drop event
   */
  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    
    // Switch to file mode if in URL mode
    if (uploadMode === 'url') {
      toggleUploadMode('file');
    }
    
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      handleFileSelection(files[0]);
    }
  }, [handleFileSelection, uploadMode, toggleUploadMode]);

  /**
   * Removes the selected file and preview
   */
  const removeSelectedFile = useCallback(() => {
    setSelectedFile(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  // Render authentication required message if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="card p-4 text-center">
        <div className="mb-4">
          <svg className="bi bi-lock mx-auto text-secondary" width="48" height="48" fill="currentColor" viewBox="0 0 16 16">
            <path d="M8 1a2 2 0 0 1 2 2v4H6V3a2 2 0 0 1 2-2zm3 6V3a3 3 0 0 0-6 0v4a2 2 0 0 0-2 2v5a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2zM5 8h6a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z"/>
          </svg>
        </div>
        <h2 className="fs-4 fw-bold mb-2">Authentication Required</h2>
        <p className="text-muted mb-4">
          Please log in to upload images to our platform.
        </p>
        <button
          onClick={() => navigate('/login')}
          className="btn btn-danger shadow-sm"
        >
          Go to Login
        </button>
      </div>
    );
  }

  /**
   * Renders selected file preview with enhanced styling
   * 
   * @returns {JSX.Element|null} File preview component or null
   */
  const renderFilePreview = () => {
    if (!imagePreview) return null;
    
    return (
      <div className="position-relative mt-3 rounded overflow-hidden border border-2">
        <img 
          src={imagePreview} 
          alt="Preview" 
          className="w-100 object-fit-contain bg-light"
          style={{ height: '250px' }}
          onError={() => {
            // Handle broken image preview
            setImagePreview("https://via.placeholder.com/400x300?text=Image+Preview+Not+Available");
          }}
        />
        <div className="position-absolute bottom-0 start-0 end-0 bg-dark bg-opacity-50 d-flex justify-content-between align-items-center p-3">
          {uploadMode === 'file' && selectedFile && (
            <div className="text-white text-truncate small me-2 text-nowrap">
              {selectedFile.name} ({Math.round(selectedFile.size / 1024)} KB)
            </div>
          )}
          {uploadMode === 'url' && (
            <div className="text-white text-truncate small me-2 text-nowrap">
              URL Image Preview
            </div>
          )}
          <button
            onClick={() => {
              if (uploadMode === 'file') {
                removeSelectedFile();
              } else {
                setFormData(prev => ({ ...prev, imageUrl: '' }));
                setImagePreview(null);
              }
            }}
            type="button"
            className="btn btn-danger btn-sm rounded-circle"
            aria-label="Remove image"
            disabled={isUploading}
          >
            <svg width="16" height="16" fill="currentColor" className="bi bi-trash" viewBox="0 0 16 16">
              <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z"/>
              <path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z"/>
            </svg>
          </button>
        </div>
      </div>
    );
  };

  /**
   * Renders the upload progress bar with enhanced styling
   * 
   * @returns {JSX.Element|null} Progress bar component or null
   */
  const renderProgressBar = () => {
    if (!isUploading && uploadProgress === 0) return null;
    
    return (
      <div className="mt-3">
        <div className="d-flex justify-content-between align-items-center mb-1">
          <span className="small fw-medium d-flex align-items-center">
            {uploadProgress === 100 ? (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-check-circle-fill text-success me-2" viewBox="0 0 16 16">
                  <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/>
                </svg>
                <span className="text-success">Upload Complete!</span>
              </>
            ) : (
              <>
                <span className="spinner-grow spinner-grow-sm text-danger me-2" role="status" aria-hidden="true"></span>
                <span>Uploading your pin...</span>
              </>
            )}
          </span>
          <span className="small fw-medium">
            {uploadProgress}%
          </span>
        </div>
        <div className="progress" role="progressbar" aria-valuenow={uploadProgress} aria-valuemin="0" aria-valuemax="100">
          <div 
            className={`progress-bar progress-bar-striped progress-bar-animated ${
              uploadProgress === 100 ? 'bg-success' : 'bg-danger'
            }`} 
            style={{ width: `${uploadProgress}%` }}
          ></div>
        </div>
        {uploadProgress === 100 && (
          <div className="d-flex align-items-center justify-content-center mt-2 text-success fade show">
            <svg width="16" height="16" fill="currentColor" className="bi bi-check2 me-1" viewBox="0 0 16 16">
              <path d="M13.854 3.646a.5.5 0 0 1 0 .708l-7 7a.5.5 0 0 1-.708 0l-3.5-3.5a.5.5 0 1 1 .708-.708L6.5 10.293l6.646-6.647a.5.5 0 0 1 .708 0z"/>
            </svg>
            <span className="small fw-medium">Your pin has been uploaded successfully!</span>
          </div>
        )}
      </div>
    );
  };

  /**
   * Renders the upload mode toggle buttons
   */
  const renderUploadModeToggle = () => {
    return (
      <div className="d-flex justify-content-center mb-4">
        <div className="btn-group" role="group">
          <button
            type="button"
            onClick={() => toggleUploadMode('file')}
            disabled={isUploading}
            className={`btn ${uploadMode === 'file' ? 'btn-danger' : 'btn-outline-secondary'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-upload me-1" viewBox="0 0 16 16">
              <path d="M.5 9.9a.5.5 0 0 1 .5.5v2.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-2.5a.5.5 0 0 1 1 0v2.5a2 2 0 0 1-2 2H2a2 2 0 0 1-2-2v-2.5a.5.5 0 0 1 .5-.5z"/>
              <path d="M7.646 1.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 2.707V11.5a.5.5 0 0 1-1 0V2.707L5.354 7.854a.5.5 0 1 1-.708-.708l3-3z"/>
            </svg>
            Upload File
          </button>
          <button
            type="button"
            onClick={() => toggleUploadMode('url')}
            disabled={isUploading}
            className={`btn ${uploadMode === 'url' ? 'btn-danger' : 'btn-outline-secondary'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-link-45deg me-1" viewBox="0 0 16 16">
              <path d="M4.715 6.542 3.343 7.914a3 3 0 1 0 4.243 4.243l1.828-1.829A3 3 0 0 0 8.586 5.5L8 6.086a1.002 1.002 0 0 0-.154.199 2 2 0 0 1 .861 3.337L6.88 11.45a2 2 0 1 1-2.83-2.83l.793-.792a4.018 4.018 0 0 1-.128-1.287z"/>
              <path d="M6.586 4.672A3 3 0 0 0 7.414 9.5l.775-.776a2 2 0 0 1-.896-3.346L9.12 3.55a2 2 0 1 1 2.83 2.83l-.793.792c.112.42.155.855.128 1.287l1.372-1.372a3 3 0 1 0-4.243-4.243L6.586 4.672z"/>
            </svg>
            Enter URL
          </button>
        </div>
      </div>
    );
  };

  /**
   * Renders the file upload area or compact button if not expanded
   */
  const renderUploadArea = () => {
    if (!expanded) {
      return (
        <button
          type="button"
          onClick={toggleExpand}
          className="btn btn-outline-secondary w-100 py-4 border border-2 border-dashed d-flex align-items-center justify-content-center"
        >
          <div className="rounded-circle bg-light p-3 me-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" className="bi bi-cloud-upload text-danger" viewBox="0 0 16 16">
              <path fill-rule="evenodd" d="M4.406 1.342A5.53 5.53 0 0 1 8 0c2.69 0 4.923 2 5.166 4.579C14.758 4.804 16 6.137 16 7.773 16 9.569 14.502 11 12.687 11H10a.5.5 0 0 1 0-1h2.688C13.979 10 15 8.988 15 7.773c0-1.216-1.02-2.228-2.313-2.228h-.5v-.5C12.188 2.825 10.328 1 8 1a4.53 4.53 0 0 0-2.941 1.1c-.757.652-1.153 1.438-1.153 2.055v.448l-.445.049C2.064 4.805 1 5.952 1 7.318 1 8.785 2.23 10 3.781 10H6a.5.5 0 0 1 0 1H3.781C1.708 11 0 9.366 0 7.318c0-1.763 1.266-3.223 2.942-3.593.143-.863.698-1.723 1.464-2.383z"/>
              <path fill-rule="evenodd" d="M7.646 4.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 5.707V14.5a.5.5 0 0 1-1 0V5.707L5.354 7.854a.5.5 0 1 1-.708-.708l3-3z"/>
            </svg>
          </div>
          <span className="fs-5">Click to add a new pin</span>
        </button>
      );
    }
    
    // Render file upload area
    return (
      <div>
        {renderUploadModeToggle()}
        
        {uploadMode === 'file' ? (
          <div 
            className={`mb-4 rounded-3 p-4 border border-2 ${isDragOver ? 'border-danger bg-danger bg-opacity-10' : 'border-dashed border-secondary'} text-center`}
            onDragOver={(e) => handleDrag(e, 'dragover')}
            onDragEnter={(e) => handleDrag(e, 'dragenter')}
            onDragLeave={(e) => handleDrag(e, 'dragleave')}
            onDrop={handleDrop}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="currentColor" className={`bi bi-cloud-upload mb-3 ${isDragOver ? 'text-danger' : 'text-secondary'}`} viewBox="0 0 16 16">
              <path fill-rule="evenodd" d="M4.406 1.342A5.53 5.53 0 0 1 8 0c2.69 0 4.923 2 5.166 4.579C14.758 4.804 16 6.137 16 7.773 16 9.569 14.502 11 12.687 11H10a.5.5 0 0 1 0-1h2.688C13.979 10 15 8.988 15 7.773c0-1.216-1.02-2.228-2.313-2.228h-.5v-.5C12.188 2.825 10.328 1 8 1a4.53 4.53 0 0 0-2.941 1.1c-.757.652-1.153 1.438-1.153 2.055v.448l-.445.049C2.064 4.805 1 5.952 1 7.318 1 8.785 2.23 10 3.781 10H6a.5.5 0 0 1 0 1H3.781C1.708 11 0 9.366 0 7.318c0-1.763 1.266-3.223 2.942-3.593.143-.863.698-1.723 1.464-2.383z"/>
              <path fill-rule="evenodd" d="M7.646 4.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1-.708.708L8.5 5.707V14.5a.5.5 0 0 1-1 0V5.707L5.354 7.854a.5.5 0 1 1-.708-.708l3-3z"/>
            </svg>
            <h4 className="fs-5 mb-2">{isDragOver ? 'Drop your image here!' : 'Drag and drop your image here'}</h4>
            <p className="text-muted mb-3">
              or {selectedFile ? 'select a different file' : 'browse your device'}
            </p>
            <input
              ref={fileInputRef}
              type="file"
              id="fileInput"
              accept="image/*"
              onChange={handleFileChange}
              className="d-none"
              disabled={isUploading}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current.click()}
              className="btn btn-danger px-4"
              disabled={isUploading}
            >
              Choose File
            </button>
          </div>
        ) : (
          <div className="mb-4">
            <label htmlFor="imageUrl" className="form-label">Image URL</label>
            <div className="input-group mb-1">
              <span className="input-group-text">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-link" viewBox="0 0 16 16">
                  <path d="M6.354 5.5H4a3 3 0 0 0 0 6h3a3 3 0 0 0 2.83-4H9c-.086 0-.17.01-.25.031A2 2 0 0 1 7 10.5H4a2 2 0 1 1 0-4h1.535c.218-.376.495-.714.82-1z"/>
                  <path d="M9 5.5a3 3 0 0 0-2.83 4h1.098A2 2 0 0 1 9 6.5h3a2 2 0 1 1 0 4h-1.535a4.02 4.02 0 0 1-.82 1H12a3 3 0 1 0 0-6H9z"/>
                </svg>
              </span>
              <input 
                type="url" 
                id="imageUrl" 
                name="imageUrl" 
                placeholder="https://example.com/image.jpg" 
                value={formData.imageUrl} 
                onChange={handleUrlChange} 
                className={`form-control ${validationErrors.imageUrl ? 'is-invalid' : ''}`}
                disabled={isUploading}
              />
            </div>
            {validationErrors.imageUrl && (
              <div className="text-danger small">
                {validationErrors.imageUrl}
              </div>
            )}
          </div>
        )}
        
        {/* File preview */}
        {renderFilePreview()}
        
        {/* Progress bar */}
        {renderProgressBar()}
      </div>
    );
  };

  // Main form rendering
  return (
    <form ref={formRef} onSubmit={handleSubmit} className="card border-0 shadow-sm">
      <div className="card-body p-4">
        {/* File upload or URL area */}
        {renderUploadArea()}
        
        {/* Expand additional form fields */}
        {expanded && (
          <div className="mt-4">
            <div className="mb-3">
              <label htmlFor="title" className="form-label">Title</label>
              <input
                type="text"
                id="title"
                name="title"
                placeholder="Give your pin a title"
                value={formData.title}
                onChange={handleChange}
                className={`form-control ${validationErrors.title ? 'is-invalid' : ''}`}
                disabled={isUploading}
              />
              {validationErrors.title && (
                <div className="invalid-feedback">
                  {validationErrors.title}
                </div>
              )}
            </div>
            
            <div className="mb-3">
              <label htmlFor="description" className="form-label">Description</label>
              <textarea
                id="description"
                name="description"
                placeholder="Tell everyone what your pin is about"
                value={formData.description}
                onChange={handleChange}
                className="form-control"
                rows="3"
                disabled={isUploading}
              ></textarea>
            </div>
            
            <div className="mb-4">
              <label htmlFor="tags" className="form-label">Tags</label>
              <input
                type="text"
                id="tags"
                name="tags"
                placeholder="Add tags separated by commas (e.g. nature, travel, food)"
                value={formData.tags}
                onChange={handleChange}
                className="form-control"
                disabled={isUploading}
              />
              <small className="form-text text-muted">
                Add keywords that describe your pin to help it get discovered
              </small>
            </div>
          </div>
        )}
        
        {/* Errors */}
        {error && (
          <div className="alert alert-danger d-flex align-items-center mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-exclamation-triangle-fill me-2 flex-shrink-0" viewBox="0 0 16 16">
              <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
            </svg>
            <div>
              {error}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="d-flex justify-content-between">
          <button
            type="button"
            onClick={() => {
              if (expanded) {
                toggleExpand();
              } else {
                fileInputRef.current?.click();
              }
            }}
            className="btn btn-outline-secondary"
            disabled={isUploading}
          >
            {expanded ? 'Cancel' : 'Browse Files'}
          </button>
          
          {expanded && (
            <button
              type="submit"
              className="btn btn-danger"
              disabled={isUploading}
            >
              {isUploading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                  Uploading...
                </>
              ) : (
                'Upload Pin'
              )}
            </button>
          )}
        </div>
      </div>
    </form>
  );
};

export default ImageUploadForm;