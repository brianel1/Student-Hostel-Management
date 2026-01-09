import axios from 'axios';

const API_URL = 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' }
});

export const authAPI = {
  login: (data) => api.post('/auth/login.php', data),
  register: (data) => api.post('/auth/register.php', data),
  getProfile: (userId) => api.get(`/auth/profile.php?user_id=${userId}`),
  updateProfile: (data) => api.put('/auth/profile.php', data),
  changePassword: (data) => api.post('/auth/change-password.php', data)
};

export const dashboardAPI = {
  getStats: (role) => api.get(`/dashboard/index.php?role=${role}`)
};

export const complaintsAPI = {
  getAll: (params = {}) => api.get('/complaints/index.php', { params }),
  create: (data) => api.post('/complaints/index.php', data),
  update: (data) => api.put('/complaints/index.php', data),
  getComments: (complaintId) => api.get(`/complaints/comments.php?complaint_id=${complaintId}`),
  addComment: (data) => api.post('/complaints/comments.php', data),
  uploadImage: (formData) => api.post('/complaints/upload.php', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
};

export const roomsAPI = {
  getAll: () => api.get('/rooms/index.php'),
  getOne: (id) => api.get(`/rooms/index.php?id=${id}`),
  create: (data) => api.post('/rooms/index.php', data),
  update: (data) => api.put('/rooms/index.php', data),
  delete: (id) => api.delete(`/rooms/index.php?id=${id}`)
};

export const studentsAPI = {
  getAll: () => api.get('/students/index.php'),
  getOne: (id) => api.get(`/students/index.php?id=${id}`),
  update: (data) => api.put('/students/index.php', data),
  delete: (id) => api.delete(`/students/index.php?id=${id}`),
  bulkImport: (students) => api.post('/students/import.php', { students })
};

export const wardensAPI = {
  getAll: (status) => api.get(`/wardens/index.php${status ? `?status=${status}` : ''}`),
  updateStatus: (data) => api.put('/wardens/index.php', data)
};

export const notificationsAPI = {
  getAll: (userId) => api.get(`/notifications/index.php?user_id=${userId}`),
  getUnread: (userId) => api.get(`/notifications/index.php?user_id=${userId}&unread=true`),
  markAsRead: (id) => api.put('/notifications/index.php', { id }),
  markAllAsRead: (userId) => api.put('/notifications/index.php', { user_id: userId, mark_all_read: true })
};

export default api;
