import axios from 'axios';

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Attach JWT token automatically from localStorage if present
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const api = {
  // Auth & User Discovery
  login: (credentials) => apiClient.post('/api/v1/auth/login', credentials),
  register: (data) => apiClient.post('/api/v1/auth/register', data),
  searchUsers: (query) => apiClient.get('/api/v1/users/search', { params: { username: query } }),

  // Goals
  getUserGoals: () => apiClient.get('/api/v1/goals'),
  createGoal: (goalData) => apiClient.post('/api/v1/goals', goalData),
  addPredefinedTask: (goalId, taskData) =>
    apiClient.post(`/api/v1/goals/${goalId}/predefined-tasks`, taskData),
  getGoalStats: (goalId, days = 30) =>
    apiClient.get(`/api/v1/goals/${goalId}/stats`, { params: { days } }),

  // Daily Logs & Tasks
  getDailyLog: (goalId, dateStr) =>
    apiClient.get(`/api/v1/goals/${goalId}/logs`, { params: { date: dateStr } }),
  toggleTask: (taskId, isCompleted) =>
    apiClient.patch(`/api/v1/tasks/${taskId}/toggle`, { isCompleted }),
  addAdHocTask: (logId, taskContent) =>
    apiClient.post(`/api/v1/logs/${logId}/tasks/ad-hoc`, { taskContent }),

  // Friend Requests & Connections
  sendFriendRequest: (targetUserId) =>
    apiClient.post('/api/v1/friends/requests', { targetUserId }),
  acceptFriendRequest: (userId) =>
    apiClient.patch(`/api/v1/friends/requests/${userId}/accept`),
  declineFriendRequest: (userId) =>
    apiClient.delete(`/api/v1/friends/requests/${userId}`),
  getPendingRequests: () =>
    apiClient.get('/api/v1/friends/requests/pending'),
  getFriends: () =>
    apiClient.get('/api/v1/friends'),

  // Granular Goal Sharing & Permissions
  getGoalShares: (goalId) =>
    apiClient.get(`/api/v1/goals/${goalId}/shares`),
  shareGoal: (goalId, friendId) =>
    apiClient.post(`/api/v1/goals/${goalId}/share`, { friendId }),
  revokeGoalAccess: (goalId, friendId) =>
    apiClient.delete(`/api/v1/goals/${goalId}/share/${friendId}`),

  // Social Feed & Nudges
  getSquadFeed: () =>
    apiClient.get('/api/v1/friends/feed'),
  getFriendGoals: (friendId) =>
    apiClient.get(`/api/v1/friends/${friendId}/goals`),
  remindFriend: (goalId, friendId) =>
    apiClient.post(`/api/v1/goals/${goalId}/remind/${friendId}`),

  // Notifications
  subscribePush: (subscriptionPayload) =>
    apiClient.post('/api/v1/notifications/subscribe', subscriptionPayload)
};

export default apiClient;
