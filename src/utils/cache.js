/**
 * Simple client-side TTL (Time-To-Live) cache manager for React using localStorage.
 */

const CACHE_PREFIX = 'winterark_cache_';
const DEFAULT_TTL_SECONDS = 300; // 5 minutes

export const cache = {
  get: (key) => {
    try {
      const itemStr = localStorage.getItem(CACHE_PREFIX + key);
      if (!itemStr) return null;

      const item = JSON.parse(itemStr);
      const now = Date.now();

      if (now > item.expiry) {
        localStorage.removeItem(CACHE_PREFIX + key);
        return null;
      }
      return item.data;
    } catch (e) {
      console.warn('Error reading from cache', e);
      return null;
    }
  },

  set: (key, data, ttlSeconds = DEFAULT_TTL_SECONDS) => {
    try {
      const now = Date.now();
      const item = {
        data,
        expiry: now + ttlSeconds * 1000
      };
      localStorage.setItem(CACHE_PREFIX + key, JSON.stringify(item));
    } catch (e) {
      console.warn('Error saving to cache', e);
    }
  },

  remove: (key) => {
    try {
      localStorage.removeItem(CACHE_PREFIX + key);
    } catch (e) {}
  },

  invalidatePrefix: (prefix) => {
    try {
      const targetPrefix = CACHE_PREFIX + prefix;
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(targetPrefix)) {
          keysToRemove.push(k);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
    } catch (e) {}
  },

  clearAll: () => {
    try {
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(CACHE_PREFIX)) {
          keysToRemove.push(k);
        }
      }
      keysToRemove.forEach((k) => localStorage.removeItem(k));
    } catch (e) {}
  }
};
