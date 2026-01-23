import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../utils/api';
import toast from 'react-hot-toast';

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
    <header className="bg-darker border-b border-gray-700 px-6 py-4">
      <div className="flex justify-between items-center">
        
        {/* App Name */}
        <div className="flex items-center space-x-4">
          <h1 className="text-xl font-bold text-primary">GMS</h1>
          <span className="text-sm text-gray-400 hidden sm:block">
            Garbage Management System
          </span>
        </div>

        {/* User Profile Section */}
        <div className="flex items-center space-x-4">
          {user && (
            <>
              {/* ✅ YOUR REQUESTED STATIC BLOCK */}
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-300">
                  Welcome, Admin User
                </span>

                <img
                  src="/src/assets/images/default-avatar.svg"
                  alt="Profile"
                  className="w-9 h-9 rounded-full object-cover border border-gray-600"
                />
              </div>

              {/* Existing Profile Dropdown (UNCHANGED) */}
              <div className="relative">
                <button
                  onClick={() => setShowProfileMenu(!showProfileMenu)}
                  className="flex items-center space-x-2 focus:outline-none"
                >
                  <img
                    src={
                      user.profileImage
                        ? `http://localhost:5001${user.profileImage}`
                        : '/default-avatar.svg'
                    }
                    alt="Profile"
                    className="w-8 h-8 rounded-full object-cover border-2 border-primary"
                  />
                </button>

                {showProfileMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-darker border border-gray-700 rounded-md shadow-lg z-50">
                    <div className="py-1">
                      <div className="px-4 py-2 text-sm text-gray-300 border-b border-gray-700">
                        <div className="font-medium">{user.name}</div>
                        <div className="text-xs text-gray-500">{user.email}</div>
                      </div>

                      <label className="block px-4 py-2 text-sm text-gray-300 hover:bg-gray-700 cursor-pointer">
                        <input
                          type="file"
                          accept="image/jpeg,image/jpg,image/png"
                          onChange={handleProfileImageUpload}
                          className="hidden"
                        />
                        Change Profile Picture
                      </label>

                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-gray-700"
                      >
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Click outside to close menu */}
      {showProfileMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowProfileMenu(false)}
        ></div>
      )}
    </header>
  );
};

export default Header;
