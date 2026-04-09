import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { addNotification } from '../utils/notifications';
import { XMarkIcon, UserIcon, UserGroupIcon, MinusIcon, PlusIcon } from '@heroicons/react/24/outline';
import CaptchaModal from './CaptchaModal';

/**
 * JoinQueueModal
 * Props:
 *  queue      – the queue object from mockData
 *  onClose    – called to dismiss modal (no join)
 *  onJoined   – optional callback after successful join (message, type)
 *
 * Flow:
 *  Step 1 → choose Individual / Group
 *  Step 2 → confirm size
 *  Step 3 → CAPTCHA (CaptchaModal)
 *  ✅       → save to localStorage + navigate
 */
const JoinQueueModal = ({ queue, onClose, onJoined }) => {
  const navigate = useNavigate();
  const [mode, setMode] = useState(null);        // null | 'individual' | 'group'
  const [groupSize, setGroupSize] = useState(2);
  const [alreadyIn, setAlreadyIn] = useState(false);
  const [showCaptcha, setShowCaptcha] = useState(false);

  // Lock scroll while modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  const checkAlready = () => {
    const existing = JSON.parse(localStorage.getItem('joinedQueues') || '[]');
    return existing.some((q) => q.id === queue.id);
  };

  const handleIndividual = () => {
    if (checkAlready()) { setAlreadyIn(true); return; }
    setMode('individual');
  };

  const handleGroupSelect = () => {
    if (checkAlready()) { setAlreadyIn(true); return; }
    setMode('group');
  };

  // Called when user clicks "Confirm & Join" — show CAPTCHA first
  const handleConfirmClick = () => {
    const existing = JSON.parse(localStorage.getItem('joinedQueues') || '[]');
    if (existing.some((q) => q.id === queue.id)) {
      setAlreadyIn(true);
      return;
    }
    setShowCaptcha(true);
  };

  // Called only after CAPTCHA is solved correctly
  const finalizeJoin = () => {
    setShowCaptcha(false);

    const existing = JSON.parse(localStorage.getItem('joinedQueues') || '[]');
    const size = mode === 'group' ? groupSize : 1;

    // Token: zero-padded position number (e.g. "013")
    const token = String(queue.currentSize + 1).padStart(3, '0');

    const newEntry = {
      id: queue.id,
      name: queue.name,
      queueTitle: queue.queueTitle || null,
      category: queue.category,
      location: queue.location,
      position: queue.currentSize + 1,
      peopleAhead: queue.currentSize,
      avgTimePerPerson: queue.avgTimePerPerson,
      groupSize: size,
      joinedAt: Date.now(),
      token,
      pin: null,
      status: 'waiting',
      holdEndTime: null,
    };

    localStorage.setItem('joinedQueues', JSON.stringify([...existing, newEntry]));

    // Notification with token
    addNotification(`Token ${token} assigned for ${queue.name}`);

    if (onJoined) onJoined(`Joined! Token #${token} assigned 🎫`, 'success');
    navigate('/my-queues');
  };

  // Overlay click closes modal (unless CAPTCHA is open — it manages its own overlay)
  const handleOverlay = (e) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <>
      {/* CAPTCHA sits above this modal (z-[60]) */}
      {showCaptcha && (
        <CaptchaModal
          queueName={queue.name}
          onVerified={finalizeJoin}
          onClose={() => setShowCaptcha(false)}
        />
      )}

      <div
        className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm"
        onClick={handleOverlay}
      >
        <div className="bg-white dark:bg-gray-800 w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl shadow-2xl p-6 flex flex-col gap-5 animate-slide-up">

          {/* Header */}
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-gray-800 dark:text-white">Join Queue</h2>
            <button
              onClick={onClose}
              className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            >
              <XMarkIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
            </button>
          </div>

          {/* Queue Info */}
          <div className="bg-blue-50 dark:bg-blue-900/30 rounded-xl px-4 py-3">
            <p className="font-semibold text-blue-700 dark:text-blue-300 text-sm">{queue.name}</p>
            {queue.queueTitle && (
              <span className="inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-800/50 text-blue-600 dark:text-blue-300 leading-tight">
                {queue.queueTitle}
              </span>
            )}
            <p className="text-xs text-blue-500 dark:text-blue-400 mt-1">{queue.category} · {queue.location}</p>
            <p className="text-xs text-blue-400 dark:text-blue-500 mt-1">
              Your token will be: <span className="font-mono font-bold">#{String(queue.currentSize + 1).padStart(3, '0')}</span>
            </p>
          </div>

          {/* Already-in warning */}
          {alreadyIn && (
            <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3 text-sm text-red-600 dark:text-red-400 font-medium">
              You are already in this queue.
            </div>
          )}

          {/* Step 1 – choose mode */}
          {mode === null && !alreadyIn && (
            <div className="flex flex-col gap-3">
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center">How are you joining?</p>

              <button
                id="join-individual-btn"
                onClick={handleIndividual}
                className="flex items-center gap-3 w-full bg-gray-50 dark:bg-gray-700 hover:bg-blue-50 dark:hover:bg-blue-900/30 border border-gray-200 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 rounded-xl px-4 py-3.5 transition-all duration-200"
              >
                <UserIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <span className="font-semibold text-gray-800 dark:text-gray-100">Continue as Individual</span>
              </button>

              <button
                id="join-group-btn"
                onClick={handleGroupSelect}
                className="flex items-center gap-3 w-full bg-gray-50 dark:bg-gray-700 hover:bg-blue-50 dark:hover:bg-blue-900/30 border border-gray-200 dark:border-gray-600 hover:border-blue-400 dark:hover:border-blue-500 rounded-xl px-4 py-3.5 transition-all duration-200"
              >
                <UserGroupIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <span className="font-semibold text-gray-800 dark:text-gray-100">Join as Group</span>
              </button>
            </div>
          )}

          {/* Step 2a – Individual confirm */}
          {mode === 'individual' && !alreadyIn && (
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-3 bg-blue-50 dark:bg-blue-900/30 rounded-xl px-4 py-3.5">
                <UserIcon className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Joining as Individual</p>
              </div>
              <button
                id="confirm-join-individual-btn"
                onClick={handleConfirmClick}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl text-sm transition-colors duration-200"
              >
                Confirm &amp; Join
              </button>
              <button
                onClick={() => setMode(null)}
                className="w-full text-sm text-gray-500 dark:text-gray-400 hover:underline"
              >
                ← Back
              </button>
            </div>
          )}

          {/* Step 2b – Group size + confirm */}
          {mode === 'group' && !alreadyIn && (
            <div className="flex flex-col gap-4">
              <p className="text-sm font-medium text-gray-600 dark:text-gray-300 text-center">Select group size</p>

              {/* Stepper */}
              <div className="flex items-center justify-center gap-5">
                <button
                  id="group-size-minus-btn"
                  onClick={() => setGroupSize((s) => Math.max(2, s - 1))}
                  disabled={groupSize <= 2}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <MinusIcon className="w-4 h-4 text-gray-700 dark:text-gray-200" />
                </button>

                <div className="flex flex-col items-center">
                  <span className="text-5xl font-black text-blue-600 dark:text-blue-400 leading-none w-16 text-center">
                    {groupSize}
                  </span>
                  <span className="text-xs text-gray-400 dark:text-gray-500 mt-1">people</span>
                </div>

                <button
                  id="group-size-plus-btn"
                  onClick={() => setGroupSize((s) => Math.min(10, s + 1))}
                  disabled={groupSize >= 10}
                  className="w-10 h-10 flex items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <PlusIcon className="w-4 h-4 text-gray-700 dark:text-gray-200" />
                </button>
              </div>

              <button
                id="confirm-join-group-btn"
                onClick={handleConfirmClick}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl text-sm transition-colors duration-200"
              >
                Confirm &amp; Join as Group of {groupSize}
              </button>
              <button
                onClick={() => setMode(null)}
                className="w-full text-sm text-gray-500 dark:text-gray-400 hover:underline"
              >
                ← Back
              </button>
            </div>
          )}

          {/* Already in — dismiss */}
          {alreadyIn && (
            <button
              onClick={onClose}
              className="w-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-semibold py-3 rounded-xl text-sm transition-colors duration-200"
            >
              Close
            </button>
          )}
        </div>
      </div>
    </>
  );
};

export default JoinQueueModal;
