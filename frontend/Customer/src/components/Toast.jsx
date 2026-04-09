import React, { useEffect, useState } from 'react';
import { CheckCircleIcon, XCircleIcon, InformationCircleIcon, XMarkIcon } from '@heroicons/react/24/outline';

const icons = {
  success: <CheckCircleIcon className="w-5 h-5 text-green-500" />,
  error: <XCircleIcon className="w-5 h-5 text-red-500" />,
  info: <InformationCircleIcon className="w-5 h-5 text-blue-500" />,
};

const bg = {
  success: 'bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800',
  error: 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800',
  info: 'bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800',
};

const textColor = {
  success: 'text-green-800 dark:text-green-300',
  error: 'text-red-800 dark:text-red-300',
  info: 'text-blue-800 dark:text-blue-300',
};

const Toast = ({ message, type = 'success', onDismiss }) => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => {
      setVisible(false);
      if (onDismiss) onDismiss();
    }, 3000);
    return () => clearTimeout(t);
  }, [onDismiss]);

  if (!visible || !message) return null;

  return (
    <div
      className={`flex items-center gap-3 px-4 py-3 rounded-xl border shadow-md mb-4 transition-all duration-300 ${bg[type]}`}
    >
      {icons[type]}
      <p className={`text-sm font-medium flex-1 ${textColor[type]}`}>{message}</p>
      <button
        onClick={() => { setVisible(false); if (onDismiss) onDismiss(); }}
        className="opacity-50 hover:opacity-100 transition-opacity"
      >
        <XMarkIcon className="w-4 h-4 text-gray-500 dark:text-gray-400" />
      </button>
    </div>
  );
};

export default Toast;
