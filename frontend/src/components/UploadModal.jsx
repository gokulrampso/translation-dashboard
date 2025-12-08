import { useState, useRef } from 'react';
import { LoadingSpinner } from './LoadingSpinner';

export function UploadModal({ isOpen, onClose, onUpload, isUploading }) {
  const [file, setFile] = useState(null);
  const [jsonContent, setJsonContent] = useState(null);
  const [overwrite, setOverwrite] = useState(false);
  const [error, setError] = useState(null);
  const [preview, setPreview] = useState(null);
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    setError(null);
    setPreview(null);
    setJsonContent(null);

    if (!selectedFile) {
      setFile(null);
      return;
    }

    if (!selectedFile.name.endsWith('.json')) {
      setError('Please select a JSON file');
      setFile(null);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = JSON.parse(event.target.result);

        // Validate it's a flat key-value object
        if (typeof content !== 'object' || Array.isArray(content)) {
          setError('JSON must be a flat object with key-value pairs');
          setFile(null);
          return;
        }

        // Check all values are strings
        const invalidKeys = Object.entries(content)
          .filter(([, value]) => typeof value !== 'string')
          .map(([key]) => key);

        if (invalidKeys.length > 0) {
          setError(
            `Invalid values for keys: ${invalidKeys.slice(0, 3).join(', ')}${invalidKeys.length > 3 ? '...' : ''}. All values must be strings.`
          );
          setFile(null);
          return;
        }

        setFile(selectedFile);
        setJsonContent(content);

        // Create preview
        const keys = Object.keys(content);
        setPreview({
          totalKeys: keys.length,
          sampleKeys: keys.slice(0, 5),
          hasMore: keys.length > 5,
        });
      } catch {
        setError('Invalid JSON file');
        setFile(null);
      }
    };

    reader.readAsText(selectedFile);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!jsonContent) {
      setError('Please select a valid JSON file');
      return;
    }

    const success = await onUpload(jsonContent, overwrite);
    if (success) {
      handleClose();
    }
  };

  const handleClose = () => {
    setFile(null);
    setJsonContent(null);
    setPreview(null);
    setError(null);
    setOverwrite(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();

    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile) {
      // Trigger the same logic as file input change
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(droppedFile);
      if (fileInputRef.current) {
        fileInputRef.current.files = dataTransfer.files;
        handleFileChange({ target: fileInputRef.current });
      }
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-dark-900/80 backdrop-blur-sm"
        onClick={!isUploading ? handleClose : undefined}
      />

      {/* Modal */}
      <div className="relative glass-card p-6 w-full max-w-lg mx-4 animate-modal-enter">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-white">Upload English JSON</h2>
          <button
            onClick={handleClose}
            disabled={isUploading}
            className="text-white/50 hover:text-white transition-colors disabled:opacity-50"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Drop zone */}
          <div
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`
              border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
              ${file ? 'border-primary-500 bg-primary-500/10' : 'border-white/20 hover:border-white/40 hover:bg-white/5'}
              ${error ? 'border-red-500/50 bg-red-500/10' : ''}
            `}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleFileChange}
              className="hidden"
              disabled={isUploading}
            />

            {file ? (
              <div className="space-y-2">
                <div className="w-12 h-12 mx-auto rounded-xl bg-primary-500/20 flex items-center justify-center">
                  <svg className="w-6 h-6 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <p className="text-white font-medium">{file.name}</p>
                <p className="text-white/50 text-sm">Click or drop another file to replace</p>
              </div>
            ) : (
              <div className="space-y-2">
                <div className="w-12 h-12 mx-auto rounded-xl bg-white/10 flex items-center justify-center">
                  <svg className="w-6 h-6 text-white/50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                </div>
                <p className="text-white font-medium">Drop your JSON file here</p>
                <p className="text-white/50 text-sm">or click to browse</p>
              </div>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="mt-4 p-3 bg-red-500/20 border border-red-500/30 rounded-lg">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          {/* Preview */}
          {preview && (
            <div className="mt-4 p-4 bg-white/5 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <svg className="w-5 h-5 text-accent-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                </svg>
                <span className="text-white font-medium">{preview.totalKeys} translation keys</span>
              </div>
              <div className="space-y-1">
                {preview.sampleKeys.map((key) => (
                  <div key={key} className="text-white/70 text-sm font-mono truncate">
                    {key}
                  </div>
                ))}
                {preview.hasMore && (
                  <div className="text-white/50 text-sm">...and {preview.totalKeys - 5} more</div>
                )}
              </div>
            </div>
          )}

          {/* Options */}
          {file && (
            <div className="mt-4">
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={overwrite}
                    onChange={(e) => setOverwrite(e.target.checked)}
                    className="sr-only"
                    disabled={isUploading}
                  />
                  <div
                    className={`w-5 h-5 rounded border-2 transition-colors ${
                      overwrite
                        ? 'bg-primary-500 border-primary-500'
                        : 'border-white/30 group-hover:border-white/50'
                    }`}
                  >
                    {overwrite && (
                      <svg className="w-full h-full text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </div>
                </div>
                <span className="text-white/70 text-sm">Overwrite existing keys with new values</span>
              </label>
              <p className="mt-1 ml-8 text-white/40 text-xs">
                {overwrite
                  ? 'Existing keys will be updated with new values and re-translated'
                  : 'Existing keys will be skipped, only new keys will be added'}
              </p>
            </div>
          )}

          {/* Info */}
          <div className="mt-4 p-3 bg-white/5 rounded-lg">
            <p className="text-white/60 text-sm">
              <strong className="text-white/80">Format:</strong> JSON file with flat key-value pairs.
            </p>
            <pre className="mt-2 text-xs text-white/50 overflow-x-auto">
              {`{
  "welcome": "Welcome to our app",
  "logout": "Log out",
  "settings.title": "Settings"
}`}
            </pre>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-6">
            <button
              type="button"
              onClick={handleClose}
              disabled={isUploading}
              className="flex-1 glass-button disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!file || isUploading}
              className="flex-1 glass-button-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? (
                <>
                  <LoadingSpinner size="sm" />
                  <span>Uploading...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                  </svg>
                  <span>Upload & Translate</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


