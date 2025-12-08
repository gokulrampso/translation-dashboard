import {
  getTranslation,
  saveTranslation,
  updateTranslationKey,
  getAllTranslations,
  languageExists,
  deleteLanguage as deleteLanguageFromDb,
  getKeyOrder as getKeyOrderFromDb,
  saveKeyOrder as saveKeyOrderToDb,
} from '../aws/dynamoClient.js';
import { translateText, translateContent, SUPPORTED_LANGUAGES } from '../aws/translateClient.js';
import {
  getLanguages,
  getLanguageTranslations,
  updateLanguageCache,
  refreshLanguageCache,
  refreshFullCache,
  initializeCache,
  hasLanguage,
  updateKeyInCache,
  removeKeyFromCache,
  removeLanguageFromCache,
  markDbModified,
  markCacheSynced,
  getCacheStatus as getCacheStatusFromCache,
  getKeyOrder as getKeyOrderFromCache,
  setKeyOrder as setKeyOrderInCache,
  addKeyToOrder,
  removeKeyFromOrder,
} from '../cache/translationCache.js';

// Base language (English)
const BASE_LANGUAGE = 'en';

/**
 * Initialize cache from DynamoDB on server startup
 */
export async function initializeTranslationCache() {
  try {
    console.log('Loading translations from DynamoDB...');
    const items = await getAllTranslations();
    
    // Filter out the _keyOrder item from translations
    const translationItems = items.filter((item) => item.lang !== '_keyOrder');
    initializeCache(translationItems);
    
    // Load key order from DynamoDB
    const keyOrder = await getKeyOrderFromDb();
    if (keyOrder && keyOrder.length > 0) {
      setKeyOrderInCache(keyOrder);
      console.log(`Loaded key order: ${keyOrder.length} keys`);
    } else {
      // If no key order exists, create one from English keys
      const englishContent = translationItems.find((item) => item.lang === BASE_LANGUAGE)?.content;
      if (englishContent) {
        const keys = Object.keys(englishContent);
        setKeyOrderInCache(keys);
        await saveKeyOrderToDb(keys);
        console.log(`Created initial key order: ${keys.length} keys`);
      }
    }
    
    console.log(`Loaded ${translationItems.length} languages into cache`);
    return translationItems.length;
  } catch (error) {
    console.error('Failed to initialize cache:', error);
    throw error;
  }
}

/**
 * Get list of available languages
 */
export function listLanguages() {
  return getLanguages();
}

/**
 * Get supported languages for translation
 */
export function getSupportedLanguages() {
  return SUPPORTED_LANGUAGES;
}

/**
 * Get translations for a language from cache (ordered)
 */
export function getTranslations(lang) {
  const translations = getLanguageTranslations(lang);
  if (!translations) {
    throw new Error(`Language "${lang}" not found in cache`);
  }
  return translations;
}

/**
 * Get translations with key order info
 */
export function getTranslationsWithOrder(lang) {
  const translations = getLanguageTranslations(lang);
  if (!translations) {
    throw new Error(`Language "${lang}" not found in cache`);
  }
  
  const keyOrder = getKeyOrderFromCache();
  
  // Build ordered translations object
  const orderedTranslations = {};
  const translationKeys = Object.keys(translations);
  
  // First add keys in order
  for (const key of keyOrder) {
    if (translations[key] !== undefined) {
      orderedTranslations[key] = translations[key];
    }
  }
  
  // Then add any keys not in the order (new keys)
  for (const key of translationKeys) {
    if (!keyOrder.includes(key)) {
      orderedTranslations[key] = translations[key];
    }
  }
  
  return {
    translations: orderedTranslations,
    keyOrder: keyOrder.filter((k) => translationKeys.includes(k)),
  };
}

/**
 * Get the current key order
 */
export function getKeyOrder() {
  return getKeyOrderFromCache();
}

/**
 * Update key order
 */
