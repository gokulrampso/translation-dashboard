import { useState, useEffect, useCallback, useRef } from 'react';
import { languageApi, translationApi, cacheApi } from '../services/api';

export function useTranslations() {
  // State
  const [languages, setLanguages] = useState([]);
  const [selectedLanguage, setSelectedLanguage] = useState('en');
  const [translations, setTranslations] = useState({});
  const [englishTranslations, setEnglishTranslations] = useState({});
  const [keyOrder, setKeyOrder] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Operation states
  const [savingKeys, setSavingKeys] = useState(new Set());
  const [retranslatingKeys, setRetranslatingKeys] = useState(new Set());
  const [isCreatingLanguage, setIsCreatingLanguage] = useState(false);
  const [isRetranslatingAll, setIsRetranslatingAll] = useState(false);
  const [isRefreshingCache, setIsRefreshingCache] = useState(false);
  const [isAddingKey, setIsAddingKey] = useState(false);
  const [removingKeys, setRemovingKeys] = useState(new Set());
  const [isDeletingLanguage, setIsDeletingLanguage] = useState(false);
  const [isReorderingKeys, setIsReorderingKeys] = useState(false);

  // Cache status
  const [lastRefreshed, setLastRefreshed] = useState(null);
  const [cacheVersion, setCacheVersion] = useState(0);
  const [needsRefresh, setNeedsRefresh] = useState(false);
  const lastKnownVersion = useRef(0);

  // Fetch available languages
  const fetchLanguages = useCallback(async () => {
    try {
      const response = await languageApi.getLanguages();
      setLanguages(response.data || []);
      return response.data || [];
    } catch (err) {
      setError(err.message);
      return [];
    }
  }, []);

  // Fetch translations for a language
  const fetchTranslations = useCallback(async (lang) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await translationApi.getTranslations(lang);
      const data = response.data || {};
      
      // Handle new response format with translations and keyOrder
      if (data.translations && data.keyOrder) {
        setTranslations(data.translations);
        setKeyOrder(data.keyOrder);
      } else {
        // Fallback for old format
        setTranslations(data);
      }

      // Also fetch English if not already loaded and lang is not English
      if (lang !== 'en') {
        try {
          const englishResponse = await translationApi.getTranslations('en');
          const englishData = englishResponse.data || {};
          if (englishData.translations) {
            setEnglishTranslations(englishData.translations);
          } else {
            setEnglishTranslations(englishData);
          }
        } catch {
          // English might not exist yet
          setEnglishTranslations({});
        }
      } else {
        if (data.translations) {
          setEnglishTranslations(data.translations);
        } else {
          setEnglishTranslations(data);
        }
      }
    } catch (err) {
      if (err.message.includes('not found')) {
        setTranslations({});
        setKeyOrder([]);
      } else {
        setError(err.message);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Update a single translation
  const updateTranslation = useCallback(async (key, value) => {
    try {
      setSavingKeys((prev) => new Set(prev).add(key));
      setError(null);

      const response = await translationApi.updateTranslation(selectedLanguage, key, value);
      const data = response.data || {};
      
      if (data.translations) {
        setTranslations(data.translations);
        if (data.keyOrder) setKeyOrder(data.keyOrder);
      } else {
        setTranslations(data);
      }

      if (selectedLanguage === 'en') {
        if (data.translations) {
          setEnglishTranslations(data.translations);
        } else {
          setEnglishTranslations(data);
        }
      }

      return true;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setSavingKeys((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }
  }, [selectedLanguage]);

  // Add a new key
  const addKey = useCallback(async (key, value) => {
    try {
      setIsAddingKey(true);
      setError(null);

      await translationApi.addKey(key, value);

      // Refresh translations
      await fetchTranslations(selectedLanguage);
      await fetchLanguages();

      return true;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setIsAddingKey(false);
    }
  }, [selectedLanguage, fetchTranslations, fetchLanguages]);

  // Remove a key
  const removeKey = useCallback(async (key) => {
    try {
      setRemovingKeys((prev) => new Set(prev).add(key));
      setError(null);

      await translationApi.removeKey(key);

      // Refresh translations
      await fetchTranslations(selectedLanguage);

      return true;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setRemovingKeys((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }
  }, [selectedLanguage, fetchTranslations]);

  // Reorder keys (drag and drop)
  const reorderKeys = useCallback(async (newOrder) => {
    try {
      setIsReorderingKeys(true);
      setError(null);

      // Optimistically update UI
      setKeyOrder(newOrder);

      // Save to backend
      await translationApi.updateKeyOrder(newOrder);

      return true;
    } catch (err) {
      setError(err.message);
      // Revert on error - refetch
      await fetchTranslations(selectedLanguage);
      return false;
    } finally {
      setIsReorderingKeys(false);
    }
  }, [selectedLanguage, fetchTranslations]);

  // Re-translate a single key
  const retranslateKey = useCallback(async (key) => {
    try {
      setRetranslatingKeys((prev) => new Set(prev).add(key));
      setError(null);

      const response = await translationApi.retranslateKey(selectedLanguage, key);

      // Update translation in state
      setTranslations((prev) => ({
        ...prev,
        [response.data.key]: response.data.value,
      }));

      return true;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setRetranslatingKeys((prev) => {
        const next = new Set(prev);
        next.delete(key);
        return next;
      });
    }
  }, [selectedLanguage]);

  // Re-translate all keys for current language
  const retranslateAll = useCallback(async () => {
    try {
      setIsRetranslatingAll(true);
      setError(null);

      const response = await translationApi.retranslateLanguage(selectedLanguage);
      const data = response.data || {};
      
      if (data.translations) {
        setTranslations(data.translations);
      } else {
        setTranslations(data);
      }

      return true;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setIsRetranslatingAll(false);
    }
  }, [selectedLanguage]);

  // Create a new language
  const createLanguage = useCallback(async (targetLang) => {
    try {
      setIsCreatingLanguage(true);
      setError(null);

      const response = await translationApi.createLanguage(targetLang);

      // Refresh languages list
      await fetchLanguages();

      // Switch to new language
      setSelectedLanguage(targetLang);
      setTranslations(response.data.content || {});

      return response.data;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setIsCreatingLanguage(false);
    }
  }, [fetchLanguages]);

  // Delete a language
  const deleteLanguage = useCallback(async (lang) => {
    try {
      setIsDeletingLanguage(true);
      setError(null);

      await languageApi.deleteLanguage(lang);

      // Refresh languages list
      await fetchLanguages();

      // Switch to English
      setSelectedLanguage('en');
      await fetchTranslations('en');

      return true;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setIsDeletingLanguage(false);
    }
  }, [fetchLanguages, fetchTranslations]);

  // Refresh cache from DynamoDB
  const refreshCache = useCallback(async () => {
    try {
      setIsRefreshingCache(true);
      setError(null);

      await cacheApi.refreshCache();

      // Refresh current data
      await fetchLanguages();
      await fetchTranslations(selectedLanguage);

      // Update cache status
      setLastRefreshed(Date.now());
      setNeedsRefresh(false);
      lastKnownVersion.current = cacheVersion;

      return true;
    } catch (err) {
      setError(err.message);
      return false;
    } finally {
      setIsRefreshingCache(false);
    }
  }, [selectedLanguage, fetchLanguages, fetchTranslations, cacheVersion]);

  // Change selected language
  const selectLanguage = useCallback((lang) => {
    setSelectedLanguage(lang);
  }, []);

  // Poll for cache status
  useEffect(() => {
    const fetchCacheStatus = async () => {
      try {
        const response = await cacheApi.getCacheStatus();
        const status = response.data;

        setCacheVersion(status.version);

        if (lastKnownVersion.current === 0) {
          lastKnownVersion.current = status.version;
          setLastRefreshed(status.lastSyncTime);
        } else if (status.version > lastKnownVersion.current) {
          setNeedsRefresh(true);
        }
      } catch {
        // Silently fail for cache status
      }
    };

    fetchCacheStatus();
    const interval = setInterval(fetchCacheStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  // Initial load
  useEffect(() => {
    const init = async () => {
      setIsLoading(true);
      await fetchLanguages();
      await fetchTranslations('en');
      setIsLoading(false);
    };
    init();
  }, [fetchLanguages, fetchTranslations]);

  // Load translations when language changes
  useEffect(() => {
    if (selectedLanguage) {
      fetchTranslations(selectedLanguage);
    }
  }, [selectedLanguage, fetchTranslations]);

  return {
    // Data
    languages,
    selectedLanguage,
    translations,
    englishTranslations,
    keyOrder,
    isLoading,
    error,

    // Operation states
    savingKeys,
    retranslatingKeys,
    isCreatingLanguage,
    isRetranslatingAll,
    isRefreshingCache,
    isAddingKey,
    removingKeys,
    isDeletingLanguage,
    isReorderingKeys,

    // Cache status
    lastRefreshed,
    needsRefresh,

    // Actions
    selectLanguage,
    updateTranslation,
    addKey,
    removeKey,
    reorderKeys,
    retranslateKey,
    retranslateAll,
    createLanguage,
    deleteLanguage,
    refreshCache,
    fetchLanguages,
    fetchTranslations,
  };
}
