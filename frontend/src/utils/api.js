import axios from 'axios';

const API_BASE_URL = '/api';

export const api = {
  // Auth
  login: (email, password) => axios.post(`${API_BASE_URL}/auth/login`, { email, password }),

  // Users
  getUsers: () => axios.get(`${API_BASE_URL}/users`),
  getWorkers: () => axios.get(`${API_BASE_URL}/users/workers`),
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
  updateGarbageReportStatus: (id, action, workerId, adminNotes) => {
    console.log('API call:', { id, action, workerId, adminNotes });
    return axios.put(`${API_BASE_URL}/garbage-reports/${id}`, { action, workerId, adminNotes });
  },

  // Tasks
  getTasks: () => axios.get(`${API_BASE_URL}/tasks`),
  markTaskCollected: (id, action, unableReason) => axios.put(`${API_BASE_URL}/tasks/${id}/collect`, { action, unableReason }),

  // Workload Management
  getWorkerStats: () => axios.get(`${API_BASE_URL}/workload/stats`),
  getBestAvailableWorker: () => axios.get(`${API_BASE_URL}/workload/best-available`),

  // Feedback
  createFeedback: (feedbackData) => axios.post(`${API_BASE_URL}/feedback`, feedbackData),
  getMyFeedback: () => axios.get(`${API_BASE_URL}/feedback/my`),
  getAllFeedback: (filters) => axios.get(`${API_BASE_URL}/feedback/admin/all`, { params: filters }),
  updateFeedback: (id, status, adminReply, adminNotes) => axios.patch(`${API_BASE_URL}/feedback/admin/${id}`, { status, adminReply, adminNotes }),
  getFeedbackStats: () => axios.get(`${API_BASE_URL}/feedback/admin/stats`),

  // Issues
  createIssue: (issueData) => axios.post(`${API_BASE_URL}/issues`, issueData),
  getMyIssues: () => axios.get(`${API_BASE_URL}/issues/my`),
  getAllIssues: (filters) => axios.get(`${API_BASE_URL}/issues`, { params: filters }),
  updateIssue: (id, status, resolution, workerId) => axios.put(`${API_BASE_URL}/issues/${id}`, { status, resolution, workerId }),
  getIssueStats: () => axios.get(`${API_BASE_URL}/issues/stats`),

  // Unified Issues & Feedback
  createIssuesFeedback: (data) => axios.post(`${API_BASE_URL}/issues/issues-feedback`, data),
  getAllIssuesFeedback: (filters) => axios.get(`${API_BASE_URL}/issues/issues-feedback/admin`, { params: filters }),
  getIssuesFeedbackStats: () => axios.get(`${API_BASE_URL}/issues/issues-feedback/stats`),

  // Proof of Work
  uploadProof: (taskId, formData) => axios.post(`${API_BASE_URL}/proof/${taskId}/proof`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  }),
  getProof: (taskId) => axios.get(`${API_BASE_URL}/proof/${taskId}/proof`),
  getAllProofs: () => axios.get(`${API_BASE_URL}/proof/admin/all-proofs`),
  getProofStats: () => axios.get(`${API_BASE_URL}/proof/admin/proof-stats`),

  // Notifications
  getNotifications: (options) => axios.get(`${API_BASE_URL}/notifications`, { params: options }),
  getUnreadCount: () => axios.get(`${API_BASE_URL}/notifications/unread-count`),
  markAsRead: (id) => axios.put(`${API_BASE_URL}/notifications/${id}/read`),
  markAllAsRead: () => axios.put(`${API_BASE_URL}/notifications/read-all`),
  deleteNotification: (id) => axios.delete(`${API_BASE_URL}/notifications/${id}`),
  getNotificationStats: () => axios.get(`${API_BASE_URL}/notifications/stats`),

  // Analytics
  getAnalytics: (timeframe) => axios.get(`${API_BASE_URL}/analytics`, { params: { timeframe } }),
  getKPI: () => axios.get(`${API_BASE_URL}/analytics/kpi`),

  // Audit Logs
  getAuditLogs: (filters) => axios.get(`${API_BASE_URL}/audit`, { params: filters }),
  getAuditStats: (filters) => axios.get(`${API_BASE_URL}/audit/stats`, { params: filters }),
  getAuditLog: (id) => axios.get(`${API_BASE_URL}/audit/${id}`),
  exportAuditLogs: (filters) => axios.get(`${API_BASE_URL}/audit/export/csv`, { 
    params: filters,
    responseType: 'blob'
  }),
  getAuditFilterOptions: () => axios.get(`${API_BASE_URL}/audit/filters/options`),
};