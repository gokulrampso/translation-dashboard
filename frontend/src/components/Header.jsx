import { LoadingSpinner } from './LoadingSpinner';

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

const getLanguageName = (code) => LANGUAGE_NAMES[code] || code.toUpperCase();

export function Header({
  languages,
  selectedLanguage,
  onLanguageChange,
  onNewLanguage,
  onRetranslateAll,
  onAddKey,
  onDeleteLanguage,
  isRetranslatingAll,
  isEnglish,
}) {
  return (
    <header className="glass-card mb-8 p-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        {/* Logo and Title */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center shadow-lg shadow-primary-500/25">
            <svg
              className="w-6 h-6 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
              />
            </svg>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gradient">Translation Manager</h1>
            <p className="text-white/50 text-sm">Manage multilingual content with ease</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Language Selector */}
          <div className="relative">
            <select
              value={selectedLanguage}
              onChange={(e) => onLanguageChange(e.target.value)}
              className="glass-input pr-10 min-w-[200px] appearance-none cursor-pointer"
            >
              {/* English always first with different background */}
              {languages.includes('en') && (
                <option 
                  key="en" 
                  value="en" 
                  className="bg-primary-900 text-white font-semibold"
                  style={{ backgroundColor: '#0c4a6e', color: '#38bdf8' }}
                >
                  ★ {getLanguageName('en')} (EN) - Base
                </option>
              )}
              {/* Separator */}
              {languages.includes('en') && languages.length > 1 && (
                <option disabled className="bg-dark-900 text-white/30" style={{ backgroundColor: '#1e293b' }}>
                  ─────────────────
                </option>
              )}
              {/* Other languages sorted alphabetically */}
              {languages
                .filter((lang) => lang !== 'en')
                .sort((a, b) => getLanguageName(a).localeCompare(getLanguageName(b)))
                .map((lang) => (
                  <option key={lang} value={lang} className="bg-dark-800 text-white">
                    {getLanguageName(lang)} ({lang.toUpperCase()})
                  </option>
                ))}
            </select>
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
              <svg
                className="w-5 h-5 text-white/50"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </div>

          {/* Add Key Button - English only */}
          {isEnglish && (
            <button onClick={onAddKey} className="glass-button-primary flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              <span>Add Key</span>
            </button>
          )}

          {/* New Language Button - English only */}
          {isEnglish && (
            <button onClick={onNewLanguage} className="glass-button flex items-center gap-2">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              <span>New Language</span>
            </button>
          )}

          {/* Re-translate All Button - Non-English only */}
          {!isEnglish && (
            <button
              onClick={onRetranslateAll}
              disabled={isRetranslatingAll}
              className="glass-button flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isRetranslatingAll ? (
                <LoadingSpinner size="sm" />
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
              )}
              <span>Re-translate All</span>
            </button>
          )}

          {/* Delete Language Button - Non-English only */}
          {!isEnglish && (
            <button
              onClick={onDeleteLanguage}
              className="glass-button flex items-center gap-2 hover:bg-red-500/20 hover:border-red-500/30 hover:text-red-400"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
              <span>Delete Language</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}

