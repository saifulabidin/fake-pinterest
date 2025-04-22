import React, { useState, useCallback, useMemo, useContext } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { Toast, ToastContainer } from '../components/Toast';
import { getPositionClasses } from '../utils/toastUtils';
import ToastContext from './createToastContext';

/**
 * Custom hook to access toast functionality
 * 
 * @returns {Object} Toast methods (showToast, showSuccess, showError, etc.)
 */
export const useToast = () => {
  const context = useContext(ToastContext);
  
  if (context === null) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  
  return context;
};

/**
 * Toast provider component that manages displaying toast notifications
 * with enhanced animation and positioning options
 * 
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components
 * @returns {JSX.Element} Provider component with toasts
 */
export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([]);
  
  // Remove a toast by its ID
  const removeToast = useCallback((id) => {
    setToasts(prevToasts => prevToasts.filter(toast => toast.id !== id));
  }, []);

  // Show a toast with the specified message and type
  const showToast = useCallback((message, type = 'info', options = {}) => {
    const id = uuidv4();
    const toast = {
      id,
      message,
      type,
      position: options.position || 'bottom-right',
      autoClose: options.autoClose !== undefined ? options.autoClose : 5000,
      icon: options.icon,
      action: options.action
    };
    
    setToasts(prevToasts => [toast, ...prevToasts]);
    return id;
  }, []);

  // Shorthand methods for different toast types
  const showSuccess = useCallback((message, options = {}) => {
    return showToast(message, 'success', options);
  }, [showToast]);

  const showError = useCallback((message, options = {}) => {
    return showToast(message, 'error', options);
  }, [showToast]);

  const showWarning = useCallback((message, options = {}) => {
    return showToast(message, 'warning', options);
  }, [showToast]);

  const showInfo = useCallback((message, options = {}) => {
    return showToast(message, 'info', options);
  }, [showToast]);

  // Group toasts by position for rendering
  const groupedToasts = useMemo(() => {
    const groups = {};
    toasts.forEach(toast => {
      if (!groups[toast.position]) {
        groups[toast.position] = [];
      }
      groups[toast.position].push(toast);
    });
    return groups;
  }, [toasts]);

  // Create context value object with all methods
  const contextValue = useMemo(() => ({
    showToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    removeToast
  }), [showToast, showSuccess, showError, showWarning, showInfo, removeToast]);

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <ToastContainer />
      
      {Object.keys(groupedToasts).map(position => (
        <div
          key={position}
          className={`position-fixed d-flex flex-column pe-none p-4 ${getPositionClasses(position)}`}
          style={{zIndex: 1050}}
        >
          {groupedToasts[position].map((toast) => (
            <Toast
              key={toast.id}
              id={toast.id}
              message={toast.message}
              type={toast.type}
              onClose={removeToast}
              autoClose={toast.autoClose}
              icon={toast.icon}
              action={toast.action}
              className="mb-3"
            />
          ))}
        </div>
      ))}
    </ToastContext.Provider>
  );
};