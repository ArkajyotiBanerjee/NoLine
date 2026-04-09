import React, { useState, useEffect } from 'react';
import { BellSlashIcon, BellIcon } from '@heroicons/react/24/outline';
import { formatTime } from '../utils/notifications';

// Map notification keywords to emoji icons
const getNotifIcon = (message) => {
  const m = message.toLowerCase();
  if (m.includes('token') || m.includes('joined'))  return '🎫';
  if (m.includes('left') || m.includes('leave'))    return '👋';
  if (m.includes('arrival') || m.includes('arrived')) return '📍';
  if (m.includes('profile'))                         return '👤';
  if (m.includes('hold'))                            return '⏸';
  if (m.includes('complete'))                        return '✅';
  if (m.includes('status'))                          return '🔔';
  return '📢';
};

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    const data = localStorage.getItem('notifications');
    if (data) setNotifications(JSON.parse(data));
  }, []);

  const clearAll = () => {
    localStorage.removeItem('notifications');
    setNotifications([]);
    window.dispatchEvent(new Event('notificationsUpdated'));
  };

  return (
    <div className="p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BellIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
          <h1 className="text-xl font-bold text-gray-800 dark:text-white">Notifications</h1>
          {notifications.length > 0 && (
            <span className="bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs font-bold px-2 py-0.5 rounded-full">
              {notifications.length}
            </span>
          )}
        </div>
        {notifications.length > 0 && (
          <button
            onClick={clearAll}
            className="text-sm text-red-500 dark:text-red-400 font-medium hover:underline"
          >
            Clear all
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 py-16 text-center">
          <BellSlashIcon className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <p className="font-semibold text-gray-600 dark:text-gray-400">No notifications yet</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            Join or leave a queue to see updates here.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {notifications.map((notif) => (
            <div
              key={notif.id}
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 px-4 py-3.5 flex items-start gap-3 hover:shadow-md transition-shadow duration-200"
            >
              {/* Type icon */}
              <span className="text-lg flex-shrink-0 mt-0.5">{getNotifIcon(notif.message)}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-gray-800 dark:text-gray-100 font-medium leading-snug">{notif.message}</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{formatTime(notif.timestamp)}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Notifications;
