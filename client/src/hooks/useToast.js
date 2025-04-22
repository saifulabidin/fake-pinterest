import { useContext } from 'react';
import ToastContext from '../context/createToastContext';

/**
 * Custom hook to access toast functionality
 * 
 * @returns {Object} Toast methods (showToast, showSuccess, showError, etc.)
 */
const useToast = () => {
  const context = useContext(ToastContext);
  
  if (context === null) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  
  return context;
};

export default useToast;
