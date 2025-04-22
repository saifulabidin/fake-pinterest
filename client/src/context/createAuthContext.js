import { createContext } from 'react';

/**
 * Default context values
 * 
 * @type {AuthContextValue}
 */
const defaultContextValue = {
  user: null,
  setUser: () => {},
  error: null,
  isAuthenticated: false,
  isAdmin: false,
  logout: () => {},
  login: () => {},
  loading: true
};

/**
 * Context for sharing authentication state across components
 * 
 * @type {React.Context<AuthContextValue>}
 */
const AuthContext = createContext(defaultContextValue);

export default AuthContext;
