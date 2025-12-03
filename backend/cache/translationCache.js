/**
 * In-memory translation cache
 * Structure: { lang: { key1: "value1", key2: "value2" } }
 */
let translationCache = {};

/**
 * Key order array - maintained globally for all languages
 */
let keyOrder = [];

/**
 * Cache state tracking for sync detection
 */
let cacheState = {
  lastSyncTime: null,
  lastDbModified: null,
  version: 0,
};

/**
 * Mark that DB was modified (increment version)
 */
export function markDbModified() {
  cacheState.lastDbModified = Date.now();
  cacheState.version++;
}

/**
 * Mark that cache was synced with DB
 */
export function markCacheSynced() {
  cacheState.lastSyncTime = Date.now();
}

/**
 * Get cache sync status
 */
export function getCacheStatus() {
  return {
    ...cacheState,
    isSynced: cacheState.lastSyncTime >= cacheState.lastDbModified,
  };
}

/**
 * Get all languages currently in cache
 * @returns {string[]} Array of language codes
 */
export function getLanguages() {
  return Object.keys(translationCache);
}

/**
 * Get translations for a specific language from cache
 * @param {string} lang - Language code
 * @returns {Object|null} Translation content or null
 */
export function getLanguageTranslations(lang) {
  return translationCache[lang] || null;
}

/**
 * Update cache for a specific language
 * @param {string} lang - Language code
 * @param {Object} content - Translation content
 */
export function updateLanguageCache(lang, content) {
  translationCache[lang] = content;
  console.log(`Cache updated for ${lang}`);
}

/**
 * Update a single key in the cache
 * @param {string} lang - Language code
 * @param {string} key - Translation key
 * @param {string} value - New value
 */
export function updateKeyInCache(lang, key, value) {
  if (translationCache[lang]) {
    translationCache[lang][key] = value;
    console.log(`Cache key ${key} updated for ${lang}`);
  }
}

/**
 * Remove a key from all languages in cache
 * @param {string} key - Translation key to remove
 */
export function removeKeyFromCache(key) {
  for (const lang of Object.keys(translationCache)) {
    if (translationCache[lang] && translationCache[lang][key] !== undefined) {
      delete translationCache[lang][key];
    }
  }
  console.log(`Key ${key} removed from all languages in cache`);
}

/**
 * Remove a language from cache
 * @param {string} lang - Language code
 */
export function removeLanguageFromCache(lang) {
  delete translationCache[lang];
  console.log(`Language removed from cache: ${lang}`);
}

/**
 * Check if a language exists in cache
 * @param {string} lang - Language code
 * @returns {boolean}
 */
export function hasLanguage(lang) {
  return lang in translationCache;
}

/**
 * Clear entire cache
 */
export function clearCache() {
  translationCache = {};
  console.log('Cache cleared');
}

/**
 * Get the entire cache object (for debugging)
 * @returns {Object}
 */
export function getFullCache() {
  return { ...translationCache };
}

/**
 * Initialize cache from DynamoDB data
 * @param {Array} items - Array of DynamoDB items
 */
export function initializeCache(items) {
  translationCache = {};
  for (const item of items) {
    if (item.lang && item.content) {
      translationCache[item.lang] = item.content;
    }
  }
  markCacheSynced();
  console.log(`Cache initialized with ${Object.keys(translationCache).length} languages`);
}

/**
 * Refresh a single language in cache from provided data
 * @param {string} lang - Language code
 * @param {Object} content - Translation content
 */
export function refreshLanguageCache(lang, content) {
  translationCache[lang] = content;
  console.log(`Cache refreshed for ${lang}`);
}

/**
 * Refresh entire cache from provided data
 * @param {Array} items - Array of items with lang and content
 */
export function refreshFullCache(items) {
  translationCache = {};
  for (const item of items) {
    if (item.lang && item.content) {
      translationCache[item.lang] = item.content;
    }
  }
  markCacheSynced();
  console.log(`Full cache refreshed with ${Object.keys(translationCache).length} languages`);
}

/**
 * Get the current key order
 * @returns {string[]} Array of keys in order
 */
export function getKeyOrder() {
  return [...keyOrder];
}

/**
 * Set the key order
 * @param {string[]} order - Array of keys in order
 */
export function setKeyOrder(order) {
  keyOrder = [...order];
  console.log(`Key order updated: ${keyOrder.length} keys`);
}

/**
 * Add a key to the order (at the end)
 * @param {string} key - Key to add
 */
export function addKeyToOrder(key) {
  if (!keyOrder.includes(key)) {
    keyOrder.push(key);
  }
}

/**
 * Remove a key from the order
 * @param {string} key - Key to remove
 */
export function removeKeyFromOrder(key) {
  keyOrder = keyOrder.filter((k) => k !== key);
}

export { translationCache, keyOrder };

