import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { queues } from '../data/mockData';
import JoinQueueModal from '../components/JoinQueueModal';
import Toast from '../components/Toast';
import {
  MapPinIcon,
  UserGroupIcon,
  ClockIcon,
  PhoneIcon,
  ArrowTopRightOnSquareIcon,
} from '@heroicons/react/24/outline';

// ── Load indicator ────────────────────────────────────────────────────────────
const getLoad = (size) => {
  if (size < 5)   return { label: 'Low',      color: 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300' };
  if (size <= 10) return { label: 'Moderate', color: 'bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300' };
  return                  { label: 'Busy',     color: 'bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300' };
};

// Build an embeddable Google Maps search URL from the mapLink query
const getEmbedUrl = (mapLink) => {
  try {
    const url = new URL(mapLink);
    const q = url.searchParams.get('q') || '';
    return `https://maps.google.com/maps?q=${encodeURIComponent(q)}&output=embed&z=15`;
  } catch {
    return null;
  }
};

// ── Day-of-week hours helper ─────────────────────────────────────────────────
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const todayIdx = new Date().getDay();

// Return a structured daily hours schedule (mock based on the openingHours string)
const getDailyHours = (openingHours) => {
  if (!openingHours) return null;
  const is24 = openingHours.toLowerCase().includes('24');
  return DAYS.map((day, i) => {
    const isWeekend = i === 0 || i === 6;
    if (is24) return { day, hours: '24 hours', closed: false };
    // Government offices: closed weekends
    if (isWeekend && /government|rto|museum/i.test('')) return { day, hours: 'Closed', closed: true };
    return { day, hours: openingHours, closed: false };
  });
};

const QueueDetail = ({ viewMode }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [toast, setToast] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showAllHours, setShowAllHours] = useState(false);

  const queue = queues.find((q) => q.id === parseInt(id));
  const estWait = queue ? queue.currentSize * queue.avgTimePerPerson : 0;
  const load = queue ? getLoad(queue.currentSize) : null;
  const embedUrl = queue ? getEmbedUrl(queue.mapLink) : null;
  const dailyHours = queue ? getDailyHours(queue.openingHours) : null;

  if (!queue) {
    return (
      <div className="p-4 text-center py-16">
        <p className="text-gray-500 dark:text-gray-400 font-medium">Queue not found.</p>
        <button onClick={() => navigate('/')} className="mt-4 text-blue-600 dark:text-blue-400 text-sm font-medium hover:underline">
          ← Back to Home
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 flex flex-col gap-4">
      {toast && <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />}

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

      {/* ── HEADER CARD ─────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-100 dark:border-gray-700 overflow-hidden">

        {/* Gradient banner */}
        <div className="bg-gradient-to-br from-blue-600 to-blue-800 dark:from-blue-800 dark:to-blue-950 px-5 py-6">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 min-w-0">
              {/* Queue title (service name) */}
              {queue.queueTitle && (
                <span className="inline-block mb-2 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-white/20 text-white/90 backdrop-blur-sm">
                  {queue.queueTitle}
                </span>
              )}
              {/* Place name */}
              <h1 className="text-2xl font-extrabold text-white leading-tight">{queue.name}</h1>
              <p className="text-blue-200 text-xs mt-1 font-medium">{queue.category} &bull; {queue.location}</p>
            </div>
            {/* Open / Closed badge */}
            <span className={`flex-shrink-0 text-xs font-bold px-3 py-1.5 rounded-full border ${
              queue.isOpen
                ? 'bg-green-400/20 text-green-100 border-green-300/40'
                : 'bg-red-400/20 text-red-100 border-red-300/40'
            }`}>
              {queue.isOpen ? '● Open' : '● Closed'}
            </span>
          </div>
        </div>

        {/* ── Meta rows ─────────────────────────────────────────────────────── */}
        <div className="px-5 py-4 flex flex-col gap-2.5">
          {/* Address */}
          <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
            <MapPinIcon className="w-5 h-5 text-blue-500 flex-shrink-0" />
            <span className="text-sm">{queue.location}</span>
          </div>
          {/* Phone */}
          {queue.phone && (
            <a
              href={`tel:${queue.phone}`}
              className="flex items-center gap-3 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors group"
            >
              <PhoneIcon className="w-5 h-5 text-blue-500 flex-shrink-0" />
              <span className="text-sm group-hover:underline">{queue.phone}</span>
            </a>
          )}
          {/* Opening hours (today) */}
          {queue.openingHours && (
            <div className="flex items-center gap-3 text-gray-600 dark:text-gray-300">
              <ClockIcon className="w-5 h-5 text-blue-500 flex-shrink-0" />
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm">{queue.openingHours}</span>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                  queue.isOpen
                    ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300'
                    : 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400'
                }`}>
                  {queue.isOpen ? 'Open now' : 'Closed now'}
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="h-px bg-gray-100 dark:bg-gray-700 mx-5" />

        {/* ── Stats grid ──────────────────────────────────────────────────── */}
        <div className="px-5 py-4 grid grid-cols-3 gap-3">
          <div className="flex flex-col items-center justify-center bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900 rounded-xl p-3">
            <UserGroupIcon className="w-5 h-5 text-blue-500 mb-1" />
            <p className="text-xl font-bold text-blue-600 dark:text-blue-400">{queue.currentSize}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">Waiting</p>
          </div>
          <div className="flex flex-col items-center justify-center bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900 rounded-xl p-3">
            <ClockIcon className="w-5 h-5 text-blue-500 mb-1" />
            <p className="text-xl font-bold text-blue-600 dark:text-blue-400">
              {estWait > 0 ? estWait : '~0'}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">Min wait</p>
          </div>
          {load && (
            <div className="flex flex-col items-center justify-center bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-900 rounded-xl p-3">
              <span className="text-lg mb-1">
                {load.label === 'Low' ? '🟢' : load.label === 'Moderate' ? '🟡' : '🔴'}
              </span>
              <p className={`text-xs font-bold ${load.color.split(' ').slice(-2).join(' ')}`}>{load.label}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 text-center">Load</p>
            </div>
          )}
        </div>

        {estWait === 0 && queue.isOpen && (
          <p className="text-center text-green-600 dark:text-green-400 font-semibold text-sm px-5 pb-4">
            🎉 No wait — walk right in!
          </p>
        )}
      </div>

      {/* ── TIMINGS CARD ────────────────────────────────────────────────────── */}
      {dailyHours && (
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-100 dark:border-gray-700 p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <ClockIcon className="w-5 h-5 text-blue-500" />
              <h2 className="font-bold text-gray-800 dark:text-white text-base">Opening Hours</h2>
            </div>
            <button
              onClick={() => setShowAllHours((v) => !v)}
              className="text-xs text-blue-600 dark:text-blue-400 font-semibold hover:underline"
            >
              {showAllHours ? 'Show less ▲' : 'All days ▼'}
            </button>
          </div>

          {/* Today row — always visible */}
          <div className="flex items-center justify-between py-2.5 border-b border-gray-100 dark:border-gray-700">
            <span className="text-sm font-bold text-blue-600 dark:text-blue-400">
              {DAYS[todayIdx]} (Today)
            </span>
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-800 dark:text-gray-100">
                {queue.openingHours}
              </span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                queue.isOpen
                  ? 'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300'
                  : 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-400'
              }`}>
                {queue.isOpen ? 'Open' : 'Closed'}
              </span>
            </div>
          </div>

          {/* Collapsible remaining days */}
          <div className={`overflow-hidden transition-all duration-300 ${showAllHours ? 'max-h-96' : 'max-h-0'}`}>
            {dailyHours.map((entry, i) => {
              if (i === todayIdx) return null;
              return (
                <div key={entry.day} className="flex items-center justify-between py-2.5 border-b border-gray-50 dark:border-gray-700/50 last:border-0">
                  <span className="text-sm text-gray-600 dark:text-gray-300">{entry.day}</span>
                  <span className={`text-sm font-medium ${entry.closed ? 'text-red-500 dark:text-red-400' : 'text-gray-700 dark:text-gray-200'}`}>
                    {entry.hours}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── MAP CARD ────────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-100 dark:border-gray-700 overflow-hidden">
        {/* Map header */}
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
            <ArrowTopRightOnSquareIcon className="w-3.5 h-3.5" />
          </a>
        </div>

        {/* Address row */}
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

        {/* Embedded map iframe */}
        {embedUrl ? (
          <div className="relative w-full" style={{ height: '220px' }}>
            <iframe
              title={`Map of ${queue.name}`}
              src={embedUrl}
              width="100%"
              height="220"
              style={{ border: 0, display: 'block' }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        ) : (
          /* Fallback: static map placeholder */
          <div className="h-44 bg-gray-100 dark:bg-gray-700 flex flex-col items-center justify-center gap-2">
            <MapPinIcon className="w-10 h-10 text-gray-300 dark:text-gray-600" />
            <p className="text-sm text-gray-400 dark:text-gray-500">Map unavailable</p>
          </div>
        )}

        {/* Open in Maps button */}
        <div className="px-5 py-4">
          <a
            href={queue.mapLink}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-semibold py-3 rounded-xl text-sm transition-colors duration-200"
          >
            📍 Open in Google Maps
          </a>
        </div>
      </div>

      {/* ── CTA BUTTONS ─────────────────────────────────────────────────────── */}
      <button
        id={`join-queue-detail-btn-${queue.id}`}
        onClick={() => setShowModal(true)}
        disabled={!queue.isOpen}
        className={`w-full font-bold py-4 rounded-2xl text-base transition-colors duration-200 shadow-md ${
          queue.isOpen
            ? 'bg-blue-600 hover:bg-blue-700 text-white'
            : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
        }`}
      >
        {queue.isOpen ? '🎫 Join Queue' : '🔒 Queue Closed'}
      </button>
    </div>
  );
};

export default QueueDetail;
