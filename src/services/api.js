import axios from 'axios';
import { cache } from '../utils/cache';

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

// Auto logout with alert and redirect to home on session expiration (401 Unauthorized)
let isAlertingExpired = false;

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response &&
      error.response.status === 401 &&
      !error.config?.url?.includes('/api/v1/auth/')
    ) {
      if (!isAlertingExpired) {
        isAlertingExpired = true;
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        cache.clearAll();
        window.dispatchEvent(new Event('auth:expired'));
        
        alert('Your session has expired. Please sign in again to continue.');
        isAlertingExpired = false;

        if (window.location.pathname !== '/') {
          window.location.href = '/';
        }
      }
    }
    return Promise.reject(error);
  }
);

export const api = {
  // Auth & User Discovery
  login: (credentials) => {
    cache.clearAll();
    return apiClient.post('/api/v1/auth/login', credentials);
  },
  register: (data) => {
    cache.clearAll();
    return apiClient.post('/api/v1/auth/register', data);
  },
  searchUsers: (query) => apiClient.get('/api/v1/users/search', { params: { username: query } }),

  // Goals
  getUserGoals: async (forceRefresh = false) => {
    const cacheKey = 'user_goals';
    if (!forceRefresh) {
      const cached = cache.get(cacheKey);
      if (cached) return { data: cached, fromCache: true };
    }
    const res = await apiClient.get('/api/v1/goals');
    cache.set(cacheKey, res.data, 120); // 2 min TTL
    return res;
  },
  createGoal: async (goalData) => {
    cache.invalidatePrefix('user_goals');
    return apiClient.post('/api/v1/goals', goalData);
  },
  updateGoal: async (goalId, goalData) => {
    cache.invalidatePrefix('user_goals');
    cache.invalidatePrefix(`log_${goalId}`);
    return apiClient.put(`/api/v1/goals/${goalId}`, goalData);
  },
  archiveGoal: async (goalId) => {
    cache.invalidatePrefix('user_goals');
    cache.invalidatePrefix(`log_${goalId}`);
    return apiClient.patch(`/api/v1/goals/${goalId}/archive`);
  },
  unarchiveGoal: async (goalId) => {
    cache.invalidatePrefix('user_goals');
    cache.invalidatePrefix(`log_${goalId}`);
    return apiClient.patch(`/api/v1/goals/${goalId}/unarchive`);
  },
  deleteGoal: async (goalId) => {
    cache.invalidatePrefix('user_goals');
    cache.invalidatePrefix(`log_${goalId}`);
    cache.invalidatePrefix('squad_');
    return apiClient.delete(`/api/v1/goals/${goalId}`);
  },
  getGoalStreak: (goalId) => apiClient.get(`/api/v1/goals/${goalId}/streak`),
  getPredefinedTasks: (goalId) => apiClient.get(`/api/v1/goals/${goalId}/predefined-tasks`),
  addPredefinedTask: async (goalId, taskData) => {
    cache.invalidatePrefix(`log_${goalId}`);
    return apiClient.post(`/api/v1/goals/${goalId}/predefined-tasks`, taskData);
  },
  updatePredefinedTask: async (goalId, taskId, taskData) => {
    cache.invalidatePrefix(`log_${goalId}`);
    return apiClient.put(`/api/v1/goals/${goalId}/predefined-tasks/${taskId}`, taskData);
  },
  deletePredefinedTask: async (goalId, taskId) => {
    cache.invalidatePrefix(`log_${goalId}`);
    return apiClient.delete(`/api/v1/goals/${goalId}/predefined-tasks/${taskId}`);
  },
  getGoalStats: async (goalId, days = 30, forceRefresh = false) => {
    const cacheKey = `stats_${goalId}_${days}`;
    if (!forceRefresh) {
      const cached = cache.get(cacheKey);
      if (cached) return { data: cached, fromCache: true };
    }
    const res = await apiClient.get(`/api/v1/goals/${goalId}/stats`, { params: { days } });
    cache.set(cacheKey, res.data, 180); // 3 min TTL
    return res;
  },

  // Daily Logs & Task Statuses
  getDailyLog: async (goalId, dateStr, forceRefresh = false) => {
    const cacheKey = `log_${goalId}_${dateStr}`;
    if (!forceRefresh) {
      const cached = cache.get(cacheKey);
      if (cached) return { data: cached, fromCache: true };
    }
    const res = await apiClient.get(`/api/v1/goals/${goalId}/logs`, { params: { date: dateStr } });
    cache.set(cacheKey, res.data, 60); // 1 min TTL
    return res;
  },
  updateTaskStatus: async (taskId, status, goalId, dateStr) => {
    if (goalId) cache.invalidatePrefix(`log_${goalId}`);
    cache.invalidatePrefix('stats_');
    return apiClient.patch(`/api/v1/tasks/${taskId}/status`, { status });
  },
  toggleTask: async (taskId, isCompleted, goalId, dateStr) => {
    if (goalId) cache.invalidatePrefix(`log_${goalId}`);
    cache.invalidatePrefix('stats_');
    return apiClient.patch(`/api/v1/tasks/${taskId}/toggle`, { isCompleted });
  },
  addAdHocTask: async (logId, taskContent, goalId) => {
    if (goalId) cache.invalidatePrefix(`log_${goalId}`);
    cache.invalidatePrefix('stats_');
    return apiClient.post(`/api/v1/logs/${logId}/tasks/ad-hoc`, { taskContent });
  },
  getSkippedTasks: (goalId) =>
    apiClient.get(`/api/v1/goals/${goalId}/skipped-tasks`),

  // Friend Requests & Connections
  sendFriendRequest: (targetUserId) =>
    apiClient.post('/api/v1/friends/requests', { targetUserId }),
  acceptFriendRequest: (userId) => {
    cache.invalidatePrefix('squad_');
    return apiClient.patch(`/api/v1/friends/requests/${userId}/accept`);
  },
  declineFriendRequest: (userId) =>
    apiClient.delete(`/api/v1/friends/requests/${userId}`),
  getPendingRequests: () =>
    apiClient.get('/api/v1/friends/requests/pending'),
  getFriends: () =>
    apiClient.get('/api/v1/friends'),

  // Granular Goal Sharing & Permissions
  getGoalShares: (goalId) =>
    apiClient.get(`/api/v1/goals/${goalId}/shares`),
  shareGoal: (goalId, friendId) => {
    cache.invalidatePrefix('squad_');
    return apiClient.post(`/api/v1/goals/${goalId}/share`, { friendId });
  },
  revokeGoalAccess: (goalId, friendId) => {
    cache.invalidatePrefix('squad_');
    return apiClient.delete(`/api/v1/goals/${goalId}/share/${friendId}`);
  },

  // Social Feed & Nudges
  getSquadFeed: async (forceRefresh = false) => {
    const cacheKey = 'squad_feed';
    if (!forceRefresh) {
      const cached = cache.get(cacheKey);
      if (cached) return { data: cached, fromCache: true };
    }
    const res = await apiClient.get('/api/v1/friends/feed');
    cache.set(cacheKey, res.data, 90); // 1.5 min TTL
    return res;
  },
  getFriendGoals: (friendId) =>
    apiClient.get(`/api/v1/friends/${friendId}/goals`),
  remindFriend: (goalId, friendId) =>
    apiClient.post(`/api/v1/goals/${goalId}/remind/${friendId}`),

  // Notifications
  subscribePush: (subscriptionPayload) =>
    apiClient.post('/api/v1/notifications/subscribe', subscriptionPayload),
  testPushNotification: () =>
    apiClient.post('/api/v1/notifications/test'),

  // Invalidate Cache Utility
  clearAppCache: () => cache.clearAll()
};

export default apiClient;
