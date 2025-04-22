/**
 * Get the appropriate CSS classes for positioning toasts based on the position string
 * 
 * @param {string} position - Position string ('top-right', 'bottom-left', etc.)
 * @returns {string} CSS classes for positioning
 */
export const getPositionClasses = (position) => {
  switch (position) {
    case 'top-left':
      return 'top-0 start-0';
    case 'top-center':
      return 'top-0 start-50 translate-middle-x';
    case 'top-right':
      return 'top-0 end-0';
    case 'bottom-left':
      return 'bottom-0 start-0';
    case 'bottom-center':
      return 'bottom-0 start-50 translate-middle-x';
    case 'bottom-right':
      return 'bottom-0 end-0';
    default:
      return 'bottom-0 end-0'; // Default to bottom-right
  }
};
