import { createContext } from 'react';

// Create context with default values
const ToastContext = createContext({
  showToast: () => {},
  showSuccess: () => {},
  showError: () => {},
  showWarning: () => {},
  showInfo: () => {},
  removeToast: () => {}
});

export default ToastContext;
