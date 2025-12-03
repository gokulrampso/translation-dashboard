import { useState, useEffect } from 'react';
import { languageApi } from '../services/api';
import { LoadingSpinner } from './LoadingSpinner';

export function NewLanguageModal({ isOpen, onClose, onCreate, existingLanguages }) {
  const [supportedLanguages, setSupportedLanguages] = useState([]);
  const [selectedLanguages, setSelectedLanguages] = useState(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [creatingLanguage, setCreatingLanguage] = useState('');
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  useEffect(() => {
    if (isOpen) {
      loadSupportedLanguages();
      setSelectedLanguages(new Set());
      setSearchTerm('');
      setProgress({ current: 0, total: 0 });
    }
  }, [isOpen]);

  const loadSupportedLanguages = async () => {
    try {
      setIsLoading(true);
      const response = await languageApi.getSupportedLanguages();
      setSupportedLanguages(response.data || []);
    } catch (error) {
      console.error('Failed to load supported languages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleLanguage = (langCode) => {
    setSelectedLanguages((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(langCode)) {
        newSet.delete(langCode);
      } else {
        newSet.add(langCode);
      }
      return newSet;
    });
  };

  const selectAll = () => {
    const allCodes = filteredLanguages.map((lang) => lang.code);
    setSelectedLanguages(new Set(allCodes));
  };

  const clearAll = () => {
    setSelectedLanguages(new Set());
  };

  const handleCreate = async () => {
    if (selectedLanguages.size === 0) return;

    setIsCreating(true);
    const languages = Array.from(selectedLanguages);
    setProgress({ current: 0, total: languages.length });

    try {
      for (let i = 0; i < languages.length; i++) {
        const lang = languages[i];
        setCreatingLanguage(lang);
        setProgress({ current: i + 1, total: languages.length });
        await onCreate(lang);
      }
      onClose();
    } catch (error) {
      console.error('Error creating languages:', error);
    } finally {
      setIsCreating(false);
      setCreatingLanguage('');
      setSelectedLanguages(new Set());
      setSearchTerm('');
    }
  };

  const filteredLanguages = supportedLanguages.filter(
    (lang) =>
      !existingLanguages.includes(lang.code) &&
      (lang.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lang.code.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const getLanguageName = (code) => {
    const lang = supportedLanguages.find((l) => l.code === code);
    return lang ? lang.name : code;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-dark-950/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="glass-card w-full max-w-lg p-6 m-4">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold text-white">Create New Languages</h2>
            <p className="text-white/50 text-sm mt-1">Select multiple languages to create at once</p>
          </div>
          <button
            onClick={onClose}
            disabled={isCreating}
            className="icon-button text-white/50 hover:text-white disabled:opacity-50"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingSpinner size="lg" className="text-primary-400" />
          </div>
        ) : isCreating ? (
          <div className="py-8">
            <div className="text-center mb-6">
              <LoadingSpinner size="lg" className="text-primary-400 mx-auto mb-4" />
              <p className="text-white font-medium">
                Creating {getLanguageName(creatingLanguage)}...
              </p>
              <p className="text-white/50 text-sm mt-1">
                {progress.current} of {progress.total} languages
              </p>
            </div>
            {/* Progress bar */}
            <div className="w-full bg-white/10 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-primary-500 to-accent-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(progress.current / progress.total) * 100}%` }}
              />
            </div>
          </div>
        ) : (
          <>
            {/* Search Input */}
            <div className="mb-4">
              <input
                type="text"
                placeholder="Search languages..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="glass-input"
              />
            </div>

            {/* Select All / Clear All */}
            <div className="flex items-center justify-between mb-3">
              <span className="text-white/50 text-sm">
                {selectedLanguages.size} selected
              </span>
              <div className="flex gap-2">
                <button
                  onClick={selectAll}
                  className="text-primary-400 text-sm hover:text-primary-300 transition-colors"
                >
                  Select All
                </button>
                <span className="text-white/30">|</span>
                <button
                  onClick={clearAll}
                  className="text-white/50 text-sm hover:text-white/70 transition-colors"
                >
                  Clear
                </button>
              </div>
            </div>

            {/* Language List with Checkboxes */}
            <div className="max-h-72 overflow-y-auto mb-6 space-y-2">
              {filteredLanguages.length === 0 ? (
                <p className="text-white/50 text-center py-4">No languages available</p>
              ) : (
                filteredLanguages.map((lang) => (
                  <label
                    key={lang.code}
                    className={`flex items-center gap-3 w-full px-4 py-3 rounded-xl cursor-pointer transition-all duration-200
                      ${
                        selectedLanguages.has(lang.code)
                          ? 'bg-primary-500/20 border-primary-500/50'
                          : 'bg-white/5 border-white/10 hover:bg-white/10'
                      } border`}
                  >
                    <input
                      type="checkbox"
                      checked={selectedLanguages.has(lang.code)}
                      onChange={() => toggleLanguage(lang.code)}
                      className="w-5 h-5 rounded border-white/30 bg-white/10 text-primary-500 
                                 focus:ring-primary-500 focus:ring-offset-0 focus:ring-2 cursor-pointer"
                    />
                    <span className="font-medium text-white">{lang.name}</span>
                    <span className="text-white/40">({lang.code})</span>
                  </label>
                ))
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                disabled={isCreating}
                className="flex-1 glass-button disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={selectedLanguages.size === 0 || isCreating}
                className="flex-1 glass-button-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <span>
                  Create {selectedLanguages.size > 0 ? `${selectedLanguages.size} ` : ''}
                  Language{selectedLanguages.size !== 1 ? 's' : ''}
                </span>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
