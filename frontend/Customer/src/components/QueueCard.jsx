import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import JoinQueueModal from './JoinQueueModal';
import Toast from './Toast';
import { PhoneIcon, ClockIcon, UsersIcon } from '@heroicons/react/24/outline';

// ── Load indicator helper ─────────────────────────────────────────────────────
const getLoad = (size) => {
  if (size < 5)  return { label: 'Low',      dot: 'bg-green-400',  text: 'text-green-600 dark:text-green-400' };
  if (size <= 10) return { label: 'Moderate', dot: 'bg-amber-400',  text: 'text-amber-600 dark:text-amber-400' };
  return           { label: 'Busy',     dot: 'bg-red-500',   text: 'text-red-600 dark:text-red-400' };
};

const QueueCard = ({ queue }) => {
  const navigate = useNavigate();
  const estWait = queue.currentSize * queue.avgTimePerPerson;
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState(null);
  const load = getLoad(queue.currentSize);

  const handleJoinClick = (e) => {
    e.stopPropagation();
    setShowModal(true);
  };

  return (
    <>
      {showModal && (
        <JoinQueueModal
          queue={queue}
          onClose={() => setShowModal(false)}
          onJoined={(msg, type) => {
            setShowModal(false);
            setToast({ message: msg, type });
          }}
        />
      )}

      {toast && (
        <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />
      )}

      <div
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-4 flex flex-col gap-3 hover:shadow-lg transition-all duration-200 border border-gray-100 dark:border-gray-700 cursor-pointer"
        onClick={() => navigate(`/queue/${queue.id}`)}
      >
        {/* ── Header row ── */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-base text-gray-800 dark:text-gray-100 leading-tight">{queue.name}</h3>
            {/* Queue title tag */}
            {queue.queueTitle && (
              <span className="inline-block mt-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 leading-tight">
                {queue.queueTitle}
              </span>
            )}
            {/* Phone */}
            {queue.phone && (
              <div className="flex items-center gap-1.5 mt-1.5 text-gray-400 dark:text-gray-500">
                <PhoneIcon className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="text-xs">{queue.phone}</span>
              </div>
            )}
          </div>
          {/* Open / Closed badge */}
          <span className={`flex-shrink-0 text-xs font-bold px-2.5 py-1 rounded-full ${
            queue.isOpen
              ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300'
              : 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400'
          }`}>
            {queue.isOpen ? 'Open' : 'Closed'}
          </span>
        </div>

        {/* ── Stats row ── */}
        <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
          <div className="flex items-center gap-1.5">
            <UsersIcon className="w-4 h-4" />
            <span><span className="font-semibold text-gray-700 dark:text-gray-300">{queue.currentSize}</span> people</span>
          </div>
          <div className="flex items-center gap-1.5">
            <ClockIcon className="w-4 h-4" />
            <span>
              {estWait > 0
                ? <><span className="font-semibold text-gray-700 dark:text-gray-300">{estWait}</span> min wait</>
                : <span className="text-green-600 dark:text-green-400 font-semibold">No wait 🎉</span>
              }
            </span>
          </div>
        </div>

        {/* ── Hours + Load ── */}
        <div className="flex items-center justify-between">
          {queue.openingHours && (
            <span className="text-xs text-gray-400 dark:text-gray-500">{queue.openingHours}</span>
          )}
          {/* Load indicator */}
          <div className="flex items-center gap-1.5 ml-auto">
            <span className={`w-2 h-2 rounded-full ${load.dot}`} />
            <span className={`text-xs font-semibold ${load.text}`}>{load.label}</span>
          </div>
        </div>

        {/* ── Action buttons ── */}
        <div className="grid grid-cols-2 gap-2.5 pt-1" onClick={(e) => e.stopPropagation()}>
          <button
            id={`join-queue-btn-${queue.id}`}
            onClick={handleJoinClick}
            disabled={!queue.isOpen}
            className={`font-semibold px-4 py-2.5 rounded-xl text-sm transition-all duration-200 ${
              queue.isOpen
                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
            }`}
          >
            {queue.isOpen ? 'Join Queue' : 'Closed'}
          </button>
          <a
            href={queue.mapLink}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 text-sm font-semibold px-4 py-2.5 rounded-xl transition-colors duration-200 text-center"
          >
            View Map
          </a>
        </div>
      </div>
    </>
  );
};

export default QueueCard;
