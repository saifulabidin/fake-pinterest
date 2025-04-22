import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import ImageCard from '../components/ImageCard';
import ImageUploadForm from '../components/ImageUploadForm';
import useAuth from '../hooks/useAuth';
import useImageAPI from '../hooks/useImageAPI';
import { useToast } from '../context/ToastContext';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css';

// Skeleton loader for profile header
const ProfileHeaderSkeleton = () => (
  <div className="d-flex flex-column align-items-center mb-4 bg-white card p-4 shadow-sm animate-pulse">
    <div className="rounded-circle bg-light placeholder" style={{ height: '96px', width: '96px' }}></div>
    <div className="bg-light placeholder mt-3" style={{ height: '32px', width: '250px' }}></div>
    <div className="bg-light placeholder mt-2" style={{ height: '16px', width: '160px' }}></div>
  </div>
);

// Skeleton loader for image cards
const ImageCardSkeleton = () => (
  <div className="mb-4 card rounded-3 shadow-sm">
    <div className="bg-light placeholder" style={{ height: '240px' }}></div>
    <div className="p-4">
      <div className="bg-light placeholder mb-2" style={{ height: '16px', width: '75%' }}></div>
      <div className="bg-light placeholder" style={{ height: '16px', width: '50%' }}></div>
    </div>
  </div>
);

/**
 * Profile page component that shows a user's images
 * Can be the current user's profile or another user's profile
 * Enhanced with modern UI/UX features
 * 
 * @returns {JSX.Element} The rendered profile page
 */
