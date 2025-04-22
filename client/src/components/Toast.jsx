import { useState, useEffect, memo, useCallback } from 'react';
import { createPortal } from 'react-dom';

/**
 * Individual Toast notification component with various styling based on type
 * Enhanced with better animations and additional features
 * 
 * @param {Object} props - Component props
 * @param {string} props.id - Unique ID for the toast
 * @param {string} props.message - Message to display
 * @param {string} props.type - Type of toast (success, error, info, warning)
 * @param {Function} props.onClose - Function to call when closing the toast
 * @param {number} [props.autoClose=5000] - Auto close duration in ms, 0 to disable
 * @param {React.ReactNode} [props.icon] - Optional custom icon to override default
 * @param {Object} [props.action] - Optional action button configuration
 * @param {string} [props.className] - Additional CSS classes
 * @returns {JSX.Element} Rendered toast component
 */
const Toast = ({ 
  id, 
  message, 
  type = 'info', 
  onClose, 
  autoClose = 5000,
  icon: customIcon,
  action,
  className = ''
}) => {
  const [isExiting, setIsExiting] = useState(false);
  const [progress, setProgress] = useState(100);
  const [isPaused, setIsPaused] = useState(false);
  
  // Wrap handleClose in useCallback to prevent recreation on each render
  const handleClose = useCallback(() => {
    setIsExiting(true);
    
    // Wait for exit animation to complete before removing
    setTimeout(() => {
      onClose(id);
    }, 300);
  }, [id, onClose]);
  
  // Auto-close the toast after the specified duration with progress tracking
  useEffect(() => {
    if (autoClose && autoClose > 0) {
      const timer = setTimeout(() => {
        handleClose();
      }, autoClose);
      
      return () => clearTimeout(timer);
    }
  }, [autoClose, handleClose]);

  useEffect(() => {
    if (autoClose <= 0) return;

    const startTime = Date.now();
    const endTime = startTime + autoClose;
    
    const updateProgress = () => {
      if (isPaused) return;
      
      const now = Date.now();
      const remaining = Math.max(0, endTime - now);
      const newProgress = (remaining / autoClose) * 100;
      
      setProgress(newProgress);
      
      if (newProgress <= 0) {
        handleClose();
      } else {
        requestAnimationFrame(updateProgress);
      }
    };

    const animationId = requestAnimationFrame(updateProgress);
    
    return () => cancelAnimationFrame(animationId);
  }, [autoClose, isPaused, handleClose]);

  // Define the icon based on toast type
  const getIcon = () => {
    // Return custom icon if provided
    if (customIcon) return customIcon;
    
    // Otherwise use default icons
    switch (type) {
      case 'success':
        return (
          <svg className="bi bi-check-circle-fill text-success" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
            <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zm-3.97-3.03a.75.75 0 0 0-1.08.022L7.477 9.417 5.384 7.323a.75.75 0 0 0-1.06 1.06L6.97 11.03a.75.75 0 0 0 1.079-.02l3.992-4.99a.75.75 0 0 0-.01-1.05z"/>
          </svg>
        );
      case 'error':
        return (
          <svg className="bi bi-x-circle-fill text-danger" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
            <path d="M16 8A8 8 0 1 1 0 8a8 8 0 0 1 16 0zM5.354 4.646a.5.5 0 1 0-.708.708L7.293 8l-2.647 2.646a.5.5 0 0 0 .708.708L8 8.707l2.646 2.647a.5.5 0 0 0 .708-.708L8.707 8l2.647-2.646a.5.5 0 0 0-.708-.708L8 7.293 5.354 4.646z"/>
          </svg>
        );
      case 'warning':
        return (
          <svg className="bi bi-exclamation-triangle-fill text-warning" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
            <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
          </svg>
        );
      default: // info
        return (
          <svg className="bi bi-info-circle-fill text-info" width="20" height="20" fill="currentColor" viewBox="0 0 16 16">
            <path d="M8 16A8 8 0 1 0 8 0a8 8 0 0 0 0 16zm.93-9.412-1 4.705c-.07.34.029.533.304.533.194 0 .487-.07.686-.246l-.088.416c-.287.346-.92.598-1.465.598-.703 0-1.002-.422-.808-1.319l.738-3.468c.064-.293.006-.399-.287-.47l-.451-.081.082-.381 2.29-.287zM8 5.5a1 1 0 1 1 0-2 1 1 0 0 1 0 2z"/>
          </svg>
        );
    }
  };

  // Determine toast background color based on type
  const getToastClasses = () => {
    const baseClasses = `d-flex flex-column rounded shadow-sm w-100 fade ${isExiting ? 'hide' : 'show'} ${className}`;
      
    switch (type) {
      case 'success':
        return `${baseClasses} border-start border-4 border-success bg-white`;
      case 'error':
        return `${baseClasses} border-start border-4 border-danger bg-white`;
      case 'warning':
        return `${baseClasses} border-start border-4 border-warning bg-white`;
      default: // info
        return `${baseClasses} border-start border-4 border-info bg-white`;
    }
  };

  // Get the progress bar color based on toast type
  const getProgressColor = () => {
    switch (type) {
      case 'success': return 'bg-success';
      case 'error': return 'bg-danger';
      case 'warning': return 'bg-warning';
      default: return 'bg-info';
    }
  };

  // Render action button if provided
  const renderActionButton = () => {
    if (!action) return null;
    
    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          if (action.onClick) action.onClick();
          if (action.closeOnClick !== false) handleClose();
        }}
        className="btn btn-link btn-sm mt-1 p-0 text-decoration-none"
      >
        {action.label}
      </button>
    );
  };

  return (
    <div 
      className={getToastClasses()} 
      role="alert"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      style={{maxWidth: '350px', transition: 'all 0.3s ease'}}
    >
      <div className="d-flex align-items-start p-3">
        <div className="me-3">
          {getIcon()}
        </div>
        <div className="flex-grow-1">
          <div className="small fw-medium text-dark">
            {message}
          </div>
          {renderActionButton()}
        </div>
        <button
          onClick={handleClose}
          className="btn-close btn-close-sm ms-3"
          aria-label="Close"
        >
        </button>
      </div>
      
      {/* Progress bar - only shown for toasts with autoClose */}
      {autoClose > 0 && (
        <div className="position-relative w-100 bg-light" style={{height: '4px'}}>
          <div 
            className={`position-absolute start-0 bottom-0 h-100 ${getProgressColor()}`}
            style={{ width: `${progress}%`, transition: 'width 0.3s linear' }}
          />
        </div>
      )}
    </div>
  );
};

/**
 * Toast container component that manages all toast notifications
 * Uses React Portal to render toasts at the top level of the DOM
 * 
 * @returns {ReactPortal} Portal containing all toasts
 */
const ToastContainer = memo(() => {
  return createPortal(
    <div className="toast-container-root">
      {/* The actual toasts are rendered via the ToastContext provider */}
    </div>,
    document.body
  );
});

ToastContainer.displayName = 'ToastContainer';

export { Toast, ToastContainer };