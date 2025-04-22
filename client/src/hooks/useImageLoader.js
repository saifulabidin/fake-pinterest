import { useState, useEffect } from 'react';

/**
 * Custom hook for handling image loading states
 * Provides loading states, error handling, and fallback images
 * 
 * @param {string} src - Source URL of the image to load
 * @param {string} [placeholder] - URL of placeholder image to show while loading
 * @param {string} [fallback] - URL of fallback image to show on error
 * @returns {Object} Image loading state and current source
 */
const useImageLoader = (src, placeholder = '', fallback = '') => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentSrc, setCurrentSrc] = useState(placeholder || src);

  useEffect(() => {
    // Reset state when src changes
    if (!src) {
      setLoading(false);
      setError('No image source provided');
      setCurrentSrc(fallback);
      return;
    }
    
    setLoading(true);
    setError(null);
    setCurrentSrc(placeholder || src);
    
    const image = new Image();
    
    // Add event listeners before setting src
    image.onload = () => {
      setLoading(false);
      setCurrentSrc(src);
    };
    
    image.onerror = () => {
      setLoading(false);
      setError(`Failed to load image: ${src}`);
      setCurrentSrc(fallback);
    };
    
    image.src = src;
    
    // Cleanup function
    return () => {
      // Cancel the image load
      image.src = '';
      image.onload = null;
      image.onerror = null;
    };
  }, [src, placeholder, fallback]);

  return { loading, error, currentSrc };
};

export default useImageLoader;