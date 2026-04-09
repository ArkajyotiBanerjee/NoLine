// Helper to add a notification to localStorage
export const addNotification = (message) => {
  const existing = JSON.parse(localStorage.getItem('notifications') || '[]');
  const entry = {
    id: Date.now(),
    message,
    timestamp: Date.now(),
  };
  localStorage.setItem('notifications', JSON.stringify([entry, ...existing]));
  // Dispatch custom event so Navbar badge updates instantly
  window.dispatchEvent(new Event('notificationsUpdated'));
};

// Format timestamp to a readable string
export const formatTime = (timestamp) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  return date.toLocaleDateString();
};