export async function updateKeyOrder(newOrder) {
  try {
    // Save to DynamoDB
    await saveKeyOrderToDb(newOrder);
    
    // Update cache
    setKeyOrderInCache(newOrder);
    
    // Mark DB as modified
    markDbModified();
    markCacheSynced();
    
    console.log(`Key order updated: ${newOrder.length} keys`);
    return { success: true, keyOrder: newOrder };
  } catch (error) {
    console.error('Error updating key order:', error);
    throw error;
  }
}

/**
 * Update a single translation key
 */
export async function updateTranslation(lang, key, value) {
  try {
    // Update in DynamoDB
    const updatedContent = await updateTranslationKey(lang, key, value);

    // Re-fetch from DB to ensure consistency
    const freshContent = await getTranslation(lang);

    // Update cache with fresh data
    if (freshContent) {
      updateLanguageCache(lang, freshContent);
    }

    // Mark DB as modified
    markDbModified();
    markCacheSynced();

    return freshContent || updatedContent;
  } catch (error) {
    console.error(`Error updating translation ${lang}/${key}:`, error);
    throw error;
  }
}

/**
 * Re-translate a single key for a language
 */
export async function retranslateKey(lang, key) {
  try {
    // Get English value
    const englishContent = getLanguageTranslations(BASE_LANGUAGE);
    if (!englishContent || !englishContent[key]) {
      throw new Error(`Key "${key}" not found in English translations`);
    }

    // Translate the key
    const translatedValue = await translateText(englishContent[key], BASE_LANGUAGE, lang);

    // Update in DynamoDB
    await updateTranslationKey(lang, key, translatedValue);

    // Re-fetch and update cache
    const freshContent = await getTranslation(lang);
    if (freshContent) {
      updateLanguageCache(lang, freshContent);
    }

    // Mark DB as modified
    markDbModified();
    markCacheSynced();

    return { key, value: translatedValue };
  } catch (error) {
    console.error(`Error retranslating ${lang}/${key}:`, error);
    throw error;
  }
}

/**
 * Re-translate all keys for a language
 */
export async function retranslateLanguage(lang) {
  try {
    if (lang === BASE_LANGUAGE) {
      throw new Error('Cannot retranslate the base language');
    }

    // Get English content
    const englishContent = getLanguageTranslations(BASE_LANGUAGE);
    if (!englishContent) {
      throw new Error('English translations not found');
    }

    // Translate all content
    const translatedContent = await translateContent(englishContent, BASE_LANGUAGE, lang);

    // Save to DynamoDB
    await saveTranslation(lang, translatedContent);

    // Update cache
    updateLanguageCache(lang, translatedContent);

    // Mark DB as modified
    markDbModified();
    markCacheSynced();

    return translatedContent;
  } catch (error) {
    console.error(`Error retranslating language ${lang}:`, error);
    throw error;
  }
}

/**
 * Create a new language by translating from English
 */
export async function createNewLanguage(targetLang) {
  try {
    // Check if language already exists
    if (hasLanguage(targetLang)) {
      return {
        isNew: false,
        content: getLanguageTranslations(targetLang),
      };
    }

    // Check if exists in DB
    const existingContent = await getTranslation(targetLang);
    if (existingContent) {
      updateLanguageCache(targetLang, existingContent);
      return {
        isNew: false,
        content: existingContent,
      };
    }

    // Get English content
    const englishContent = getLanguageTranslations(BASE_LANGUAGE);
    if (!englishContent || Object.keys(englishContent).length === 0) {
      throw new Error('English translations not found. Please add English translations first.');
    }

    // Translate all content
    console.log(`Translating content to ${targetLang}...`);
    const translatedContent = await translateContent(englishContent, BASE_LANGUAGE, targetLang);

    // Save to DynamoDB
    await saveTranslation(targetLang, translatedContent);

    // Update cache
    updateLanguageCache(targetLang, translatedContent);

    // Mark DB as modified
    markDbModified();
    markCacheSynced();

    return {
      isNew: true,
      content: translatedContent,
    };
  } catch (error) {
    console.error(`Error creating language ${targetLang}:`, error);
    throw error;
  }
}

/**
 * Add a new translation key to all languages
 */
