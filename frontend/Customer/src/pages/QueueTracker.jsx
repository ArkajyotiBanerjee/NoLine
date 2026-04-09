import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { addNotification } from '../utils/notifications';
import Toast from '../components/Toast';
import { queues as mockQueues } from '../data/mockData';
import {
  MapPinIcon,
  ClockIcon,
  UserIcon,
  UserGroupIcon,
  XCircleIcon,
  QrCodeIcon,
  BellAlertIcon,
  MegaphoneIcon,
  ChevronDownIcon,
  ChevronUpIcon,
} from '@heroicons/react/24/outline';
import { getQRNGBytes, bytesToPin } from '../utils/qrng';

// ── Animated binary stream for demo panel ───────────────────────────────────
const useBinaryStream = (active) => {
  const [lines, setLines] = useState(['Generating entropy...']);
  const intervalRef = React.useRef(null);

  useEffect(() => {
    if (!active) {
      setLines(['Generating entropy...']);
      clearInterval(intervalRef.current);
      return;
    }

    intervalRef.current = setInterval(() => {
      const bits = Array.from({ length: 20 }, () =>
        Math.random() > 0.5 ? '1' : '0'
      ).join('');
      setLines((prev) => {
        const next = [...prev, bits];
        return next.slice(-6); // keep last 6 lines
      });
    }, 180);

    return () => clearInterval(intervalRef.current);
  }, [active]);

  return lines;
};

// ── Status helpers ─────────────────────────────────────────────────────────────
const STATUS_CONFIG = {
  waiting:    { label: 'Waiting',    bg: 'bg-blue-100 dark:bg-blue-900/40',    text: 'text-blue-700 dark:text-blue-300',    icon: '⏳' },
  approaching:{ label: 'Approaching',bg: 'bg-amber-100 dark:bg-amber-900/40',  text: 'text-amber-700 dark:text-amber-300',  icon: '🚶' },
  ready:      { label: 'Ready!',     bg: 'bg-green-100 dark:bg-green-900/40',  text: 'text-green-700 dark:text-green-300',  icon: '🔔' },
  'on-hold':  { label: 'On Hold',    bg: 'bg-orange-100 dark:bg-orange-900/40',text: 'text-orange-700 dark:text-orange-300',icon: '⏸' },
  'checked-in':{ label: 'Checked In',bg: 'bg-teal-100 dark:bg-teal-900/40',   text: 'text-teal-700 dark:text-teal-300',    icon: '✅' },
  completed:  { label: 'Completed',  bg: 'bg-gray-100 dark:bg-gray-700',       text: 'text-gray-600 dark:text-gray-300',    icon: '✓' },
};

// ── Action guidance ────────────────────────────────────────────────────────────
const getGuidance = (peopleAhead, status) => {
  if (status === 'completed') return null;
  if (status === 'ready') return '🔔 It\'s your turn! Please proceed to the counter.';
  if (status === 'on-hold') return '⏸ You are on hold. Wait for the staff to call you.';
  if (status === 'checked-in') return '✅ You\'re checked in! Staff will attend to you shortly.';
  if (peopleAhead <= 2) return '⚡ Be ready — your turn is very near!';
  if (peopleAhead <= 5) return '🚶 Start heading to the location now.';
  if (peopleAhead <= 10) return '🛋 Almost time — you can begin making your way.';
  return '😌 Relax, no need to arrive yet. We\'ll keep you posted.';
};

// ── Format seconds as MM:SS ────────────────────────────────────────────────────
const formatCountdown = (seconds) => {
  const m = Math.floor(Math.max(0, seconds) / 60);
  const s = Math.max(0, seconds) % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
};

// ── Embed Map URL ──────────────────────────────────────────────────────────────
const getEmbedUrl = (mapLink) => {
  try {
    const url = new URL(mapLink);
    const q = url.searchParams.get('q') || '';
    return `https://maps.google.com/maps?q=${encodeURIComponent(q)}&output=embed&z=15`;
  } catch {
    return null;
  }
};

// ── Admin-sync simulation messages ────────────────────────────────────────────
const SYNC_MESSAGES = [
  'Queue updated just now',
  'Position updated',
  'Queue data synced',
  'Live update received',
];

