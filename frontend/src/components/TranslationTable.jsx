import { useState, useCallback, useRef } from 'react';
import { LoadingSpinner } from './LoadingSpinner';

function TranslationRow({
  translationKey,
  value,
  englishValue,
  isEnglish,
  onSave,
  onRetranslate,
  onRemoveKey,
  isSaving,
  isRetranslating,
  isRemoving,
  isDraggable,
  onDragStart,
  onDragOver,
  onDragEnd,
  onDrop,
  isDragging,
  isDropTarget,
}) {
  const [editedValue, setEditedValue] = useState(value);
  const [hasChanges, setHasChanges] = useState(false);

  const handleChange = (e) => {
    setEditedValue(e.target.value);
    setHasChanges(e.target.value !== value);
  };

  const handleSave = async () => {
    if (hasChanges) {
      const success = await onSave(translationKey, editedValue);
      if (success) {
        setHasChanges(false);
      }
    }
  };

  const handleRetranslate = async () => {
    const success = await onRetranslate(translationKey);
    if (success) {
      setHasChanges(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSave();
    }
  };

  // Update local state when prop value changes
  if (value !== editedValue && !hasChanges) {
    setEditedValue(value);
  }

  const isProcessing = isSaving || isRetranslating || isRemoving;

  return (
    <tr
      className={`border-b border-white/5 transition-all duration-200
        ${isDragging ? 'opacity-50 bg-primary-500/10' : 'hover:bg-white/5'}
        ${isDropTarget ? 'bg-primary-500/20 border-primary-500/50' : ''}`}
      draggable={isDraggable}
      onDragStart={(e) => onDragStart?.(e, translationKey)}
      onDragOver={(e) => onDragOver?.(e, translationKey)}
      onDragEnd={onDragEnd}
      onDrop={(e) => onDrop?.(e, translationKey)}
    >
      {/* Drag Handle (English only) */}
      {isDraggable && (
        <td className="px-2 py-3 w-10 cursor-grab active:cursor-grabbing">
          <div className="flex items-center justify-center text-white/30 hover:text-white/60">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 8h16M4 16h16"
              />
            </svg>
          </div>
        </td>
      )}

      {/* Key */}
      <td className="px-4 py-3">
        <code className="text-primary-400 text-sm font-mono bg-primary-500/10 px-2 py-1 rounded">
          {translationKey}
        </code>
      </td>

      {/* English Reference (for non-English) */}
      {!isEnglish && (
        <td className="px-4 py-3">
          <span className="text-white/50 text-sm">{englishValue}</span>
        </td>
      )}

      {/* Editable Value */}
      <td className="px-4 py-3">
        <input
          type="text"
          value={editedValue}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          disabled={isProcessing}
          className={`w-full px-3 py-2 bg-white/5 border rounded-lg transition-all duration-200
            ${hasChanges ? 'border-accent-500/50 ring-2 ring-accent-500/20' : 'border-white/10'}
            ${isProcessing ? 'opacity-50' : ''}
            focus:outline-none focus:border-primary-500/50 focus:ring-2 focus:ring-primary-500/20`}
        />
      </td>

      {/* Actions */}
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={!hasChanges || isProcessing}
            className={`icon-button ${hasChanges ? 'text-green-400 hover:bg-green-400/20' : 'text-white/30'} disabled:opacity-30 disabled:cursor-not-allowed`}
            title="Save changes"
          >
            {isSaving ? (
              <LoadingSpinner size="sm" />
            ) : (
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            )}
          </button>

          {/* Re-translate Button (non-English only) */}
          {!isEnglish && (
            <button
              onClick={handleRetranslate}
              disabled={isProcessing}
              className="icon-button text-blue-400 hover:bg-blue-400/20 disabled:opacity-30 disabled:cursor-not-allowed"
              title="Re-translate from English"
            >
              {isRetranslating ? (
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
            </button>
          )}

          {/* Delete Key Button (English only) */}
          {isEnglish && (
            <button
              onClick={() => onRemoveKey(translationKey)}
              disabled={isProcessing}
              className="icon-button text-red-400 hover:bg-red-400/20 disabled:opacity-30 disabled:cursor-not-allowed"
              title="Delete key from all languages"
            >
              {isRemoving ? (
                <LoadingSpinner size="sm" />
              ) : (
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                  />
                </svg>
              )}
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

export function TranslationTable({
  translations,
  englishTranslations,
  selectedLanguage,
  keyOrder,
  onSave,
  onRetranslate,
  onRemoveKey,
  onReorderKeys,
  savingKeys,
  retranslatingKeys,
  removingKeys,
}) {
  const isEnglish = selectedLanguage === 'en';
  const [draggedKey, setDraggedKey] = useState(null);
  const [dropTargetKey, setDropTargetKey] = useState(null);
  
  // Use keyOrder if provided, otherwise sort alphabetically
  const orderedKeys = keyOrder && keyOrder.length > 0
    ? keyOrder.filter((key) => translations[key] !== undefined)
    : Object.keys(translations).sort();

  // Add any keys that are in translations but not in keyOrder
  const translationKeys = Object.keys(translations);
  const missingKeys = translationKeys.filter((key) => !orderedKeys.includes(key));
  const allKeys = [...orderedKeys, ...missingKeys];

  // Drag and Drop handlers
  const handleDragStart = useCallback((e, key) => {
    setDraggedKey(key);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', key);
  }, []);

  const handleDragOver = useCallback((e, key) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (key !== draggedKey) {
      setDropTargetKey(key);
    }
  }, [draggedKey]);

  const handleDragEnd = useCallback(() => {
    setDraggedKey(null);
    setDropTargetKey(null);
  }, []);

  const handleDrop = useCallback((e, targetKey) => {
    e.preventDefault();
    
    if (!draggedKey || draggedKey === targetKey) {
      handleDragEnd();
      return;
    }

    // Calculate new order
    const newOrder = [...allKeys];
    const draggedIndex = newOrder.indexOf(draggedKey);
    const targetIndex = newOrder.indexOf(targetKey);

    // Remove dragged item and insert at target position
    newOrder.splice(draggedIndex, 1);
    newOrder.splice(targetIndex, 0, draggedKey);

    // Call the reorder function
    if (onReorderKeys) {
      onReorderKeys(newOrder);
    }

    handleDragEnd();
  }, [draggedKey, allKeys, onReorderKeys, handleDragEnd]);

  if (allKeys.length === 0) {
    return (
      <div className="glass-card p-12 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/5 flex items-center justify-center">
          <svg
            className="w-8 h-8 text-white/30"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-white/70 mb-2">No translations yet</h3>
        <p className="text-white/40">
          {isEnglish
            ? 'Click "Add Key" to add your first translation key.'
            : 'Add translation keys in English first.'}
        </p>
      </div>
    );
  }

  return (
    <div className="glass-card overflow-hidden">
      {/* Drag hint for English */}
      {isEnglish && (
        <div className="px-4 py-2 bg-primary-500/10 border-b border-primary-500/20 text-primary-300 text-sm flex items-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <span>Drag rows to reorder keys. Order is saved for all languages.</span>
        </div>
      )}
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10 bg-white/5">
              {isEnglish && (
                <th className="px-2 py-3 w-10"></th>
              )}
              <th className="px-4 py-3 text-left text-xs font-semibold text-white/50 uppercase tracking-wider">
                Key
              </th>
              {!isEnglish && (
                <th className="px-4 py-3 text-left text-xs font-semibold text-white/50 uppercase tracking-wider">
                  English
                </th>
              )}
              <th className="px-4 py-3 text-left text-xs font-semibold text-white/50 uppercase tracking-wider">
                {isEnglish ? 'Value' : `Translation (${selectedLanguage.toUpperCase()})`}
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-white/50 uppercase tracking-wider w-32">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {allKeys.map((key) => (
              <TranslationRow
                key={key}
                translationKey={key}
                value={translations[key]}
                englishValue={englishTranslations[key]}
                isEnglish={isEnglish}
                onSave={onSave}
                onRetranslate={onRetranslate}
                onRemoveKey={onRemoveKey}
                isSaving={savingKeys.has(key)}
                isRetranslating={retranslatingKeys.has(key)}
                isRemoving={removingKeys.has(key)}
                isDraggable={isEnglish}
                onDragStart={isEnglish ? handleDragStart : undefined}
                onDragOver={isEnglish ? handleDragOver : undefined}
                onDragEnd={isEnglish ? handleDragEnd : undefined}
                onDrop={isEnglish ? handleDrop : undefined}
                isDragging={draggedKey === key}
                isDropTarget={dropTargetKey === key}
              />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