export async function addTranslationKey(key, englishValue) {
  try {
    // Check if key already exists in English
    const englishContent = getLanguageTranslations(BASE_LANGUAGE);
    if (englishContent && englishContent[key] !== undefined) {
      throw new Error(`Key "${key}" already exists`);
    }

    // Get all languages
    const languages = getLanguages();

    // If English doesn't exist yet, create it
    if (!languages.includes(BASE_LANGUAGE)) {
      const content = { [key]: englishValue };
      await saveTranslation(BASE_LANGUAGE, content);
      updateLanguageCache(BASE_LANGUAGE, content);
      
      // Add key to order and save
      addKeyToOrder(key);
      await saveKeyOrderToDb(getKeyOrderFromCache());
      
      markDbModified();
      markCacheSynced();
      return { key, value: englishValue, languagesUpdated: [BASE_LANGUAGE] };
    }

    // Update English first
    await updateTranslationKey(BASE_LANGUAGE, key, englishValue);
    updateKeyInCache(BASE_LANGUAGE, key, englishValue);

    const languagesUpdated = [BASE_LANGUAGE];

    // Translate and add to all other languages
    for (const lang of languages) {
      if (lang !== BASE_LANGUAGE) {
        try {
          const translatedValue = await translateText(englishValue, BASE_LANGUAGE, lang);
          await updateTranslationKey(lang, key, translatedValue);
          updateKeyInCache(lang, key, translatedValue);
          languagesUpdated.push(lang);
        } catch (err) {
          console.error(`Failed to add key to ${lang}:`, err);
        }
      }
    }

    // Add key to order and save
    addKeyToOrder(key);
    await saveKeyOrderToDb(getKeyOrderFromCache());

    // Mark DB as modified
    markDbModified();
    markCacheSynced();

    return { key, value: englishValue, languagesUpdated };
  } catch (error) {
    console.error(`Error adding translation key ${key}:`, error);
    throw error;
  }
}

/**
 * Remove a translation key from all languages
 */
export async function removeTranslationKey(key) {
  try {
    const languages = getLanguages();
    const languagesUpdated = [];

    for (const lang of languages) {
      const content = getLanguageTranslations(lang);
      if (content && content[key] !== undefined) {
        // Remove from content
        const newContent = { ...content };
        delete newContent[key];

        // Save to DynamoDB
        await saveTranslation(lang, newContent);
        languagesUpdated.push(lang);
      }
    }

    // Remove from cache
    removeKeyFromCache(key);
    
    // Remove from key order and save
    removeKeyFromOrder(key);
    await saveKeyOrderToDb(getKeyOrderFromCache());

    // Mark DB as modified
    markDbModified();
    markCacheSynced();

    return { key, removed: true, languagesUpdated };
  } catch (error) {
    console.error(`Error removing translation key ${key}:`, error);
    throw error;
  }
}

/**
 * Delete a language
 */
export async function deleteLanguage(lang) {
  try {
    if (lang === BASE_LANGUAGE) {
      throw new Error('Cannot delete the base language (English)');
    }

    if (!hasLanguage(lang)) {
      throw new Error(`Language "${lang}" not found`);
    }

    // Delete from DynamoDB
    await deleteLanguageFromDb(lang);

    // Remove from cache
    removeLanguageFromCache(lang);

    // Mark DB as modified
    markDbModified();
    markCacheSynced();

    console.log(`Language "${lang}" deleted successfully`);

    return {
      lang,
      deleted: true,
      remainingLanguages: getLanguages(),
    };
  } catch (error) {
    console.error(`Error deleting language ${lang}:`, error);
    throw error;
  }
}

/**
 * Refresh cache from DynamoDB
 */
export async function refreshCache() {
  try {
    console.log('Refreshing cache from DynamoDB...');
    const items = await getAllTranslations();
    refreshFullCache(items);
    return {
      languagesLoaded: items.length,
      languages: items.map((item) => item.lang),
    };
  } catch (error) {
    console.error('Error refreshing cache:', error);
    throw error;
  }
}

/**
 * Get cache status
 */
export function getCacheStatus() {
  return getCacheStatusFromCache();
}

/**
 * Bulk upload English translations (merge with existing)
 * @param {Object} newTranslations - Key-value pairs to upload
 * @param {boolean} overwrite - Whether to overwrite existing keys
 */
