// Password cache utility for managing temporary password storage
// Uses sessionStorage so passwords are cleared when browser tab is closed

const PASSWORD_CACHE_KEY = 'vanishbin_password_cache';
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

export const passwordCache = {
  // Store a password for a specific share ID
  store(shareId, password) {
    const cache = this.getCache();
    const expiresAt = Date.now() + CACHE_DURATION;
    
    cache[shareId] = {
      password,
      expiresAt
    };
    
    sessionStorage.setItem(PASSWORD_CACHE_KEY, JSON.stringify(cache));
  },

  // Retrieve a cached password for a share ID
  get(shareId) {
    const cache = this.getCache();
    const entry = cache[shareId];
    
    if (!entry) {
      return null;
    }
    
    // Check if password has expired
    if (Date.now() > entry.expiresAt) {
      this.remove(shareId);
      return null;
    }
    
    return entry.password;
  },

  // Remove a specific password from cache
  remove(shareId) {
    const cache = this.getCache();
    delete cache[shareId];
    sessionStorage.setItem(PASSWORD_CACHE_KEY, JSON.stringify(cache));
  },

  // Get the entire cache object
  getCache() {
    try {
      const cached = sessionStorage.getItem(PASSWORD_CACHE_KEY);
      return cached ? JSON.parse(cached) : {};
    } catch (error) {
      console.error('Error reading password cache:', error);
      return {};
    }
  },

  // Clear all cached passwords
  clear() {
    sessionStorage.removeItem(PASSWORD_CACHE_KEY);
  },

  // Clean up expired entries
  cleanup() {
    const cache = this.getCache();
    const now = Date.now();
    let hasExpired = false;
    
    Object.keys(cache).forEach(shareId => {
      if (cache[shareId].expiresAt <= now) {
        delete cache[shareId];
        hasExpired = true;
      }
    });
    
    if (hasExpired) {
      sessionStorage.setItem(PASSWORD_CACHE_KEY, JSON.stringify(cache));
    }
  },

  // Check if a password is cached for a share ID
  has(shareId) {
    return this.get(shareId) !== null;
  }
};

// Run cleanup when the module loads
passwordCache.cleanup();

// Optional: Run cleanup periodically
setInterval(() => {
  passwordCache.cleanup();
}, 60000); // Every minute