const QueueTracker = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [queue, setQueue] = useState(null);
  const [toast, setToast] = useState(null);
  const [showQr, setShowQr] = useState(false);
  const [holdSecondsLeft, setHoldSecondsLeft] = useState(0);
  const [syncMsg, setSyncMsg] = useState('');
  const [announcement, setAnnouncement] = useState(null);

  // QRNG states
  const [isGeneratingPin, setIsGeneratingPin] = useState(false);
  const [showDemo, setShowDemo] = useState(false);
  const binaryLines = useBinaryStream(showDemo);

  // ── Load queue from localStorage ──────────────────────────────────────────
  const loadQueue = useCallback(() => {
    const all = JSON.parse(localStorage.getItem('joinedQueues') || '[]');
    const found = all.find((q) => String(q.id) === String(id));
    if (found) {
      const sourceData = mockQueues.find(m => String(m.id) === String(id)) || {};
      setQueue({ ...sourceData, ...found });
    } else {
      setQueue(null);
    }
  }, [id]);

  useEffect(() => {
    loadQueue();
  }, [loadQueue]);

  // ── Load announcements ────────────────────────────────────────────────────
  useEffect(() => {
    const ann = JSON.parse(localStorage.getItem('announcements') || '[]');
    if (ann.length > 0) setAnnouncement(ann[0]);
  }, []);

  // ── On-hold countdown ─────────────────────────────────────────────────────
  useEffect(() => {
    if (!queue || queue.status !== 'on-hold' || !queue.holdEndTime) return;
    const tick = () => {
      const remaining = Math.ceil((queue.holdEndTime - Date.now()) / 1000);
      setHoldSecondsLeft(Math.max(0, remaining));
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [queue?.status, queue?.holdEndTime]);

  // ── Admin-sync simulation (random interval 8–18s) ─────────────────────────
  useEffect(() => {
    const schedule = () => {
      const delay = 8000 + Math.random() * 10000;
      return setTimeout(() => {
        const msg = SYNC_MESSAGES[Math.floor(Math.random() * SYNC_MESSAGES.length)];
        setSyncMsg(msg);
        setTimeout(() => setSyncMsg(''), 3000);
        schedule();
      }, delay);
    };
    const t = schedule();
    return () => clearTimeout(t);
  }, []);

  // ── Persist update ────────────────────────────────────────────────────────
  const persistUpdate = (updatedQueue) => {
    const all = JSON.parse(localStorage.getItem('joinedQueues') || '[]');
    const updated = all.map((q) =>
      String(q.id) === String(id) ? updatedQueue : q
    );
    localStorage.setItem('joinedQueues', JSON.stringify(updated));
    setQueue(updatedQueue);
  };

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleLeave = () => {
    const all = JSON.parse(localStorage.getItem('joinedQueues') || '[]');
    const updated = all.filter((q) => String(q.id) !== String(id));
    localStorage.setItem('joinedQueues', JSON.stringify(updated));
    addNotification(`You left the queue at ${queue?.name}`);
    navigate('/my-queues');
  };

  const handleArrived = async () => {
    if (!queue || queue.pin) return;
    setIsGeneratingPin(true);
    
    // True QRNG fetch
    const { bytes, source } = await getQRNGBytes(6);
    const pin = bytesToPin(bytes);
    
    const updated = { ...queue, pin, entropyBytes: bytes, sourceData: source, status: 'checked-in' };
    persistUpdate(updated);
    addNotification(`Arrival confirmed for ${queue.name}`);
    setToast({ message: 'Arrival confirmed! Show your PIN ✅', type: 'success' });
    setIsGeneratingPin(false);
  };

  const handleCancelPin = () => {
    if (!queue) return;
    const updated = { ...queue, pin: null, status: 'waiting' };
    persistUpdate(updated);
    setToast({ message: 'Arrival check-in cancelled', type: 'info' });
    setShowQr(false);
  };

  // ── Derived ───────────────────────────────────────────────────────────────
  const estWait = queue ? queue.peopleAhead * (queue.avgTimePerPerson || 5) : 0;
  const isGroup = queue?.groupSize && queue.groupSize > 1;
  const isCompleted = queue?.status === 'completed';
  const isOnHold = queue?.status === 'on-hold';
  const statusCfg = queue ? (STATUS_CONFIG[queue.status] || STATUS_CONFIG.waiting) : STATUS_CONFIG.waiting;
  const guidance = queue ? getGuidance(queue.peopleAhead, queue.status) : null;

  // ── Not found ─────────────────────────────────────────────────────────────
  if (!queue) {
    return (
      <div className="p-4 text-center py-20">
        <p className="text-gray-500 dark:text-gray-400 font-medium">Queue not found.</p>
        <button
          onClick={() => navigate('/my-queues')}
          className="mt-4 text-blue-600 dark:text-blue-400 text-sm font-medium hover:underline"
        >
          ← Back to My Queues
        </button>
      </div>
    );
  }

  // ── COMPLETED state ───────────────────────────────────────────────────────
  if (isCompleted) {
    return (
      <div className="p-4 flex flex-col items-center justify-center min-h-[70vh] gap-6">
        {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 p-10 flex flex-col items-center gap-4 w-full max-w-sm text-center">
          <div className="w-20 h-20 bg-green-100 dark:bg-green-900/40 rounded-full flex items-center justify-center text-4xl">
            ✅
          </div>
          <h2 className="text-xl font-bold text-gray-800 dark:text-white">Service Complete</h2>
          <p className="text-gray-500 dark:text-gray-400 text-sm">
            Your service at <span className="font-semibold text-gray-700 dark:text-gray-300">{queue.name}</span> is complete. Thanks for using NoLine!
          </p>
          <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl px-4 py-2 w-full">
            <p className="text-xs text-gray-400 dark:text-gray-500">Token</p>
            <p className="font-mono font-bold text-blue-600 dark:text-blue-400 text-lg">#{queue.token}</p>
          </div>
          <button
            onClick={handleLeave}
            className="mt-2 w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl text-sm transition-colors"
          >
            Done — Back to My Queues
          </button>
        </div>
      </div>
    );
  }

  // ── MAIN VIEW ─────────────────────────────────────────────────────────────
  return (
    <div className="p-4 flex flex-col gap-4">
      {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}

      {/* ── Announcement banner ── */}
      {announcement && (
        <div className="flex items-start gap-2.5 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-xl px-4 py-3">
          <MegaphoneIcon className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-sm font-medium text-amber-700 dark:text-amber-300">{announcement.message}</p>
        </div>
      )}

      {/* ── Admin-sync indicator ── */}
      {syncMsg && (
        <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500 justify-center transition-opacity duration-300">
          <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
          {syncMsg}
        </div>
      )}

      {/* ── Queue header ── */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 px-5 py-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <h1 className="font-bold text-lg text-gray-800 dark:text-gray-100">{queue.name}</h1>
            {queue.queueTitle && (
              <span className="inline-block mt-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 leading-tight">
                {queue.queueTitle}
              </span>
            )}
            {queue.location && (
              <div className="flex items-center gap-1.5 mt-1.5 text-gray-500 dark:text-gray-400 text-sm">
                <MapPinIcon className="w-4 h-4" />
                <span>{queue.location}</span>
              </div>
            )}
          </div>
          {/* Group type pill */}
          <span className={`flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0 ${
            isGroup
              ? 'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300'
              : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
          }`}>
            {isGroup ? (
              <><UserGroupIcon className="w-3.5 h-3.5" /> Group of {queue.groupSize}</>
            ) : (
              <><UserIcon className="w-3.5 h-3.5" /> Individual</>
            )}
          </span>
        </div>
      </div>

      {/* ── Main card: QR + Position/PIN ── */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 px-5 py-8 flex flex-col items-center gap-3 relative">

        {/* ── QR Code (toggles above PIN/position) ── */}
        <div
          className={`overflow-hidden transition-all duration-300 w-full flex flex-col items-center ${
            showQr ? 'max-h-64 opacity-100 mb-2' : 'max-h-0 opacity-0'
          }`}
        >
          <div
            className="cursor-pointer p-3 bg-white dark:bg-white rounded-xl shadow-inner"
            onClick={() => setShowQr(false)}
            title="Tap to hide"
          >
            {queue.pin && (
              <QRCodeSVG value={String(queue.pin)} size={160} />
            )}
          </div>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">Tap QR to hide</p>
        </div>

        {queue.pin ? (
          /* ── PIN VIEW ── */
          <>
            {/* Cancel button */}
            <button
              id="cancel-pin-btn"
              onClick={handleCancelPin}
              className="absolute top-3 right-3 p-1 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
              title="Cancel check-in"
            >
              <XCircleIcon className="w-6 h-6" />
            </button>

            <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest text-center mt-3">
              Generated using Quantum Random Number Generator
            </p>

            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1 mt-4">
              Your Verification Code
            </p>

            {/* Exactly styling requested by user */}
            <div className="text-4xl font-bold text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/40 border border-green-500 rounded-xl px-8 py-4 tracking-widest my-2">
              {queue.pin}
            </div>

            <p className="text-xs text-gray-400 dark:text-gray-500 text-center mt-1">
              Show this code to staff when called
            </p>

            {/* Demo Toggle */}
            <button
              id="pin-demo-toggle"
              onClick={() => setShowDemo((v) => !v)}
              className="flex items-center justify-center gap-1 text-xs text-gray-400 dark:text-gray-500 hover:text-blue-500 dark:hover:text-blue-400 transition-colors mx-auto mt-2"
            >
              {showDemo ? <ChevronUpIcon className="w-3.5 h-3.5" /> : <ChevronDownIcon className="w-3.5 h-3.5" />}
              {showDemo ? 'Hide technical details' : 'Show how this is generated'}
            </button>

            {/* Demo Panel */}
            <div
              className={`overflow-hidden transition-all duration-300 w-full ${showDemo ? 'max-h-[500px] opacity-100 mt-2' : 'max-h-0 opacity-0 mt-0'}`}
            >
              <div className="p-4 border border-dashed border-gray-400 rounded-xl bg-gray-900 text-white flex flex-col gap-4 text-left">
                {/* 1. HEADER */}
                <div>
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                    <span className="text-green-400">⚛️</span> QUANTUM GENERATION
                  </p>
                  {/* 2. ENTROPY VISUAL */}
                  <div className="font-mono text-green-400 bg-black/50 p-3 rounded-lg text-xs h-24 overflow-hidden leading-[1.3] break-all">
                    {binaryLines.map((line, i) => (
                      <div key={i} className={i === binaryLines.length - 1 ? 'opacity-100' : 'opacity-40'}>
                        {line}
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3. EXPLANATION */}
                <p className="text-xs text-gray-300 leading-relaxed font-sans">
                  This PIN is generated using true quantum randomness from ANU QRNG.
                  <br />
                  Fallback uses cryptographically secure randomness when network is unavailable.
                </p>

                {/* 4. ENTROPY BYTES */}
                <div className="bg-black/40 rounded-lg px-3 py-2.5">
                  <p className="text-[10px] text-gray-400 mb-1 uppercase tracking-wider font-semibold">Entropy Bytes</p>
                  <p className="font-mono text-xs text-blue-400 font-bold break-all">
                    [{queue.entropyBytes ? queue.entropyBytes.join(', ') : '...'}]
                  </p>
                </div>

                {/* 5. SOURCE BADGE */}
                <div className="flex items-center justify-between border-t border-gray-700/50 pt-3 mt-1">
                  <p className="text-[10px] uppercase tracking-wider font-semibold text-gray-400">Source</p>
                  <span className={`text-[10px] font-bold px-2 py-1 rounded border ${
                    queue.sourceData && queue.sourceData.includes('ANU') 
                      ? 'bg-purple-900/40 text-purple-300 border-purple-700' 
                      : 'bg-green-900/40 text-green-400 border-green-700'
                  }`}>
                    {queue.sourceData || '...'}
                  </span>
                </div>
              </div>
            </div>

            {/* Still show position small */}
            <div className="mt-4 border-t border-gray-100 dark:border-gray-700 pt-3 w-full text-center">
              <p className="text-xs text-gray-400 dark:text-gray-500 mb-1">Your Position</p>
              <p className="text-3xl font-black text-blue-600 dark:text-blue-400">#{queue.position}</p>
            </div>
          </>
        ) : (
          /* ── POSITION VIEW ── */
          <>
            <p className="text-sm font-medium text-gray-500 dark:text-gray-400 uppercase tracking-widest">
              Your Position
            </p>
            <p className="text-8xl font-black text-blue-600 dark:text-blue-400 leading-none">
              #{queue.position}
            </p>

            {/* Token */}
            {queue.token && (
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs text-gray-400 dark:text-gray-500">Token</span>
                <span className="font-mono font-bold text-sm text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2.5 py-1 rounded-lg">
                  #{queue.token}
                </span>
              </div>
            )}

            <div className="mt-3 grid grid-cols-2 gap-6 w-full text-center border-t border-gray-100 dark:border-gray-700 pt-4">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">People Ahead</p>
                <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">{queue.peopleAhead}</p>
              </div>
              <div>
                <div className="flex items-center justify-center gap-1 text-gray-500 dark:text-gray-400 mb-1">
                  <ClockIcon className="w-3.5 h-3.5" />
                  <p className="text-xs">Est. Wait</p>
                </div>
                <p className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                  {estWait > 0 ? `${estWait}m` : '—'}
                </p>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Status badge ── */}
      <div className="flex items-center justify-center gap-3">
        <span className={`text-sm font-semibold px-4 py-1.5 rounded-full ${statusCfg.bg} ${statusCfg.text}`}>
          {statusCfg.icon} {statusCfg.label}
        </span>
        {isOnHold && queue.holdEndTime && (
          <span className="text-sm font-mono text-orange-600 dark:text-orange-400 font-bold">
            ({formatCountdown(holdSecondsLeft)} remaining)
          </span>
        )}
      </div>

      {/* ── Action guidance ── */}
      {guidance && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900 rounded-xl px-4 py-3">
          <p className="text-sm text-blue-700 dark:text-blue-300 font-medium text-center">{guidance}</p>
        </div>
      )}

      {/* ── MAP CARD ────────────────────────────────────────────────────────── */}
      {queue.mapLink && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="px-5 py-4 flex items-center justify-between border-b border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <MapPinIcon className="w-5 h-5 text-blue-500" />
              <h2 className="font-bold text-gray-800 dark:text-white text-base">Location</h2>
            </div>
            <a
              href={queue.mapLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline"
            >
              Get Directions
            </a>
          </div>
          
          <div className="px-5 py-3 bg-gray-50 dark:bg-gray-700/40">
            <p className="text-sm text-gray-800 dark:text-gray-200 font-bold">{queue.name}</p>
            {queue.queueTitle && (
              <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 mt-0.5">
                {queue.queueTitle}
              </p>
            )}
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {queue.address || queue.location}
            </p>
          </div>

          <div className="relative w-full" style={{ height: '220px' }}>
            <iframe
              title={`Map of ${queue.name}`}
              src={getEmbedUrl(queue.mapLink)}
              width="100%"
              height="220"
              style={{ border: 0, display: 'block' }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      )}

      {/* ── Action buttons ── */}
      <div className="flex flex-col gap-3 mt-1">
        {/* I Have Arrived */}
        <button
          id="arrived-btn"
          onClick={handleArrived}
          disabled={!!queue.pin || isGeneratingPin}
          className={`w-full font-semibold py-3 rounded-xl text-sm transition-colors duration-200 ${
            queue.pin || isGeneratingPin
              ? 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
              : 'bg-green-500 hover:bg-green-600 text-white shadow-md'
          }`}
        >
          {queue.pin ? '✅ Arrived' : isGeneratingPin ? '🔄 Generating PIN...' : '✅ I Have Arrived'}
        </button>

        {/* Show QR Code — only visible after PIN exists */}
        {queue.pin && (
          <button
            id="show-qr-btn"
            onClick={() => setShowQr((v) => !v)}
            className="w-full flex items-center justify-center gap-2 bg-indigo-50 dark:bg-indigo-900/30 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800 font-semibold py-3 rounded-xl text-sm transition-colors duration-200"
          >
            <QrCodeIcon className="w-5 h-5" />
            {showQr ? 'Hide QR Code' : 'Show QR Code'}
          </button>
        )}

        {/* Leave Queue */}
        <button
          id="leave-queue-btn"
          onClick={handleLeave}
          className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-3 rounded-xl text-sm transition-colors duration-200"
        >
          Leave Queue
        </button>
      </div>

      {/* ── Notifications hint ── */}
      <button
        onClick={() => navigate('/notifications')}
        className="flex items-center justify-center gap-2 text-xs text-gray-400 dark:text-gray-500 hover:text-blue-500 dark:hover:text-blue-400 transition-colors mx-auto mt-1"
      >
        <BellAlertIcon className="w-3.5 h-3.5" />
        View all notifications
      </button>
    </div>
  );
};

export default QueueTracker;
