import { useState, useCallback, useMemo } from 'react';
import { Toaster, toast } from 'react-hot-toast';
import { useTranslations } from './hooks/useTranslations';
import {
  Header,
  TranslationTable,
  NewLanguageModal,
  AddKeyModal,
  ConfirmModal,
  CacheStatus,
  CostDashboard,
  FullPageLoader,
  toastConfig,
} from './components';

// Language name mapping
const LANGUAGE_NAMES = {
  en: 'English',
  es: 'Spanish',
  fr: 'French',
  de: 'German',
  it: 'Italian',
  pt: 'Portuguese',
  nl: 'Dutch',
  pl: 'Polish',
  ru: 'Russian',
  ja: 'Japanese',
  ko: 'Korean',
  zh: 'Chinese (Simplified)',
  'zh-TW': 'Chinese (Traditional)',
  ar: 'Arabic',
  hi: 'Hindi',
  ta: 'Tamil',
  te: 'Telugu',
  th: 'Thai',
  vi: 'Vietnamese',
  id: 'Indonesian',
  ms: 'Malay',
  tr: 'Turkish',
  uk: 'Ukrainian',
  cs: 'Czech',
  sv: 'Swedish',
  da: 'Danish',
  fi: 'Finnish',
  no: 'Norwegian',
  el: 'Greek',
  he: 'Hebrew',
  hu: 'Hungarian',
  ro: 'Romanian',
  sk: 'Slovak',
  bg: 'Bulgarian',
  hr: 'Croatian',
  sl: 'Slovenian',
  lt: 'Lithuanian',
  lv: 'Latvian',
  et: 'Estonian',
  fa: 'Persian',
  bn: 'Bengali',
  ml: 'Malayalam',
  kn: 'Kannada',
  mr: 'Marathi',
  gu: 'Gujarati',
  pa: 'Punjabi',
};

