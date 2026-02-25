import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import toast from 'react-hot-toast';
import ImagePreview from './ImagePreview';
import ThemeToggle from './ThemeToggle';

const Header = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const response = await api.getUserProfile();
      setUser(response.data);
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
    toast.success('Logged out successfully');
  };

  const handleProfileImageUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (file.size > 1024 * 1024) {
      toast.error('Image size must be less than 1MB');
      return;
    }

    const formData = new FormData();
    formData.append('profileImage', file);

    try {
      const response = await api.uploadProfileImage(formData);
      setUser(response.data.user);
      toast.success('Profile image updated successfully!');
      setShowProfileMenu(false);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to upload profile image');
    }
  };

  return (
    <header className="bg-surface border-b border-border backdrop-blur-xs sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex justify-between items-center">
          {/* Theme Toggle */}
          <ThemeToggle />
          
          <div className="flex-1"></div>
          
          {/* User Profile Section */}
          {user && (
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="flex items-center space-x-3 p-2 rounded-xl hover:bg-surfaceLight transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <ImagePreview
                  src={user.profileImage ? `http://localhost:5001${user.profileImage}` : null}
                  alt={user.name}
                  size="sm"
                  clickable={true}
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                />
                
                <div className="text-left hidden sm:block">
                  <div className="text-sm font-medium text-text-primary leading-tight">{user.name}</div>
                  <div className="text-xs text-text-muted capitalize">{user.role}</div>
                </div>
                
                <svg 
                  className={`w-4 h-4 text-text-muted transition-transform duration-200 ${showProfileMenu ? 'rotate-180' : ''}`}
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Premium Profile Dropdown */}
              {showProfileMenu && (
                <div className="absolute right-0 mt-2 w-80 bg-surface rounded-2xl shadow-large border border-border z-50 animate-slide-up">
                  <div className="p-6">
                    {/* User Info Header */}
                    <div className="flex items-start space-x-4 pb-6 border-b border-border">
                      <ImagePreview
                        src={user.profileImage ? `http://localhost:5001${user.profileImage}` : null}
                        alt={user.name}
                        size="md"
                        className="ring-2 ring-primary/20"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-text-primary text-lg leading-tight">{user.name}</div>
                        <div className="text-sm text-text-muted mt-1">{user.email}</div>
                        <div className="inline-flex items-center px-2.5 py-1 mt-2 text-xs font-medium bg-primary/10 text-primary rounded-full capitalize">
                          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                          </svg>
                          {user.role}
                        </div>
                      </div>
                    </div>

                    {/* Menu Items */}
                    <div className="space-y-2 pt-4">
                      <label className="flex items-center w-full px-3 py-2.5 text-sm text-text-primary hover:bg-surfaceLight rounded-xl cursor-pointer transition-colors duration-200 group">
                        <input
                          type="file"
                          accept="image/jpeg,image/jpg,image/png"
                          onChange={handleProfileImageUpload}
                          className="hidden"
                        />
                        <svg className="w-4 h-4 mr-3 text-text-muted group-hover:text-primary transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-4 4 0M7 12a4 4 0 01-4-4 0m0 8a4 4 0 014 4 0m-4 8a4 4 0 01-4 4 0" />
                        </svg>
                        <span>Update Profile Picture</span>
                      </label>

                      <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-3 py-2.5 text-sm text-status-error hover:bg-surfaceLight rounded-xl transition-colors duration-200 group"
                      >
                        <svg className="w-4 h-4 mr-3 text-status-error group-hover:text-status-error/80 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4 4m4 0H12m0 0l4-4m-4 4V3" />
                        </svg>
                        <span>Sign Out</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Click outside to close menu */}
      {showProfileMenu && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => setShowProfileMenu(false)}
        ></div>
      )}
    </header>
  );
};

export default Header;
