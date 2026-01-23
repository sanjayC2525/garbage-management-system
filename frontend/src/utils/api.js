import axios from 'axios';

const API_BASE_URL = '/api';

export const api = {
  // Auth
  login: (email, password) => axios.post(`${API_BASE_URL}/auth/login`, { email, password }),

  // Users
  getUsers: () => axios.get(`${API_BASE_URL}/users`),
  createUser: (userData) => axios.post(`${API_BASE_URL}/users`, userData),
  updateUser: (id, userData) => axios.put(`${API_BASE_URL}/users/${id}`, userData),
  deleteUser: (id) => axios.delete(`${API_BASE_URL}/users/${id}`),
  getUserProfile: () => axios.get(`${API_BASE_URL}/users/profile`),
  uploadProfileImage: (formData) => axios.post(`${API_BASE_URL}/users/profile-image`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),

  // Pickup Requests
  getPickupRequests: () => axios.get(`${API_BASE_URL}/pickup-requests`),
  createPickupRequest: (requestData) => axios.post(`${API_BASE_URL}/pickup-requests`, requestData),
  updateRequestStatus: (id, status) => axios.patch(`${API_BASE_URL}/pickup-requests/${id}/status`, { status }),
  assignWorker: (id, workerId) => axios.patch(`${API_BASE_URL}/pickup-requests/${id}/assign`, { workerId }),
  getStats: () => axios.get(`${API_BASE_URL}/pickup-requests/stats`),

  // Garbage Reports
  createGarbageReport: (formData) => axios.post(`${API_BASE_URL}/garbage-reports`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  getGarbageReports: () => axios.get(`${API_BASE_URL}/garbage-reports`),
  getMyGarbageReports: () => axios.get(`${API_BASE_URL}/garbage-reports/my-reports`),
  updateGarbageReportStatus: (id, action) => axios.put(`${API_BASE_URL}/garbage-reports/${id}`, { action }),

  // Tasks
  getTasks: () => axios.get(`${API_BASE_URL}/tasks`),
  markTaskCollected: (id) => axios.put(`${API_BASE_URL}/tasks/${id}/collect`),
};