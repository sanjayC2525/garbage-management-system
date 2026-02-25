import axios from 'axios';

const API_BASE_URL = '/api';
const TOKEN_EXPIRY_KEY = 'tokenExpiry';
const USER_KEY = 'user';
const TOKEN_KEY = 'token';

// Set token expiry (24 hours from now)
const setTokenExpiry = () => {
  const expiryTime = new Date().getTime() + (24 * 60 * 60 * 1000); // 24 hours
  localStorage.setItem(TOKEN_EXPIRY_KEY, expiryTime.toString());
};

// Check if token is expired
const isTokenExpired = () => {
  const expiryTime = localStorage.getItem(TOKEN_EXPIRY_KEY);
  if (!expiryTime) return true;
  
  return new Date().getTime() > parseInt(expiryTime);
};

// Auto-logout if token expired
const checkTokenExpiry = () => {
  if (isTokenExpired()) {
    logout();
    return true;
  }
  return false;
};

export const login = async (email, password) => {
  const response = await axios.post(`${API_BASE_URL}/auth/login`, { email, password });
  if (response.data.token) {
    localStorage.setItem(TOKEN_KEY, response.data.token);
    localStorage.setItem(USER_KEY, JSON.stringify(response.data.user));
    setTokenExpiry(); // Set expiry time
  }
  return response.data;
};

export const logout = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(TOKEN_EXPIRY_KEY);
};

export const getCurrentUser = () => {
  // Auto-logout if token expired
  if (checkTokenExpiry()) {
    return null;
  }
  
  const user = localStorage.getItem(USER_KEY);
  return user ? JSON.parse(user) : null;
};

export const getToken = () => {
  // Auto-logout if token expired
  if (checkTokenExpiry()) {
    return null;
  }
  
  return localStorage.getItem(TOKEN_KEY);
};

// Set up axios interceptor for auth with token expiry check
axios.interceptors.request.use(
  (config) => {
    const token = getToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Set up response interceptor for handling expired tokens
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid - logout user
      logout();
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);