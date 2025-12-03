import { useState } from 'react';
import { LoadingSpinner } from './LoadingSpinner';

export function AddKeyModal({ isOpen, onClose, onAdd, isAdding }) {
  const [key, setKey] = useState('');
  const [value, setValue] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validate key format
    const keyRegex = /^[a-zA-Z0-9_.]+$/;
    if (!keyRegex.test(key)) {
      setError('Key must contain only alphanumeric characters, underscores, and dots');
      return;
    }

    if (!key.trim() || !value.trim()) {
      setError('Both key and value are required');
      return;
    }

    const success = await onAdd(key.trim(), value.trim());
    if (success) {
      setKey('');
      setValue('');
      onClose();
    }
  };

  const handleClose = () => {
    if (!isAdding) {
      setKey('');
      setValue('');
      setError('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-dark-950/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="glass-card w-full max-w-md p-6 m-4">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Add Translation Key</h2>
          <button
            onClick={handleClose}
            disabled={isAdding}
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

        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            {/* Key Input */}
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">Key Name</label>
              <input
                type="text"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="e.g., button.submit"
                className="glass-input font-mono"
                disabled={isAdding}
              />
              <p className="text-xs text-white/40 mt-1">
                Use alphanumeric characters, underscores, and dots
              </p>
            </div>

            {/* Value Input */}
            <div>
              <label className="block text-sm font-medium text-white/70 mb-2">English Value</label>
              <textarea
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder="Enter the English text..."
                className="glass-input min-h-[100px] resize-none"
                disabled={isAdding}
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg p-3">
                {error}
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={handleClose}
              disabled={isAdding}
              className="flex-1 glass-button disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!key.trim() || !value.trim() || isAdding}
              className="flex-1 glass-button-primary disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isAdding ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span>Adding...</span>
                </>
              ) : (
                <span>Add Key</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