function App() {
  // Page state
  const [currentPage, setCurrentPage] = useState('translations'); // 'translations' | 'cost'

  // Modal states
  const [isNewLanguageModalOpen, setIsNewLanguageModalOpen] = useState(false);
  const [isAddKeyModalOpen, setIsAddKeyModalOpen] = useState(false);
  const [deleteKeyConfirm, setDeleteKeyConfirm] = useState({ isOpen: false, key: null });
  const [deleteLanguageConfirm, setDeleteLanguageConfirm] = useState({ isOpen: false, lang: null });
  const [isDeletingKey, setIsDeletingKey] = useState(false);

  // Use translations hook
  const {
    languages,
    selectedLanguage,
    translations,
    englishTranslations,
    keyOrder,
    isLoading,
    error,
    savingKeys,
    retranslatingKeys,
    isCreatingLanguage,
    isRetranslatingAll,
    isRefreshingCache,
    isAddingKey,
    removingKeys,
    isDeletingLanguage,
    isReorderingKeys,
    lastRefreshed,
    needsRefresh,
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
  } = useTranslations();

  const isEnglish = selectedLanguage === 'en';

  // Get language name
  const getLanguageName = useCallback((langCode) => {
    if (!langCode) return '';
    return LANGUAGE_NAMES[langCode] || langCode.toUpperCase();
  }, []);

  // Handlers
  const handleSave = useCallback(
    async (key, value) => {
      const success = await updateTranslation(key, value);
      if (success) {
        toast.success(`"${key}" saved successfully`);
      } else {
        toast.error(`Failed to save "${key}"`);
      }
      return success;
    },
    [updateTranslation]
  );

  const handleRetranslate = useCallback(
    async (key) => {
      const success = await retranslateKey(key);
      if (success) {
        toast.success(`"${key}" re-translated`);
      } else {
        toast.error(`Failed to re-translate "${key}"`);
      }
      return success;
    },
    [retranslateKey]
  );

  const handleRetranslateAll = useCallback(async () => {
    const success = await retranslateAll();
    if (success) {
      toast.success('All translations updated');
    } else {
      toast.error('Failed to re-translate');
    }
  }, [retranslateAll]);

  const handleRefreshCache = useCallback(async () => {
    const success = await refreshCache();
    if (success) {
      toast.success('Cache refreshed from DynamoDB');
    } else {
      toast.error('Failed to refresh cache');
    }
  }, [refreshCache]);

  const handleReorderKeys = useCallback(async (newOrder) => {
    const success = await reorderKeys(newOrder);
    if (success) {
      toast.success('Key order saved');
    } else {
      toast.error('Failed to save key order');
    }
    return success;
  }, [reorderKeys]);

  const handleCreateLanguage = useCallback(
    async (targetLang) => {
      const result = await createLanguage(targetLang);
      if (result) {
        if (result.isNew) {
          toast.success(`${getLanguageName(targetLang)} created successfully`);
        } else {
          toast.success(`${getLanguageName(targetLang)} loaded from cache`);
        }
      } else {
        toast.error('Failed to create language');
      }
      return result;
    },
    [createLanguage, getLanguageName]
  );

  const handleAddKey = useCallback(
    async (key, value) => {
      const success = await addKey(key, value);
      if (success) {
        toast.success(`Key "${key}" added to all languages`);
      } else {
        toast.error(`Failed to add key "${key}"`);
      }
      return success;
    },
    [addKey]
  );

  // Remove key handlers
  const handleRemoveKeyRequest = useCallback((key) => {
    setDeleteKeyConfirm({ isOpen: true, key });
  }, []);

  const handleConfirmDeleteKey = useCallback(async () => {
    const key = deleteKeyConfirm.key;
    if (!key) return;

    setIsDeletingKey(true);
    const success = await removeKey(key);
    setIsDeletingKey(false);

    if (success) {
      toast.success(`Key "${key}" removed from all languages`);
      setDeleteKeyConfirm({ isOpen: false, key: null });
    } else {
      toast.error(`Failed to remove key "${key}"`);
    }
  }, [deleteKeyConfirm.key, removeKey]);

  const handleCancelDeleteKey = useCallback(() => {
    if (!isDeletingKey) {
      setDeleteKeyConfirm({ isOpen: false, key: null });
    }
  }, [isDeletingKey]);

  // Delete language handlers
  const handleDeleteLanguageRequest = useCallback(() => {
    setDeleteLanguageConfirm({ isOpen: true, lang: selectedLanguage });
  }, [selectedLanguage]);

  const handleConfirmDeleteLanguage = useCallback(async () => {
    const lang = deleteLanguageConfirm.lang;
    if (!lang) return;

    const success = await deleteLanguage(lang);

    if (success) {
      toast.success(`${getLanguageName(lang)} deleted successfully`);
      setDeleteLanguageConfirm({ isOpen: false, lang: null });
    } else {
      toast.error(`Failed to delete ${getLanguageName(lang)}`);
    }
  }, [deleteLanguageConfirm.lang, deleteLanguage, getLanguageName]);

  const handleCancelDeleteLanguage = useCallback(() => {
    if (!isDeletingLanguage) {
      setDeleteLanguageConfirm({ isOpen: false, lang: null });
    }
  }, [isDeletingLanguage]);

  // Stats
  const stats = useMemo(() => {
    const keyCount = Object.keys(translations).length;
    return {
      languages: languages.length,
      keys: keyCount,
      currentLanguage: getLanguageName(selectedLanguage),
    };
  }, [languages, translations, selectedLanguage, getLanguageName]);

  // Show error
  if (error && !isLoading) {
    toast.error(error);
  }

  // Render Cost Dashboard page
  if (currentPage === 'cost') {
    return (
      <>
        <Toaster
          position={toastConfig.position}
          toastOptions={{
            duration: toastConfig.duration,
            style: toastConfig.style,
            success: toastConfig.success,
            error: toastConfig.error,
          }}
        />
        <CostDashboard onBack={() => setCurrentPage('translations')} />
      </>
    );
  }

  return (
    <div className="min-h-screen grid-pattern">
      {/* Toast notifications */}
      <Toaster
        position={toastConfig.position}
        toastOptions={{
          duration: toastConfig.duration,
          style: toastConfig.style,
          success: toastConfig.success,
          error: toastConfig.error,
        }}
      />

      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <Header
          languages={languages}
          selectedLanguage={selectedLanguage}
          onLanguageChange={selectLanguage}
          onNewLanguage={() => setIsNewLanguageModalOpen(true)}
          onRetranslateAll={handleRetranslateAll}
          onAddKey={() => setIsAddKeyModalOpen(true)}
          onDeleteLanguage={handleDeleteLanguageRequest}
          isRetranslatingAll={isRetranslatingAll}
          isEnglish={isEnglish}
        />

        {/* Stats Bar */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
          {/* Languages Count */}
          <div className="stat-card">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary-500/20 to-accent-500/20 flex items-center justify-center">
              <svg
                className="w-5 h-5 text-primary-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <p className="text-white/50 text-xs uppercase tracking-wide">Languages</p>
              <p className="text-white text-2xl font-bold">{stats.languages}</p>
            </div>
          </div>

          {/* Keys Count */}
          <div className="stat-card">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-accent-500/20 to-primary-500/20 flex items-center justify-center">
              <svg
                className="w-5 h-5 text-accent-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
                />
              </svg>
            </div>
            <div>
              <p className="text-white/50 text-xs uppercase tracking-wide">Translation Keys</p>
              <p className="text-white text-2xl font-bold">{stats.keys}</p>
            </div>
          </div>

          {/* Current Language */}
          <div className="stat-card">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center">
              <svg
                className="w-5 h-5 text-green-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <p className="text-white/50 text-xs uppercase tracking-wide">Current</p>
              <p className="text-white text-xl font-bold truncate">{stats.currentLanguage}</p>
            </div>
          </div>

          {/* Cache Status */}
          <CacheStatus
            lastRefreshed={lastRefreshed}
            onRefreshCache={handleRefreshCache}
            isRefreshing={isRefreshingCache}
            needsRefresh={needsRefresh}
          />

          {/* Cost Dashboard Link */}
          <button
            onClick={() => setCurrentPage('cost')}
            className="stat-card hover:bg-white/10 transition-colors cursor-pointer text-left"
          >
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
              <svg
                className="w-5 h-5 text-amber-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <div>
              <p className="text-white/50 text-xs uppercase tracking-wide">AWS Costs</p>
              <p className="text-white text-lg font-bold">View Dashboard →</p>
            </div>
          </button>
        </div>

        {/* Translation Table */}
        {isLoading ? (
          <div className="glass-card p-12 flex items-center justify-center">
            <div className="text-center">
              <div className="w-12 h-12 mx-auto mb-4">
                <svg
                  className="animate-spin text-primary-400"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
              </div>
              <p className="text-white/50">Loading translations...</p>
            </div>
          </div>
        ) : (
          <TranslationTable
            translations={translations}
            englishTranslations={englishTranslations}
            selectedLanguage={selectedLanguage}
            keyOrder={keyOrder}
            onSave={handleSave}
            onRetranslate={handleRetranslate}
            onRemoveKey={handleRemoveKeyRequest}
            onReorderKeys={handleReorderKeys}
            savingKeys={savingKeys}
            retranslatingKeys={retranslatingKeys}
            removingKeys={removingKeys}
          />
        )}

        {/* Footer */}
        <footer className="mt-8 text-center text-white/30 text-sm">
          <p>Translation Manager • Powered by AWS Translate & DynamoDB</p>
        </footer>
      </div>

      {/* New Language Modal */}
      <NewLanguageModal
        isOpen={isNewLanguageModalOpen}
        onClose={() => setIsNewLanguageModalOpen(false)}
        onCreate={handleCreateLanguage}
        existingLanguages={languages}
      />

      {/* Add Key Modal */}
      <AddKeyModal
        isOpen={isAddKeyModalOpen}
        onClose={() => setIsAddKeyModalOpen(false)}
        onAdd={handleAddKey}
        isAdding={isAddingKey}
      />

      {/* Delete Key Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteKeyConfirm.isOpen}
        onClose={handleCancelDeleteKey}
        onConfirm={handleConfirmDeleteKey}
        title="Delete Translation Key"
        message={
          <>
            Are you sure you want to delete{' '}
            <strong className="text-white">"{deleteKeyConfirm.key}"</strong> from{' '}
            <strong className="text-white">ALL languages</strong>?
            <br />
            <span className="text-red-400 text-sm">This action cannot be undone.</span>
          </>
        }
        confirmText="Yes, Delete"
        cancelText="Cancel"
        isLoading={isDeletingKey}
        variant="danger"
      />

      {/* Delete Language Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteLanguageConfirm.isOpen}
        onClose={handleCancelDeleteLanguage}
        onConfirm={handleConfirmDeleteLanguage}
        title="Delete Language"
        message={
          <>
            Are you sure you want to delete{' '}
            <strong className="text-white">
              {getLanguageName(deleteLanguageConfirm.lang)} ({deleteLanguageConfirm.lang})
            </strong>
            ?
            <br />
            <span className="text-white/70 text-sm">
              All translations for this language will be permanently removed.
            </span>
            <br />
            <span className="text-red-400 text-sm">This action cannot be undone.</span>
          </>
        }
        confirmText="Yes, Delete Language"
        cancelText="Cancel"
        isLoading={isDeletingLanguage}
        variant="danger"
      />

      {/* Full page loader for long operations */}
      {(isCreatingLanguage || isRetranslatingAll || isAddingKey || isDeletingLanguage) && (
        <FullPageLoader
          message={
            isCreatingLanguage
              ? 'Creating translations with AWS Translate...'
              : isAddingKey
                ? 'Adding key to all languages...'
                : isDeletingLanguage
                  ? 'Deleting language...'
                  : 'Re-translating all keys...'
          }
        />
      )}
    </div>
  );
}

export default App;

