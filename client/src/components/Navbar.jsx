import { useState, useEffect, useCallback } from 'react';
import { Link, useLocation } from 'react-router-dom';
import useAuth from '../hooks/useAuth';
import useTheme from '../hooks/useTheme';
import 'bootstrap/dist/css/bootstrap.min.css';

/**
 * Enhanced Navbar component with modern UI/UX features
 * 
 * @returns {JSX.Element} The navbar component
 */
const Navbar = () => {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [loading, setLoading] = useState(false);
  const { user, isAuthenticated, logout, loginWithGithub } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();

  // Add scroll event listener to track scrolling for navbar styling
  useEffect(() => {
    const handleScroll = () => {
      const offset = window.scrollY;
      if (offset > 10) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isDropdownOpen && !event.target.closest('.user-menu')) {
        setIsDropdownOpen(false);
      }
      
      if (isMobileMenuOpen && !event.target.closest('.mobile-menu') && 
          !event.target.closest('.mobile-menu-button')) {
        setIsMobileMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isDropdownOpen, isMobileMenuOpen]);

  // Rename to uppercase since it's not used (following naming convention)
  const CLOSE_DROPDOWN = () => {
    if (isMobileMenuOpen) {
      setIsMobileMenuOpen(false);
    }
  };

  // Close mobile menu on location change
  useEffect(() => {
    setIsMobileMenuOpen(false); // Simply set to false to avoid dependency issues
  }, [location.pathname]);

  /**
   * Handle user login with GitHub OAuth
   */
  const handleLogin = useCallback(async () => {
    try {
      setLoading(true);
      await loginWithGithub();
    } catch (error) {
      console.error('Login error:', error);
    } finally {
      setLoading(false);
    }
  }, [loginWithGithub]);

  /**
   * Handle user logout
   */
  const handleLogout = useCallback(async () => {
    try {
      await logout();
      setIsDropdownOpen(false);
    } catch (error) {
      console.error('Logout error:', error);
    }
  }, [logout]);

  /**
   * Renders the login button with GitHub OAuth
   * 
   * @returns {JSX.Element} Login button component
   */
  const renderLoginButton = () => (
    <button
      onClick={handleLogin}
      disabled={loading}
      className="btn btn-dark d-flex align-items-center position-relative"
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" className="me-2">
        <path fill="currentColor" fillRule="evenodd" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path>
      </svg>
      <span className={loading ? 'opacity-0' : 'opacity-100 transition-opacity'}>
        {loading ? 'Processing...' : 'Login with GitHub'}
      </span>
      {loading && (
        <div className="spinner-border spinner-border-sm position-absolute start-50 translate-middle-x" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      )}
    </button>
  );

  /**
   * Renders mobile menu toggle button
   * 
   * @returns {JSX.Element} Mobile toggle button component
   */
  const renderMobileMenuButton = () => (
    <button
      type="button"
      className="btn btn-link text-secondary d-md-none p-1"
      onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
    >
      {isMobileMenuOpen ? (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" className="bi bi-x" viewBox="0 0 16 16">
          <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.646 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" className="bi bi-list" viewBox="0 0 16 16">
          <path fillRule="evenodd" d="M2.5 12a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5z"/>
        </svg>
      )}
    </button>
  );

  /**
   * Renders navigation links
   * 
   * @returns {JSX.Element} Navigation links component
   */
  const renderNavLinks = () => (
    <div className="d-none d-md-flex">
      <Link 
        to="/" 
        className={`nav-link px-3 py-2 ${location.pathname === '/' ? 'text-danger' : 'text-secondary'}`}
      >
        Home
      </Link>
      
      <Link 
        to="/explore" 
        className={`nav-link px-3 py-2 ${location.pathname === '/explore' ? 'text-danger' : 'text-secondary'}`}
      >
        Explore
      </Link>
      
      {isAuthenticated && (
        <Link 
          to="/profile" 
          className={`nav-link px-3 py-2 ${location.pathname === '/profile' ? 'text-danger' : 'text-secondary'}`}
        >
          My Pins
        </Link>
      )}
    </div>
  );

  /**
   * Renders mobile menu
   * 
   * @returns {JSX.Element} Mobile menu component
   */
  const renderMobileMenu = () => (
    <div 
      className={`d-md-none position-fixed ${isMobileMenuOpen ? 'd-block' : 'd-none'}`}
      style={{ top: 0, right: 0, bottom: 0, left: 0, zIndex: 1040 }}
      aria-hidden={!isMobileMenuOpen}
    >
      {/* Backdrop */}
      <div 
        className="position-fixed bg-dark bg-opacity-50"
        style={{ backdropFilter: 'blur(4px)', top: 0, right: 0, bottom: 0, left: 0 }}
        onClick={() => setIsMobileMenuOpen(false)}
      ></div>
      
      {/* Mobile menu panel */}
      <div className="position-fixed bg-white h-100 shadow-lg end-0 top-0 overflow-auto mobile-menu" style={{ maxWidth: '300px', width: '100%' }}>
        <div className="d-flex align-items-center justify-content-between p-3 border-bottom">
          <div className="fs-4 fw-bold text-danger">
            Fake Pinterest
          </div>
          <button
            className="btn btn-link text-secondary p-2"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" className="bi bi-x" viewBox="0 0 16 16">
              <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.646 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
            </svg>
          </button>
        </div>
        
        <nav className="p-3">
          <Link 
            to="/"
            onClick={() => setIsMobileMenuOpen(false)} 
            className={`d-flex align-items-center p-3 mb-2 text-decoration-none rounded ${
              location.pathname === '/' 
                ? 'bg-danger bg-opacity-10 text-danger' 
                : 'text-secondary hover-bg-light'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" className="bi bi-house me-3" viewBox="0 0 16 16">
              <path fillRule="evenodd" d="M2 13.5V7h1v6.5a.5.5 0 0 0 .5.5h9a.5.5 0 0 0 .5-.5V7h1v6.5a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 2 13.5zm11-11V6l-2-2V2.5a.5.5 0 0 1 .5-.5h1a.5.5 0 0 1 .5.5z"/>
              <path fillRule="evenodd" d="M7.293 1.5a1 1 0 0 1 1.414 0l6.647 6.646a.5.5 0 0 1-.708.708L8 2.207 1.354 8.854a.5.5 0 1 1-.708-.708L7.293 1.5z"/>
            </svg>
            Home
          </Link>
          
          <Link 
            to="/explore"
            onClick={() => setIsMobileMenuOpen(false)}  
            className={`d-flex align-items-center p-3 mb-2 text-decoration-none rounded ${
              location.pathname === '/explore' 
                ? 'bg-danger bg-opacity-10 text-danger' 
                : 'text-secondary hover-bg-light'
            }`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" className="bi bi-compass me-3" viewBox="0 0 16 16">
              <path d="M8 16.016a7.5 7.5 0 0 0 1.962-14.74A1 1 0 0 0 9 0H7a1 1 0 0 0-.962 1.276A7.5 7.5 0 0 0 8 16.016zm6.5-7.5a6.5 6.5 0 1 1-13 0 6.5 6.5 0 0 1 13 0z"/>
              <path d="m6.94 7.44 4.95-2.83-2.83 4.95-4.949 2.83 2.828-4.95z"/>
            </svg>
            Explore
          </Link>
          
          {isAuthenticated && (
            <>
              <Link 
                to="/profile"  
                onClick={() => setIsMobileMenuOpen(false)}
                className={`d-flex align-items-center p-3 mb-2 text-decoration-none rounded ${
                  location.pathname === '/profile' 
                    ? 'bg-danger bg-opacity-10 text-danger' 
                    : 'text-secondary hover-bg-light'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" className="bi bi-person me-3" viewBox="0 0 16 16">
                  <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4zm-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10c-2.29 0-3.516.68-4.168 1.332-.678.678-.83 1.418-.832 1.664h10z"/>
                </svg>
                My Pins
              </Link>
              
              <div className="border-top my-3"></div>
              
              <div className="px-3 py-2">
                <div className="d-flex align-items-center mb-3">
                  <div className="me-3">
                    {user?.avatarUrl ? (
                      <img 
                        src={user.avatarUrl} 
                        alt={user.displayName || user.username}
                        className="rounded-circle border-2 border-light"
                        style={{ width: '48px', height: '48px', objectFit: 'cover' }}
                      />
                    ) : (
                      <div className="rounded-circle bg-danger d-flex align-items-center justify-content-center text-white" style={{ width: '48px', height: '48px' }}>
                        {(user?.displayName || user?.username || 'U')[0].toUpperCase()}
                      </div>
                    )}
                  </div>
                  <div>
                    <div className="fw-medium">{user?.displayName || user?.username}</div>
                    <div className="small text-secondary">{user?.email}</div>
                  </div>
                </div>
                
                <div className="d-flex justify-content-between mt-3">
                  <div className="form-check form-switch">
                    <input 
                      className="form-check-input" 
                      type="checkbox" 
                      id="darkModeToggleMobile" 
                      checked={theme === 'dark'} 
                      onChange={toggleTheme} 
                    />
                    <label className="form-check-label" htmlFor="darkModeToggleMobile">
                      {theme === 'dark' ? 'Dark Mode' : 'Light Mode'}
                    </label>
                  </div>
                </div>
                
                <button
                  onClick={handleLogout}
                  className="btn btn-outline-danger w-100 mt-3"
                >
                  Sign Out
                </button>
              </div>
            </>
          )}
          
          {!isAuthenticated && (
            <div className="p-3 mt-4">
              <button 
                onClick={handleLogin}
                className="btn btn-dark w-100 d-flex align-items-center justify-content-center"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" className="me-2">
                  <path fill="currentColor" fillRule="evenodd" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0016 8c0-4.42-3.58-8-8-8z"></path>
                </svg>
                Login with GitHub
              </button>
            </div>
          )}
        </nav>
      </div>
    </div>
  );

  /**
   * Renders the user dropdown menu
   * 
   * @returns {JSX.Element} User dropdown component
   */
  const renderUserDropdown = () => (
    <div className="user-menu dropdown">
      <button
        className="btn btn-link text-decoration-none text-secondary p-1 d-flex align-items-center"
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        aria-expanded={isDropdownOpen}
        aria-haspopup="true"
      >
        <div className="me-2 d-flex align-items-center">
          {user?.avatarUrl ? (
            <img 
              src={user.avatarUrl} 
              alt={user.displayName || user.username}
              className="rounded-circle border border-2 border-light"
              style={{ width: '36px', height: '36px', objectFit: 'cover' }}
            />
          ) : (
            <div className="rounded-circle d-flex align-items-center justify-content-center text-white" 
              style={{ 
                width: '36px', 
                height: '36px',
                background: 'linear-gradient(to bottom right, #dc3545, #fd7e14)'
              }}>
              {(user?.displayName || user?.username || 'U')[0].toUpperCase()}
            </div>
          )}
          <span className="position-absolute bottom-0 end-0 p-1">
            <span className="badge bg-success rounded-circle p-1"></span>
          </span>
        </div>
        
        <div className="d-none d-lg-block">
          <span className="me-1">
            {user?.displayName || user?.username}
          </span>
          <svg 
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16" 
            fill="currentColor" 
            className={`transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
            viewBox="0 0 16 16"
          >
            <path fillRule="evenodd" d="M1.646 4.646a.5.5 0 0 1 .708 0L8 10.293l5.646-5.647a.5.5 0 0 1 .708.708l-6 6a.5.5 0 0 1-.708 0l-6-6a.5.5 0 0 1 0-.708z"/>
          </svg>
        </div>
      </button>
      
      {/* Dropdown menu */}
      {isDropdownOpen && (
        <div className="dropdown-menu dropdown-menu-end shadow-sm mt-2 show" style={{ minWidth: '240px' }}>
          <div className="px-3 py-2 border-bottom">
            <p className="text-secondary small mb-1">Signed in as</p>
            <p className="mb-0 text-truncate fw-medium">{user?.email || user?.username}</p>
          </div>
          <Link to="/profile" className="dropdown-item py-2" onClick={() => setIsDropdownOpen(false)}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-person me-2" viewBox="0 0 16 16">
              <path d="M8 8a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm2-3a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm4 8c0 1-1 1-1 1H3s-1 0-1-1 1-4 6-4 6 3 6 4zm-1-.004c-.001-.246-.154-.986-.832-1.664C11.516 10.68 10.289 10 8 10c-2.29 0-3.516.68-4.168 1.332-.678.678-.83 1.418-.832 1.664h10z"/>
            </svg>
            Your Profile
          </Link>
          <Link to="/settings" className="dropdown-item py-2" onClick={() => setIsDropdownOpen(false)}>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-gear me-2" viewBox="0 0 16 16">
              <path d="M8 4.754a3.246 3.246 0 1 0 0 6.492 3.246 3.246 0 0 0 0-6.492zM5.754 8a2.246 2.246 0 1 1 4.492 0 2.246 2.246 0 0 1-4.492 0z"/>
              <path d="M9.796 1.343c-.527-1.79-3.065-1.79-3.592 0l-.094.319a.873.873 0 0 1-1.255.52l-.292-.16c-1.64-.892-3.433.902-2.54 2.541l.159.292a.873.873 0 0 1-.52 1.255l-.319.094c-1.79.527-1.79 3.065 0 3.592l.319.094a.873.873 0 0 1 .52 1.255l-.16.292c-.892 1.64.901 3.434 2.541 2.54l.292-.159a.873.873 0 0 1 1.255.52l.094.319c.527 1.79 3.065 1.79 3.592 0l.094-.319a.873.873 0 0 1 1.255-.52l.292.16c1.64.893 3.434-.902 2.54-2.541l-.159-.292a.873.873 0 0 1 .52-1.255l.319-.094c1.79-.527 1.79-3.065 0-3.592l-.319-.094a.873.873 0 0 1-.52-1.255l.16-.292c.893-1.64-.902-3.433-2.541-2.54l-.292.159a.873.873 0 0 1-1.255-.52l-.094-.319zm-2.633.283c.246-.835 1.428-.835 1.674 0l.094.319a1.873 1.873 0 0 0 2.693 1.115l.291-.16c.764-.415 1.6.42 1.184 1.185l-.159.292a1.873 1.873 0 0 0 1.116 2.692l.318.094c.835.246.835 1.428 0 1.674l-.319.094a1.873 1.873 0 0 0-1.115 2.693l.16.291c.415.764-.42 1.6-1.185 1.184l-.291-.159a1.873 1.873 0 0 0-2.693 1.116l-.094.318c-.246.835-1.428.835-1.674 0l-.094-.319a1.873 1.873 0 0 0-2.692-1.115l-.292.16c-.764.415-1.6-.42-1.184-1.185l.159-.291A1.873 1.873 0 0 0 1.945 8.93l-.319-.094c-.835-.246-.835-1.428 0-1.674l.319-.094A1.873 1.873 0 0 0 3.06 4.377l-.16-.292c-.415-.764.42-1.6 1.185-1.184l.292.159a1.873 1.873 0 0 0 2.692-1.115l.094-.319z"/>
            </svg>
            Settings
          </Link>
          <div className="dropdown-divider"></div>
          <div className="px-3 py-2 d-flex align-items-center justify-content-between">
            <span className="text-secondary small">Theme</span>
            <div className="form-check form-switch">
              <input 
                className="form-check-input" 
                type="checkbox" 
                id="darkModeToggle" 
                checked={theme === 'dark'} 
                onChange={toggleTheme} 
              />
              <label className="form-check-label" htmlFor="darkModeToggle">
                {theme === 'dark' ? 'Dark' : 'Light'}
              </label>
            </div>
          </div>
          <div className="dropdown-divider"></div>
          <button 
            className="dropdown-item py-2 text-danger"
            onClick={handleLogout}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-box-arrow-right me-2" viewBox="0 0 16 16">
              <path fillRule="evenodd" d="M10 12.5a.5.5 0 0 1-.5.5h-8a.5.5 0 0 1-.5-.5v-9a.5.5 0 0 1 .5-.5h8a.5.5 0 0 1 .5.5v2a.5.5 0 0 0 1 0v-2A1.5 1.5 0 0 0 9.5 2h-8A1.5 1.5 0 0 0 0 3.5v9A1.5 1.5 0 0 0 1.5 14h8a1.5 1.5 0 0 0 1.5-1.5v-2a.5.5 0 0 0-1 0v2z"/>
              <path fillRule="evenodd" d="M15.854 8.354a.5.5 0 0 0 0-.708l-3-3a.5.5 0 0 0-.708.708L14.293 7.5H5.5a.5.5 0 0 0 0 1h8.793l-2.147 2.146a.5.5 0 0 0 .708.708l3-3z"/>
            </svg>
            Sign out
          </button>
        </div>
      )}
    </div>
  );

  return (
    <nav className={`sticky-top bg-white py-2 shadow-sm ${scrolled ? 'shadow' : ''}`} style={{transition: 'all 0.3s'}}>
      <div className="container">
        <div className="d-flex justify-content-between align-items-center">
          <div className="d-flex align-items-center">
            <Link to="/" className="text-decoration-none d-flex align-items-center">
              <div className="d-flex align-items-center">
                <svg className="text-danger me-2" width="32" height="32" fill="currentColor" viewBox="0 0 16 16">
                  <path d="M8 0a8 8 0 0 0-2.915 15.452c-.07-.633-.134-1.606.027-2.297.146-.625.938-3.977.938-3.977s-.239-.479-.239-1.187c0-1.113.645-1.943 1.448-1.943.682 0 1.012.512 1.012 1.127 0 .686-.437 1.712-.663 2.663-.188.796.4 1.446 1.185 1.446 1.422 0 2.515-1.5 2.515-3.664 0-1.915-1.377-3.254-3.342-3.254-2.276 0-3.612 1.707-3.612 3.471 0 .688.265 1.425.595 1.826a.24.24 0 0 1 .056.23c-.061.252-.196.796-.222.907-.035.146-.116.177-.268.107-1-.465-1.624-1.926-1.624-3.1 0-2.523 1.834-4.84 5.286-4.84 2.775 0 4.932 1.977 4.932 4.62 0 2.757-1.739 4.976-4.151 4.976-.811 0-1.573-.421-1.834-.919l-.498 1.902c-.181.695-.669 1.566-.995 2.097A8 8 0 1 0 8 0z"/>
                </svg>
                <span className="fs-4 fw-bold text-danger d-none d-sm-inline">
                  Fake Pinterest
                </span>
              </div>
            </Link>
            
            {/* Desktop navigation */}
            {renderNavLinks()}
          </div>
          
          {/* Right side: user menu or login */}
          <div className="d-flex align-items-center">
            <div className="d-none d-md-block">
              {isAuthenticated ? renderUserDropdown() : renderLoginButton()}
            </div>
            {renderMobileMenuButton()}
          </div>
        </div>
      </div>
      
      {/* Mobile menu */}
      {renderMobileMenu()}
    </nav>
  );
};

export default Navbar;