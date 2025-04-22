import { useContext } from 'react';
import AuthContext from '../context/createAuthContext';
import { useToast } from '../context/ToastContext';

/**
 * Custom hook for authentication functionality
 * Adds toast notifications for a better user experience
 * 
 * @returns {Object} Authentication state and functions
 */
const useAuth = () => {
  const authContext = useContext(AuthContext);
  const toast = useToast();
  
  if (!authContext) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  // Wrap auth methods with toast notifications
  const loginWithGithub = async () => {
    try {
      const result = await authContext.login();
      
      // If result is null, the user closed the popup - handle gracefully
      if (!result) {
        console.log('GitHub login cancelled by user');
        return { success: false, cancelled: true };
      }
      
      return result;
    } catch (error) {
      console.error('Login with Github error:', error);
      
      // Format error message for display
      let errorMessage = 'Authentication failed. Please try again.';
      if (error.code === 'auth/account-exists-with-different-credential') {
        errorMessage = 'An account already exists with the same email address but different sign-in credentials.';
      }
      
      return { 
        success: false, 
        error: errorMessage,
        cancelled: error.code === 'auth/popup-closed-by-user'
      };
    }
  };

  const login = async () => {
    try {
      const result = await authContext.login();
      toast.showSuccess(`Welcome back, ${result.user.displayName || result.user.username || 'User'}!`);
      return result;
    } catch (error) {
      toast.showError(`Login failed: ${error.message}`);
      throw error;
    }
  };
  
  const logout = async () => {
    try {
      await authContext.logout();
      toast.showInfo('You have been logged out successfully');
    } catch (error) {
      toast.showError(`Logout failed: ${error.message}`);
      throw error;
    }
  };
  
  const register = async (userData) => {
    try {
      const result = await authContext.register(userData);
      toast.showSuccess('Account created successfully!');
      return result;
    } catch (error) {
      toast.showError(`Registration failed: ${error.message}`);
      throw error;
    }
  };
  
  const updateProfile = async (profileData) => {
    try {
      const result = await authContext.updateProfile(profileData);
      toast.showSuccess('Profile updated successfully!');
      return result;
    } catch (error) {
      toast.showError(`Profile update failed: ${error.message}`);
      throw error;
    }
  };

  // Return the original context with wrapped methods
  return {
    ...authContext,
    loginWithGithub,
    login,
    logout,
    register,
    updateProfile,
  };
};

export default useAuth;