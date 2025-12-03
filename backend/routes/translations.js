import { Router } from 'express';
import {
  listLanguages,
  getTranslations,
  getTranslationsWithOrder,
  updateTranslation,
  retranslateKey,
  retranslateLanguage,
  createNewLanguage,
  refreshCache,
  getSupportedLanguages,
  addTranslationKey,
  removeTranslationKey,
  deleteLanguage,
  getCacheStatus,
  getKeyOrder,
  updateKeyOrder,
} from '../services/translationService.js';
import { asyncHandler, apiResponse } from '../utils/asyncHandler.js';

const router = Router();

// ============================================
// LANGUAGE ENDPOINTS
// ============================================

/**
 * GET /languages
 * Get list of available languages in cache
 */
router.get('/languages', asyncHandler(async (req, res) => {
  const languages = listLanguages();
  return apiResponse.success(res, languages, 'Languages retrieved successfully');
}));

/**
 * GET /languages/supported
 * Get list of all supported languages for translation
 */
router.get('/languages/supported', asyncHandler(async (req, res) => {
  const languages = getSupportedLanguages();
  return apiResponse.success(res, languages, 'Supported languages retrieved');
}));

/**
 * DELETE /languages/:lang
 * Delete a language (cannot delete English)
 */
router.delete('/languages/:lang', asyncHandler(async (req, res) => {
  const { lang } = req.params;

  if (lang === 'en') {
    return apiResponse.error(res, 'Cannot delete the base language (English)', 400);
  }

  const result = await deleteLanguage(lang);
  return apiResponse.success(res, result, `Language "${lang}" deleted successfully`);
}));

// ============================================
// TRANSLATION ENDPOINTS
// ============================================

/**
 * GET /translations/:lang
 * Get translations for a specific language from cache (with order)
 */
router.get('/translations/:lang', asyncHandler(async (req, res) => {
  const { lang } = req.params;

  try {
    const result = getTranslationsWithOrder(lang);
    return apiResponse.success(res, result, `Translations for ${lang} retrieved`);
  } catch (error) {
    if (error.message.includes('not found')) {
      return apiResponse.error(res, error.message, 404);
    }
    throw error;
  }
}));

/**
 * GET /translations/keys/order
 * Get the current key order
 */
router.get('/translations/keys/order', asyncHandler(async (req, res) => {
  const keyOrder = getKeyOrder();
  return apiResponse.success(res, keyOrder, 'Key order retrieved');
}));

/**
 * PUT /translations/keys/order
 * Update the key order (drag and drop reordering)
 */
router.put('/translations/keys/order', asyncHandler(async (req, res) => {
  const { order } = req.body;

  if (!order || !Array.isArray(order)) {
    return apiResponse.error(res, 'Order must be an array of keys', 400);
  }

  const result = await updateKeyOrder(order);
  return apiResponse.success(res, result, 'Key order updated successfully');
}));

/**
 * PUT /translations/:lang/:key
 * Update a single translation key
 */
router.put('/translations/:lang/:key', asyncHandler(async (req, res) => {
  const { lang, key } = req.params;
  const { value } = req.body;

  if (!value && value !== '') {
    return apiResponse.error(res, 'Value is required', 400);
  }

  const updatedContent = await updateTranslation(lang, key, value);
  return apiResponse.success(res, updatedContent, `Translation updated for ${lang}/${key}`);
}));

/**
 * POST /translations/keys
 * Add a new translation key to all languages
 */
router.post('/translations/keys', asyncHandler(async (req, res) => {
  const { key, value } = req.body;

  if (!key || typeof key !== 'string') {
    return apiResponse.error(res, 'Key is required and must be a string', 400);
  }

  if (!value || typeof value !== 'string') {
    return apiResponse.error(res, 'Value is required and must be a string', 400);
  }

  // Validate key format (alphanumeric, underscores, dots)
  const keyRegex = /^[a-zA-Z0-9_.]+$/;
  if (!keyRegex.test(key)) {
    return apiResponse.error(
      res,
      'Key must contain only alphanumeric characters, underscores, and dots',
      400
    );
  }

  const result = await addTranslationKey(key, value);
  return apiResponse.success(res, result, `Key "${key}" added to all languages`);
}));

/**
 * DELETE /translations/keys/:key
 * Remove a translation key from all languages
 */
router.delete('/translations/keys/:key', asyncHandler(async (req, res) => {
  const { key } = req.params;

  if (!key) {
    return apiResponse.error(res, 'Key is required', 400);
  }

  const result = await removeTranslationKey(key);
  return apiResponse.success(res, result, `Key "${key}" removed from all languages`);
}));

/**
 * POST /translations/:lang/:key/retranslate
 * Re-translate a single key for a language
 */
router.post('/translations/:lang/:key/retranslate', asyncHandler(async (req, res) => {
  const { lang, key } = req.params;

  if (lang === 'en') {
    return apiResponse.error(res, 'Cannot retranslate English (base language)', 400);
  }

  const result = await retranslateKey(lang, key);
  return apiResponse.success(res, result, `Key ${key} retranslated for ${lang}`);
}));

/**
 * POST /translations/:lang/retranslate
 * Re-translate all keys for a language
 */
router.post('/translations/:lang/retranslate', asyncHandler(async (req, res) => {
  const { lang } = req.params;

  if (lang === 'en') {
    return apiResponse.error(res, 'Cannot retranslate English (base language)', 400);
  }

  const content = await retranslateLanguage(lang);
  return apiResponse.success(res, content, `All keys retranslated for ${lang}`);
}));

/**
 * POST /translations/new
 * Create a new language by translating from English
 */
router.post('/translations/new', asyncHandler(async (req, res) => {
  const { targetLang } = req.body;

  if (!targetLang) {
    return apiResponse.error(res, 'Target language is required', 400);
  }

  const result = await createNewLanguage(targetLang);
  const message = result.isNew
    ? `Language ${targetLang} created successfully`
    : `Language ${targetLang} already exists`;

  return apiResponse.success(res, result, message);
}));

// ============================================
// CACHE ENDPOINTS
// ============================================

/**
 * POST /cache/refresh
 * Refresh cache from DynamoDB
 */
router.post('/cache/refresh', asyncHandler(async (req, res) => {
  const result = await refreshCache();
  return apiResponse.success(res, result, 'Cache refreshed from DynamoDB');
}));

/**
 * GET /cache/status
 * Get cache synchronization status
 */
router.get('/cache/status', asyncHandler(async (req, res) => {
  const status = getCacheStatus();
  return apiResponse.success(res, status, 'Cache status retrieved');
}));

// ============================================
// USAGE/COST ENDPOINTS
// ============================================

import { getUsageStats, resetUsageStats } from '../services/usageTracker.js';

/**
 * GET /usage
 * Get usage statistics for cost estimation
 */
router.get('/usage', asyncHandler(async (req, res) => {
  const stats = getUsageStats();
  return apiResponse.success(res, stats, 'Usage statistics retrieved');
}));

/**
 * POST /usage/reset
 * Reset usage statistics
 */
router.post('/usage/reset', asyncHandler(async (req, res) => {
  resetUsageStats();
  return apiResponse.success(res, { reset: true }, 'Usage statistics reset');
}));

export default router;