function ProfilePage() {
  const { username } = useParams();
  const [profileUser, setProfileUser] = useState(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [profileError, setProfileError] = useState(null);
  const [images, setImages] = useState([]);
  const [filteredImages, setFilteredImages] = useState([]);
  const [activeTab, setActiveTab] = useState('gallery');
  const [filterTag, setFilterTag] = useState('');
  const [savedImages, setSavedImages] = useState([]);
  const [isLoadingSaved, setIsLoadingSaved] = useState(false);
  const { showToast } = useToast();
  const { isAuthenticated, user } = useAuth();
  const [userStats, setUserStats] = useState({
    imageCount: 0,
    viewCount: 0,
    totalLikes: 0,
    joinDate: null,
    popularCategories: []
  });
  
  const { 
    getAllImages, 
    loading: isLoadingImages, 
    error: imageError 
  } = useImageAPI();
  
  // Is this the current user's profile?
  const isOwnProfile = !username && isAuthenticated;

  // Combine all errors for display
  const error = imageError || profileError;
  
  // Any type of loading
  const IS_LOADING = isLoadingImages || isLoadingProfile;

  /**
   * Load profile user data from API
   */
  const loadProfileUser = useCallback(async () => {
    try {
      setIsLoadingProfile(true);
      setProfileError(null);
      
      let userData;
      if (isOwnProfile) {
        // Use current user's data if viewing own profile
        userData = user;
      } else {
        // Fetch user data from API if viewing another user's profile
        const response = await axios.get(`/api/auth/user/${username}`);
        userData = response.data;
      }
      
      setProfileUser(userData);
      
      // Calculate user stats
      const joinDate = userData.createdAt ? new Date(userData.createdAt) : new Date();
      
      setUserStats(prev => ({
        ...prev,
        joinDate,
        imageCount: userData.imageCount || 0,
        viewCount: userData.viewCount || 0
      }));
      
    } catch (err) {
      console.error('Error loading profile user:', err);
      setProfileError('Failed to load user profile');
    } finally {
      setIsLoadingProfile(false);
    }
  }, [username, isOwnProfile, user]);

  /**
   * Load images created by the profile user
   */
  const loadImages = useCallback(async () => {
    try {
      let imagesData;
      
      if (isOwnProfile) {
        // Get current user's images
        imagesData = await getAllImages({ userId: user?._id });
      } else if (profileUser?._id) {
        // Get another user's public images
        imagesData = await getAllImages({ userId: profileUser._id });
      }
      
      // Extract the images array from the response
      const imageArray = imagesData && imagesData.images ? imagesData.images : [];
      
      setImages(imageArray);
      setFilteredImages(imageArray);
      
      // Update stats
      setUserStats(prev => ({
        ...prev,
        imageCount: imageArray.length || 0,
        // Calculate popular categories
        popularCategories: calculatePopularCategories(imageArray)
      }));
      
    } catch (err) {
      console.error('Error in loadImages:', err);
    }
  }, [getAllImages, profileUser, isOwnProfile, user]);

  /**
   * Calculate most used categories/tags from user's images
   * 
   * @param {Array} userImages - Array of image objects
   * @returns {Array} Array of category objects with counts
   */
  const calculatePopularCategories = (userImages) => {
    // Ensure userImages is an array before processing
    if (!Array.isArray(userImages)) {
      console.warn('userImages is not an array:', userImages);
      return [];
    }
    
    // Extract all tags from images and count occurrences
    const tagCounts = {};
    
    userImages.forEach(image => {
      if (image.tags && Array.isArray(image.tags)) {
        image.tags.forEach(tag => {
          tagCounts[tag] = (tagCounts[tag] || 0) + 1;
        });
      }
    });
    
    // Convert to array and sort by frequency
    const sortedTags = Object.entries(tagCounts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    
    return sortedTags;
  };

  /**
   * Filter images based on tag
   * 
   * @param {string} tag - Tag to filter by
   */
  const handleTagFilter = (tag) => {
    if (filterTag === tag) {
      // If clicking the same tag, clear the filter
      setFilterTag('');
      setFilteredImages(images);
    } else {
      // Apply the new filter
      setFilterTag(tag);
      const filtered = images.filter(img => 
        img.tags && img.tags.some(t => t.toLowerCase() === tag.toLowerCase())
      );
      setFilteredImages(filtered);
    }
  };

  /**
   * Load user's saved images
   */
  const loadSavedImages = useCallback(async () => {
    if (!isAuthenticated || !isOwnProfile) return;
    
    try {
      setIsLoadingSaved(true);
      // In a real app, this would call an API to get saved images
      // For now, we'll just simulate with a timeout and use normal images
      await new Promise(resolve => setTimeout(resolve, 800));
      setSavedImages(images.slice(0, 3));
    } catch (err) {
      console.error('Error loading saved images:', err);
      showToast('Failed to load saved images', 'error');
    } finally {
      setIsLoadingSaved(false);
    }
  }, [isAuthenticated, isOwnProfile, images, showToast]);

  // Initial data loading
  useEffect(() => {
    loadProfileUser();
  }, [loadProfileUser]);
  
  // Load images when profile user changes
  useEffect(() => {
    if (profileUser) {
      loadImages();
    }
  }, [profileUser, loadImages]);
  
  // Load saved images when tab changes to 'saved'
  useEffect(() => {
    if (activeTab === 'saved') {
      loadSavedImages();
    }
  }, [activeTab, loadSavedImages]);

  /**
   * Renders the profile header with user information
   * 
   * @returns {JSX.Element|null} The profile header or null if loading
   */
  const renderProfileHeader = () => {
    if (isLoadingProfile) {
      return <ProfileHeaderSkeleton />;
    }

    if (!profileUser) return null;

    return (
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="mb-4"
      >
        <div className="bg-white card p-4 shadow-sm rounded-4">
          <div className="d-flex flex-column flex-md-row align-items-center align-items-md-start">
            <div className="flex-shrink-0 mb-3 mb-md-0 me-md-4">
              {profileUser.avatarUrl ? (
                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  className="position-relative"
                >
                  <img
                    src={profileUser.avatarUrl}
                    alt={profileUser.displayName || profileUser.username}
                    className="rounded-circle shadow-sm border border-2 border-light"
                    style={{ width: '120px', height: '120px', objectFit: 'cover' }}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = `https://ui-avatars.com/api/?name=${profileUser.displayName || profileUser.username}&background=random`;
                    }}
                  />
                  <div className="position-absolute bottom-0 end-0 badge bg-success rounded-circle border border-2 border-white" 
                    style={{ height: '20px', width: '20px' }}></div>
                </motion.div>
              ) : (
                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  className="position-relative"
                >
                  <div 
                    className="rounded-circle d-flex align-items-center justify-content-center bg-danger text-white fs-2 shadow-sm"
                    style={{ width: '120px', height: '120px' }}
                  >
                    {(profileUser.displayName || profileUser.username || '?')[0].toUpperCase()}
                  </div>
                  <div className="position-absolute bottom-0 end-0 badge bg-success rounded-circle border border-2 border-white" 
                    style={{ height: '20px', width: '20px' }}></div>
                </motion.div>
              )}
            </div>
            
            <div className="text-center text-md-start">
              <h1 className="fs-2 fw-bold mb-2">
                {profileUser.displayName || profileUser.username}
              </h1>
              
              {profileUser.bio && (
                <p className="text-secondary mb-3">{profileUser.bio}</p>
              )}
              
              <div className="d-flex flex-wrap justify-content-center justify-content-md-start gap-3 mb-3">
                <div className="badge bg-light text-dark px-3 py-2 d-flex align-items-center rounded-pill">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" className="bi bi-image me-1" viewBox="0 0 16 16">
                    <path d="M6.002 5.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z"/>
                    <path d="M2.002 1a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2h-12zm12 1a1 1 0 0 1 1 1v6.5l-3.777-1.947a.5.5 0 0 0-.577.093l-3.71 3.71-2.66-1.772a.5.5 0 0 0-.63.062L1.002 12V3a1 1 0 0 1 1-1h12z"/>
                  </svg>
                  <span>{userStats.imageCount} Posts</span>
                </div>
                
                <div className="badge bg-light text-dark px-3 py-2 d-flex align-items-center rounded-pill">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" fill="currentColor" className="bi bi-calendar3 me-1" viewBox="0 0 16 16">
                    <path d="M14 0H2a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2zM1 3.857C1 3.384 1.448 3 2 3h12c.552 0 1 .384 1 .857v10.286c0 .473-.448.857-1 .857H2c-.552 0-1-.384-1-.857V3.857z"/>
                    <path d="M6.5 7a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm3 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm3 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm-9 3a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm3 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm3 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm3 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm-9 3a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm3 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm3 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2z"/>
                  </svg>
                  <span>Joined {userStats.joinDate?.toLocaleDateString() || 'Recently'}</span>
                </div>
              </div>
              
              {isOwnProfile && (
                <button className="btn btn-outline-secondary btn-sm d-flex align-items-center">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-pencil-square me-1" viewBox="0 0 16 16">
                    <path d="M15.502 1.94a.5.5 0 0 1 0 .706L14.459 3.69l-2-2L13.502.646a.5.5 0 0 1 .707 0l1.293 1.293zm-1.75 2.456-2-2L4.939 9.21a.5.5 0 0 0-.121.196l-.805 2.414a.25.25 0 0 0 .316.316l2.414-.805a.5.5 0 0 0 .196-.12l6.813-6.814z"/>
                    <path fillRule="evenodd" d="M1 13.5A1.5 1.5 0 0 0 2.5 15h11a1.5 1.5 0 0 0 1.5-1.5v-6a.5.5 0 0 0-1 0v6a.5.5 0 0 1-.5.5h-11a.5.5 0 0 1-.5-.5v-11a.5.5 0 0 1 .5-.5H9a.5.5 0 0 0 0-1H2.5A1.5 1.5 0 0 0 1 2.5v11z"/>
                  </svg>
                  Edit Profile
                </button>
              )}
            </div>
          </div>
          
          {/* Profile navigation tabs */}
          <div className="mt-4">
            <nav className="nav nav-pills nav-fill">
              <button 
                onClick={() => setActiveTab('gallery')}
                className={`nav-link ${activeTab === 'gallery' ? 'active bg-danger' : 'text-secondary'}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-grid-3x3-gap me-2" viewBox="0 0 16 16">
                  <path d="M4 2v2H2V2h2zm1 12v-2a1 1 0 0 0-1-1H2a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1zm0-5V7a1 1 0 0 0-1-1H2a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1zm0-5V2a1 1 0 0 0-1-1H2a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1zm5 10v-2a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1zm0-5V7a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1zm0-5V2a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1zM9 2v2H7V2h2zm5 0v2h-2V2h2zM4 7v2H2V7h2zm5 0v2H7V7h2zm5 0v2h-2V7h2zM4 12v2H2v-2h2zm5 0v2H7v-2h2zm5 0v2h-2v-2h2zM12 1a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1h-2zm-1 6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v2a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1V7zm1 4a1 1 0 0 0-1 1v2a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1h-2z"/>
                </svg>
                Gallery
              </button>
              
              {isOwnProfile && (
                <button 
                  onClick={() => setActiveTab('saved')}
                  className={`nav-link ${activeTab === 'saved' ? 'active bg-danger' : 'text-secondary'}`}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-bookmark me-2" viewBox="0 0 16 16">
                    <path d="M2 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v13.5a.5.5 0 0 1-.777.416L8 13.101l-5.223 2.815A.5.5 0 0 1 2 15.5V2zm2-1a1 1 0 0 0-1 1v12.566l4.723-2.482a.5.5 0 0 1 .554 0L13 14.566V2a1 1 0 0 0-1-1H4z"/>
                  </svg>
                  Saved
                </button>
              )}
              
              <button 
                onClick={() => setActiveTab('stats')}
                className={`nav-link ${activeTab === 'stats' ? 'active bg-danger' : 'text-secondary'}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-bar-chart me-2" viewBox="0 0 16 16">
                  <path d="M4 11H2v3h2v-3zm5-4H7v7h2V7zm5-5v12h-2V2h2zm-2-1a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1h-2zM6 7a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v7a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V7zm-5 4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v3a1 1 0 0 1-1 1H2a1 1 0 0 1-1-1v-3z"/>
                </svg>
                Stats
              </button>
            </nav>
          </div>
        </div>
      </motion.div>
    );
  };

  /**
   * Renders the profile statistics tab content
   * 
   * @returns {JSX.Element} Profile statistics
   */
  const renderStatsTab = () => {
    if (!profileUser) return null;
    
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className="bg-white card p-4 rounded-4 shadow-sm"
      >
        <h2 className="fs-4 fw-bold mb-4">User Statistics</h2>
        
        <div className="row g-4 mb-4">
          <div className="col-md-4">
            <div className="card h-100 border-0 bg-light">
              <div className="card-body d-flex flex-column align-items-center justify-content-center text-center">
                <div className="display-4 fw-bold text-danger mb-2">{userStats.imageCount}</div>
                <div className="text-secondary">Total Images</div>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card h-100 border-0 bg-light">
              <div className="card-body d-flex flex-column align-items-center justify-content-center text-center">
                <div className="display-4 fw-bold text-danger mb-2">{userStats.viewCount || 0}</div>
                <div className="text-secondary">Total Views</div>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card h-100 border-0 bg-light">
              <div className="card-body d-flex flex-column align-items-center justify-content-center text-center">
                <div className="display-4 fw-bold text-danger mb-2">{userStats.totalLikes || 0}</div>
                <div className="text-secondary">Total Likes</div>
              </div>
            </div>
          </div>
        </div>
        
        <h3 className="fs-5 fw-semibold mb-3">Popular Categories</h3>
        {userStats.popularCategories.length > 0 ? (
          <div className="d-flex flex-wrap gap-2 mb-4">
            {userStats.popularCategories.map(({tag, count}) => (
              <div 
                key={tag} 
                className="badge bg-light text-dark d-flex align-items-center px-3 py-2"
              >
                <span>{tag}</span>
                <span className="ms-2 badge bg-danger rounded-pill">{count}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-secondary fst-italic">No categories yet</p>
        )}
        
        <div className="card bg-light border-0 p-3">
          <div className="card-body">
            <h3 className="fs-5 fw-semibold mb-3">Account Info</h3>
            <ul className="list-group list-group-flush">
              <li className="list-group-item bg-transparent px-0 d-flex justify-content-between">
                <span>Username</span>
                <span className="fw-medium">{profileUser.username}</span>
              </li>
              <li className="list-group-item bg-transparent px-0 d-flex justify-content-between">
                <span>Joined</span>
                <span className="fw-medium">{userStats.joinDate?.toLocaleDateString() || 'Recently'}</span>
              </li>
              <li className="list-group-item bg-transparent px-0 d-flex justify-content-between">
                <span>Status</span>
                <span className="badge bg-success">Active</span>
              </li>
            </ul>
          </div>
        </div>
      </motion.div>
    );
  };

  /**
   * Renders skeleton loaders during loading state
   * 
   * @returns {JSX.Element} Multiple skeleton loaders in grid layout
   */
  const renderSkeletons = () => (
    <div className="row g-4">
      {Array.from({ length: 6 }).map((_, index) => (
        <div key={`skeleton-${index}`} className="col-12 col-sm-6 col-md-4 col-lg-3 col-xl-2">
          <ImageCardSkeleton />
        </div>
      ))}
    </div>
  );

  /**
   * Renders error state with improved styling
   * 
   * @returns {JSX.Element} Error message component
   */
  const renderError = () => (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="alert alert-danger border-start border-danger border-5 shadow-sm"
      role="alert"
    >
      <div className="d-flex">
        <svg className="bi flex-shrink-0 me-3" width="24" height="24" fill="currentColor" viewBox="0 0 16 16">
          <path d="M8.982 1.566a1.13 1.13 0 0 0-1.96 0L.165 13.233c-.457.778.091 1.767.98 1.767h13.713c.889 0 1.438-.99.98-1.767L8.982 1.566zM8 5c.535 0 .954.462.9.995l-.35 3.507a.552.552 0 0 1-1.1 0L7.1 5.995A.905.905 0 0 1 8 5zm.002 6a1 1 0 1 1 0 2 1 1 0 0 1 0-2z"/>
        </svg>
        <div>
          <h4 className="fw-bold">Error Loading Profile</h4>
          <p className="mb-0">{error || 'Failed to load profile data. Please try again.'}</p>
          <button 
            className="btn btn-danger mt-3"
            onClick={loadProfileUser}
          >
            Retry
          </button>
        </div>
      </div>
    </motion.div>
  );

  /**
   * Renders empty state when no images are available
   * 
   * @returns {JSX.Element} Empty state message
   */
  const renderEmptyState = () => (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="text-center p-5 bg-light rounded-4 shadow-sm"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" fill="#6c757d" className="bi bi-images mb-3" viewBox="0 0 16 16">
        <path d="M4.502 9a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3z"/>
        <path d="M14.002 13a2 2 0 0 1-2 2h-10a2 2 0 0 1-2-2V5A2 2 0 0 1 2 3a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v8a2 2 0 0 1-1.998 2zM14 2H4a1 1 0 0 0-1 1h9.002a2 2 0 0 1 2 2v7A1 1 0 0 0 15 11V3a1 1 0 0 0-1-1zM2.002 4a1 1 0 0 0-1 1v8l2.646-2.354a.5.5 0 0 1 .63-.062l2.66 1.773 3.71-3.71a.5.5 0 0 1 .577-.094l1.777 1.947V5a1 1 0 0 0-1-1h-10z"/>
      </svg>
      <h3 className="fs-4 mb-2">No Images Found</h3>
      <p className="text-secondary mb-4">
        {isOwnProfile ? 
          "You haven't uploaded any images yet." : 
          `${profileUser?.displayName || profileUser?.username || 'This user'} hasn't uploaded any images yet.`}
      </p>
      
      {isOwnProfile && (
        <Link to="/" className="btn btn-danger">
          Upload Your First Image
        </Link>
      )}
    </motion.div>
  );

  /**
   * Renders filter tags for filtering gallery images
   * 
   * @returns {JSX.Element|null} Tag filter component or null if no tags
   */
  const renderTagFilters = () => {
    if (!userStats.popularCategories.length) return null;
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mb-4"
      >
        <div className="d-flex flex-wrap align-items-center gap-2">
          <span className="text-secondary">Filter by:</span>
          {userStats.popularCategories.map(({tag}) => (
            <button
              key={tag}
              onClick={() => handleTagFilter(tag)}
              className={`btn ${filterTag === tag ? 'btn-danger' : 'btn-outline-secondary'} btn-sm rounded-pill`}
            >
              #{tag}
              {filterTag === tag && (
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-x-circle ms-1" viewBox="0 0 16 16">
                  <path d="M8 15A7 7 0 1 1 8 1a7 7 0 0 1 0 14zm0 1A8 8 0 1 0 8 0a8 8 0 0 0 0 16z"/>
                  <path d="M4.646 4.646a.5.5 0 0 1 .708 0L8 7.293l2.646-2.647a.5.5 0 0 1 .708.708L8.707 8l2.647 2.646a.5.5 0 0 1-.708.708L8 8.707l-2.646 2.647a.5.5 0 0 1-.708-.708L7.293 8 4.646 5.354a.5.5 0 0 1 0-.708z"/>
                </svg>
              )}
            </button>
          ))}
        </div>
        
        {filterTag && filteredImages.length > 0 && (
          <button
            onClick={() => {
              setFilterTag('');
              setFilteredImages(images);
            }}
            className="btn btn-link text-danger mt-2 p-0 text-decoration-none"
          >
            Show All Images
          </button>
        )}
      </motion.div>
    );
  };

  /**
   * Renders the image grid with animations
   * 
   * @returns {JSX.Element} The masonry image grid
   */
  const renderImageGrid = () => {
    // Ensure filteredImages is an array
    const imageArray = Array.isArray(filteredImages) ? filteredImages : [];
    
    return (
      <AnimatePresence>
        <div className="row g-4">
          {imageArray.map((image) => (
            <motion.div 
              key={image._id} 
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.3 }}
              className="col-12 col-sm-6 col-md-4 col-lg-3"
            >
              <ImageCard 
                image={image} 
                showUser={false}
                canDelete={isOwnProfile} 
                refreshImages={loadImages}
              />
            </motion.div>
          ))}
        </div>
      </AnimatePresence>
    );
  };

  /**
   * Renders the saved images tab
   * 
   * @returns {JSX.Element} Saved images component
   */
  const renderSavedTab = () => {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <h2 className="fs-4 fw-semibold mb-4">Saved Images</h2>
        
        {isLoadingSaved ? (
          <div className="row g-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={`saved-skeleton-${index}`} className="col-12 col-sm-6 col-md-4">
                <ImageCardSkeleton />
              </div>
            ))}
          </div>
        ) : savedImages.length ? (
          <div className="row g-4">
            {savedImages.map((image) => (
              <motion.div 
                key={image._id} 
                className="col-12 col-sm-6 col-md-4"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <ImageCard image={image} showUser={true} />
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center p-5 bg-light rounded-4">
            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" fill="#6c757d" className="bi bi-bookmark mb-3" viewBox="0 0 16 16">
              <path d="M2 2a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v13.5a.5.5 0 0 1-.777.416L8 13.101l-5.223 2.815A.5.5 0 0 1 2 15.5V2zm2-1a1 1 0 0 0-1 1v12.566l4.723-2.482a.5.5 0 0 1 .554 0L13 14.566V2a1 1 0 0 0-1-1H4z"/>
            </svg>
            <h3 className="fs-5 mb-2">No Saved Images</h3>
            <p className="text-secondary mb-4">You haven't saved any images yet. Browse and save images you like.</p>
            <Link to="/" className="btn btn-danger">
              Explore Images
            </Link>
          </div>
        )}
      </motion.div>
    );
  };

  /**
   * Render the appropriate tab content based on active tab
   * 
   * @returns {JSX.Element} The tab content
   */
  const renderTabContent = () => {
    if (activeTab === 'stats') {
      return renderStatsTab();
    }
    
    if (activeTab === 'saved') {
      return renderSavedTab();
    }
    
    // Gallery tab (default)
    if (isLoadingImages && !images.length) {
      return renderSkeletons();
    }

    if (error) {
      return renderError();
    }

    if (filteredImages.length === 0) {
      return renderEmptyState();
    }

    return (
      <>
        {renderTagFilters()}
        {renderImageGrid()}
      </>
    );
  };

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="container py-4"
    >
      {renderProfileHeader()}
      {renderTabContent()}
    </motion.div>
  );
}

export default ProfilePage;