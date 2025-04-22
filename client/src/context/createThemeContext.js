import { createContext } from 'react';

// Create a context with default values
const ThemeContext = createContext({
  theme: 'system',
  setTheme: () => {},
  toggleTheme: () => {},
  systemTheme: 'light',
  effectiveTheme: 'light'
});

export default ThemeContext;
