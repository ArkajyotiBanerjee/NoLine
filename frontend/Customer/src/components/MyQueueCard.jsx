import React from 'react';
import { useNavigate } from 'react-router-dom';
import { UserIcon, UserGroupIcon } from '@heroicons/react/24/outline';

// ── Load indicator ─────────────────────────────────────────────────────────────
const getLoadInfo = (peopleAhead) => {
  if (peopleAhead < 5)   return { label: 'Low',      color: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300' };
  if (peopleAhead <= 10) return { label: 'Moderate', color: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300' };
  return                          { label: 'Busy',     color: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300' };
};

// ── Status badge ──────────────────────────────────────────────────────────────
const getStatusInfo = (status) => {
  switch (status) {
    case 'approaching':  return { label: '🚶 Approaching', color: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300' };
    case 'ready':        return { label: '🔔 Ready!',      color: 'bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300' };
    case 'on-hold':      return { label: '⏸ On Hold',      color: 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300' };
    case 'checked-in':   return { label: '✅ Checked In',  color: 'bg-teal-100 dark:bg-teal-900/40 text-teal-700 dark:text-teal-300' };
    case 'completed':    return { label: '✓ Completed',    color: 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400' };
    default:             return { label: '⏳ Waiting',     color: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300' };
  }
};

const MyQueueCard = ({ queue, onLeave }) => {
  const navigate   = useNavigate();
  const isGroup    = queue.groupSize && queue.groupSize > 1;
  const load       = getLoadInfo(queue.peopleAhead);
  const statusInfo = getStatusInfo(queue.status);
  const isCompleted = queue.status === 'completed';

  return (
    <div
      className={`bg-white dark:bg-gray-800 rounded-2xl shadow-md overflow-hidden flex flex-col hover:shadow-lg transition-shadow duration-200 border dark:border-gray-700 cursor-pointer ${
        isCompleted ? 'border-gray-200 opacity-70' : 'border-gray-100'
      }`}
      onClick={() => navigate(`/my-queues/${queue.id}`)}
    >
      {/* ── Accent top strip (coloured by status) ── */}
      <div className={`h-1 w-full ${
        isCompleted            ? 'bg-gray-300 dark:bg-gray-600' :
        queue.status === 'ready' ? 'bg-green-400' :
        queue.status === 'on-hold' ? 'bg-orange-400' :
        'bg-blue-500'
      }`} />

      <div className="p-4 flex flex-col gap-3">
        {/* ── Header ── */}
        <div className="flex justify-between items-start">
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-base text-gray-800 dark:text-gray-100 truncate">{queue.name}</h3>
            {queue.queueTitle ? (
              <span className="inline-block mt-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 leading-tight">
                {queue.queueTitle}
              </span>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{queue.category}</p>
            )}
          </div>
          <div className="flex flex-col items-end gap-1 ml-2 flex-shrink-0">
            {/* Status badge */}
            <span className={`text-xs font-semibold px-2 py-1 rounded-md ${statusInfo.color}`}>
              {statusInfo.label}
            </span>
            {/* Group badge */}
            <span className={`flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${
              isGroup
                ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
            }`}>
              {isGroup
                ? <><UserGroupIcon className="w-3 h-3" /> Group of {queue.groupSize}</>
                : <><UserIcon className="w-3 h-3" /> Individual</>
              }
            </span>
          </div>
        </div>

        {/* ── Big position number ── */}
        {!isCompleted ? (
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-0.5">Your Position</p>
              <p className="text-5xl font-black text-blue-600 dark:text-blue-400 leading-none">
                #{queue.position}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-gray-400 dark:text-gray-500 mb-0.5">People Ahead</p>
              <p className="text-2xl font-bold text-gray-700 dark:text-gray-200">{queue.peopleAhead}</p>
            </div>
          </div>
        ) : (
          <div className="py-2 text-center">
            <p className="text-2xl mb-1">✅</p>
            <p className="text-sm font-semibold text-gray-500 dark:text-gray-400">Service completed</p>
          </div>
        )}

        {/* ── Token + Load row ── */}
        <div className="flex items-center justify-between border-t border-gray-100 dark:border-gray-700 pt-2.5">
          {queue.token ? (
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-gray-400 dark:text-gray-500">Token</span>
              <span className="font-mono font-bold text-sm text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded-md">
                #{queue.token}
              </span>
            </div>
          ) : <div />}
          <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${load.color}`}>
            {load.label}
          </span>
        </div>

        {/* ── Actions ── */}
        <div className="flex gap-2.5" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => navigate(`/my-queues/${queue.id}`)}
            className="flex-1 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-sm font-semibold px-4 py-2 rounded-xl transition-colors duration-200 border border-blue-100 dark:border-blue-900"
          >
            View Details
          </button>
          {!isCompleted && (
            <button
              onClick={() => onLeave(queue.id)}
              className="flex-1 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold px-4 py-2 rounded-xl transition-colors duration-200"
            >
              Leave
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyQueueCard;