export async function bulkUploadEnglish(newTranslations, overwrite = false) {
  try {
    if (!newTranslations || typeof newTranslations !== 'object') {
      throw new Error('Invalid translations format');
    }

    // Get existing English translations
    const existingContent = getLanguageTranslations(BASE_LANGUAGE) || {};
    const languages = getLanguages();

    // Track what was added/updated
    const added = [];
    const updated = [];
    const skipped = [];

    // Process each key
    for (const [key, value] of Object.entries(newTranslations)) {
      if (typeof value !== 'string') {
        console.warn(`Skipping key "${key}" - value is not a string`);
        skipped.push(key);
        continue;
      }

      // Validate key format
      const keyRegex = /^[a-zA-Z0-9_.]+$/;
      if (!keyRegex.test(key)) {
        console.warn(`Skipping key "${key}" - invalid format`);
        skipped.push(key);
        continue;
      }

      const keyExists = existingContent[key] !== undefined;

      if (keyExists && !overwrite) {
        skipped.push(key);
        continue;
      }

      if (keyExists) {
        updated.push(key);
      } else {
        added.push(key);
      }
    }

    // Keys to process (either new or to be updated)
    const keysToProcess = [...added, ...updated];

    if (keysToProcess.length === 0) {
      return { added: [], updated: [], skipped, translatedLanguages: [] };
    }

    // Build merged English content
    const mergedEnglishContent = { ...existingContent };
    for (const key of keysToProcess) {
      mergedEnglishContent[key] = newTranslations[key];
    }

    // Save English translations
    await saveTranslation(BASE_LANGUAGE, mergedEnglishContent);
    updateLanguageCache(BASE_LANGUAGE, mergedEnglishContent);

    // Update key order for new keys
    const currentKeyOrder = getKeyOrderFromCache();
    const newKeyOrder = [...currentKeyOrder];
    for (const key of added) {
      if (!newKeyOrder.includes(key)) {
        newKeyOrder.push(key);
      }
    }
    setKeyOrderInCache(newKeyOrder);
    await saveKeyOrderToDb(newKeyOrder);

    // Translate new/updated keys to all other languages
    const translatedLanguages = [];
    for (const lang of languages) {
      if (lang !== BASE_LANGUAGE) {
        try {
          const langContent = getLanguageTranslations(lang) || {};
          const updatedLangContent = { ...langContent };

          // Translate each key that needs processing
          for (const key of keysToProcess) {
            const translatedValue = await translateText(
              newTranslations[key],
              BASE_LANGUAGE,
              lang
            );
            updatedLangContent[key] = translatedValue;
          }

          await saveTranslation(lang, updatedLangContent);
          updateLanguageCache(lang, updatedLangContent);
          translatedLanguages.push(lang);
        } catch (err) {
          console.error(`Failed to translate to ${lang}:`, err);
        }
      }
    }

    // Mark DB as modified
    markDbModified();
    markCacheSynced();

    console.log(`Bulk upload complete: ${added.length} added, ${updated.length} updated, ${skipped.length} skipped`);

    return {
      added,
      updated,
      skipped,
      translatedLanguages,
    };
  } catch (error) {
    console.error('Error in bulk upload:', error);
    throw error;
  }
}

/**
 * Download translations for a language (from cache or DynamoDB)
 * Returns the current state including any manual edits
 * @param {string} lang - Language code
 */
export function downloadTranslations(lang) {
  const translations = getLanguageTranslations(lang);
  if (!translations) {
    throw new Error(`Language "${lang}" not found`);
  }

  // Return translations in key order
  const keyOrder = getKeyOrderFromCache();
  const orderedTranslations = {};

  // First add keys in order
  for (const key of keyOrder) {
    if (translations[key] !== undefined) {
      orderedTranslations[key] = translations[key];
    }
  }

  // Then add any keys not in the order
  for (const key of Object.keys(translations)) {
    if (!keyOrder.includes(key)) {
      orderedTranslations[key] = translations[key];
    }
  }

  return orderedTranslations;
}

