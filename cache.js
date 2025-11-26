const redis = require('redis');

// Redis client configuration
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const CACHE_TTL = parseInt(process.env.CACHE_TTL || '300'); // 5 minutes default

let client = null;
let isConnected = false;

/**
 * Initialize Redis connection
 */
async function initCache() {
  if (client) {
    return client;
  }

  try {
    client = redis.createClient({
      url: REDIS_URL,
      socket: {
        reconnectStrategy: (retries) => {
          if (retries > 10) {
            console.log('Redis connection failed after 10 retries');
            return new Error('Redis connection failed');
          }
          return retries * 100; // Retry delay in ms
        }
      }
    });

    client.on('error', (err) => {
      console.error('Redis Client Error:', err.message);
      isConnected = false;
    });

    client.on('connect', () => {
      console.log('Redis client connected');
      isConnected = true;
    });

    await client.connect();
    return client;
  } catch (error) {
    console.error('Failed to initialize Redis:', error.message);
    return null;
  }
}

/**
 * Get value from cache
 * @param {string} key - Cache key
 * @returns {Promise<any>} Cached value or null
 */
async function get(key) {
  if (!client || !isConnected) {
    return null;
  }

  try {
    const value = await client.get(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    console.error('Cache get error:', error.message);
    return null;
  }
}

/**
 * Set value in cache
 * @param {string} key - Cache key
 * @param {any} value - Value to cache
 * @param {number} ttl - Time to live in seconds (optional)
 * @returns {Promise<boolean>} Success status
 */
async function set(key, value, ttl = CACHE_TTL) {
  if (!client || !isConnected) {
    return false;
  }

  try {
    await client.setEx(key, ttl, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error('Cache set error:', error.message);
    return false;
  }
}

/**
 * Delete value from cache
 * @param {string} key - Cache key
 * @returns {Promise<boolean>} Success status
 */
async function del(key) {
  if (!client || !isConnected) {
    return false;
  }

  try {
    await client.del(key);
    return true;
  } catch (error) {
    console.error('Cache delete error:', error.message);
    return false;
  }
}

/**
 * Clear all cache entries matching a pattern
 * @param {string} pattern - Key pattern (e.g., "tasks:*")
 * @returns {Promise<boolean>} Success status
 */
async function clearPattern(pattern) {
  if (!client || !isConnected) {
    return false;
  }

  try {
    const keys = await client.keys(pattern);
    if (keys.length > 0) {
      await client.del(keys);
    }
    return true;
  } catch (error) {
    console.error('Cache clear pattern error:', error.message);
    return false;
  }
}

/**
 * Check if cache is connected
 * @returns {boolean} Connection status
 */
function isReady() {
  return isConnected;
}

module.exports = {
  initCache,
  get,
  set,
  del,
  clearPattern,
  isReady
};

