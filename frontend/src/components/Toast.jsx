// Re-export from react-hot-toast for consistency
export { toast, Toaster } from 'react-hot-toast';

// Custom toast configuration
export const toastConfig = {
  duration: 3000,
  position: 'top-right',
  style: {
    background: '#1e293b',
    color: '#fff',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    borderRadius: '12px',
  },
  success: {
    iconTheme: {
      primary: '#22c55e',
      secondary: '#fff',
    },
  },
  error: {
    iconTheme: {
      primary: '#ef4444',
      secondary: '#fff',
    },
  },
};

