import { useContext } from 'react';
import ThemeContext from '../context/createThemeContext';

/**
 * Custom hook for accessing the theme context
 * 
 * @returns {Object} Theme context value
 */
const useTheme = () => {
  const context = useContext(ThemeContext);
  
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  
  return context;
};

export default useTheme;