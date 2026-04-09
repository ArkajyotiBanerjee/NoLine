import React, { useState, useEffect } from 'react';
import MyQueueCard from '../components/MyQueueCard';
import Toast from '../components/Toast';
import { addNotification } from '../utils/notifications';
import { queues as mockQueues } from '../data/mockData';

const MyQueues = ({ viewMode }) => {
  const [activeQueues, setActiveQueues] = useState([]);
  const [toast, setToast] = useState(null);
  const isDesktop = viewMode === 'desktop';

  useEffect(() => {
    const data = localStorage.getItem('joinedQueues');
    if (data) {
      // Enrich stored entries with queueTitle from mockData (handles old entries without it)
      const stored = JSON.parse(data);
      const enriched = stored.map((q) => {
        if (q.queueTitle) return q;
        const source = mockQueues.find((m) => m.id === q.id);
        return source ? { ...q, queueTitle: source.queueTitle } : q;
      });
      setActiveQueues(enriched);
    }
  }, []);

  const handleLeave = (id) => {
    const leaving = activeQueues.find((q) => q.id === id);
    const updated = activeQueues.filter((q) => q.id !== id);
    setActiveQueues(updated);
    localStorage.setItem('joinedQueues', JSON.stringify(updated));
    if (leaving) addNotification(`You left the queue at ${leaving.name}`);
    setToast({ message: 'Queue left successfully', type: 'info' });
  };

  return (
    <div className="p-4">
      {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}

      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold text-gray-800 dark:text-white">My Active Queues</h1>
        {activeQueues.length > 0 && (
          <span className="bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs font-semibold px-2.5 py-1 rounded-full">
            {activeQueues.length} active
          </span>
        )}
      </div>

      {activeQueues.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 py-16 text-center">
          <p className="text-4xl mb-3">🎫</p>
          <p className="font-semibold text-gray-700 dark:text-gray-300">No active queues</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            Join a queue from the home page to see it here.
          </p>
        </div>
      ) : (
        <div className={`grid gap-4 ${isDesktop ? 'grid-cols-3' : 'grid-cols-1'}`}>
          {activeQueues.map((queue) => (
            <MyQueueCard key={queue.id} queue={queue} onLeave={handleLeave} />
          ))}
        </div>
      )}
    </div>
  );
};

export default MyQueues;
