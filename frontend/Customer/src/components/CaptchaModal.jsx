import React, { useState, useEffect, useRef, useCallback } from 'react';
import { XMarkIcon, ArrowPathIcon, ChevronDownIcon, ChevronUpIcon } from '@heroicons/react/24/outline';
import { getQRNGBytes, bytesToCaptcha } from '../utils/qrng';

const CAPTCHA_LENGTH = 6;
const EXPIRY_SECONDS = 60;
const MAX_ATTEMPTS = 3;

// ─── Animated binary stream for demo panel ───────────────────────────────────
const useBinaryStream = (active) => {
  const [lines, setLines] = useState(['Generating entropy...']);
  const intervalRef = useRef(null);

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


/**
 * CaptchaModal
 * Props:
 *  onVerified – called when CAPTCHA is correctly solved
 *  onClose    – called to dismiss without verifying
 *  queueName  – string, shown in subtitle
 */
const CaptchaModal = ({ onVerified, onClose, queueName }) => {
  const [captcha, setCaptcha] = useState('');
  const [entropyBytes, setEntropyBytes] = useState([]);
  const [sourceData, setSourceData] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [timeLeft, setTimeLeft] = useState(EXPIRY_SECONDS);
  const [showDemo, setShowDemo] = useState(false);
  const binaryLines = useBinaryStream(showDemo);
  const inputRef = useRef(null);

  // Initial fetch
  useEffect(() => {
    refresh();
  }, []);

  // ── Lock scroll while open ────────────────────────────────────────────────
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, []);

  // ── Auto-focus input ─────────────────────────────────────────────────────
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // ── 60s countdown expiry ─────────────────────────────────────────────────
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          refresh();
          return EXPIRY_SECONDS;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setInput('');
    setError('');
    const { bytes, source } = await getQRNGBytes(CAPTCHA_LENGTH);
    setCaptcha(bytesToCaptcha(bytes));
    setEntropyBytes(bytes);
    setSourceData(source);
    
    setTimeLeft(EXPIRY_SECONDS);
    setAttempts(0);
    setIsLoading(false);
    setTimeout(() => inputRef.current?.focus(), 50);
  }, []);

  const handleVerify = () => {
    if (input === captcha) {
      onVerified();
      return;
    }

    const newAttempts = attempts + 1;
    setAttempts(newAttempts);

    if (newAttempts >= MAX_ATTEMPTS) {
      setError(`Too many incorrect attempts. Generating new code…`);
      setTimeout(refresh, 1500);
    } else {
      setError(`Incorrect code. ${MAX_ATTEMPTS - newAttempts} attempt${MAX_ATTEMPTS - newAttempts === 1 ? '' : 's'} remaining.`);
      setInput('');
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleVerify();
  };

  // Timer colour
  const timerColour =
    timeLeft > 30 ? 'text-gray-400 dark:text-gray-500'
    : timeLeft > 10 ? 'text-amber-500 dark:text-amber-400'
    : 'text-red-500 dark:text-red-400';

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white dark:bg-gray-800 w-full sm:max-w-sm rounded-t-2xl sm:rounded-2xl shadow-2xl p-6 flex flex-col gap-5 animate-slide-up">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-800 dark:text-white">Quick Verification</h2>
            {queueName && (
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">for {queueName}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            aria-label="Close"
          >
            <XMarkIcon className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* ── CAPTCHA display ─────────────────────────────────────────────── */}
        <div className="flex flex-col items-center gap-3">
          <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest text-center">
            Generated using Quantum Random Number Generator
          </p>
          <div className="relative w-full">
            <div
              id="captcha-display"
              className="font-mono text-lg tracking-widest bg-gray-100 dark:bg-gray-700 px-4 py-3 rounded-xl text-center text-gray-800 dark:text-gray-100 select-none border border-gray-200 dark:border-gray-600 flex items-center justify-center min-h-[52px]"
              aria-label="CAPTCHA code"
            >
              {isLoading ? (
                <span className="text-gray-400 text-sm animate-pulse">Generating Quantum Code...</span>
              ) : (
                <span className="relative">
                  {captcha.split('').map((ch, i) => (
                    <span
                      key={i}
                      style={{
                        display: 'inline-block',
                        transform: `rotate(${(i % 2 === 0 ? 1 : -1) * (2 + (i * 3) % 6)}deg)`,
                        marginRight: '2px',
                        color: `hsl(${(i * 47 + 200) % 360}, 60%, ${document.documentElement.classList.contains('dark') ? '70%' : '30%'})`,
                      }}
                    >
                      {ch}
                    </span>
                  ))}
                </span>
              )}
            </div>
            {/* Timer pill */}
            <span className={`absolute top-1.5 right-2 text-xs font-mono font-medium ${timerColour}`}>
              {timeLeft}s
            </span>
          </div>

          {/* Input */}
          <input
            ref={inputRef}
            id="captcha-input"
            type="text"
            value={input}
            onChange={(e) => { setInput(e.target.value); setError(''); }}
            onKeyDown={handleKeyDown}
            maxLength={CAPTCHA_LENGTH}
            placeholder="Enter code above"
            className="w-full border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 font-mono text-base text-center rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 placeholder:text-gray-400 dark:placeholder:text-gray-600 tracking-widest transition"
            autoComplete="off"
            spellCheck={false}
          />

          {/* Error message */}
          {error && (
            <p className="text-xs text-red-500 dark:text-red-400 text-center font-medium">
              {error}
            </p>
          )}
        </div>

        {/* ── Buttons ─────────────────────────────────────────────────────── */}
        <div className="flex gap-3">
          <button
            id="captcha-refresh-btn"
            onClick={refresh}
            disabled={isLoading}
            className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 text-gray-700 dark:text-gray-200 text-sm font-semibold transition-colors"
            title="Get a new code"
          >
            <ArrowPathIcon className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            New Code
          </button>
          <button
            id="captcha-confirm-btn"
            onClick={handleVerify}
            disabled={input.length !== CAPTCHA_LENGTH}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 dark:disabled:bg-blue-900 disabled:cursor-not-allowed text-white font-bold py-2.5 rounded-xl text-sm transition-colors duration-200"
          >
            ✅ Confirm
          </button>
        </div>

        {/* ── Demo toggle link ─────────────────────────────────────────────── */}
        <button
          id="captcha-demo-toggle"
          onClick={() => setShowDemo((v) => !v)}
          className="flex items-center justify-center gap-1 text-xs text-gray-400 dark:text-gray-500 hover:text-blue-500 dark:hover:text-blue-400 transition-colors mx-auto"
        >
          {showDemo ? <ChevronUpIcon className="w-3.5 h-3.5" /> : <ChevronDownIcon className="w-3.5 h-3.5" />}
          {showDemo ? 'Hide technical details' : 'Show how this is generated'}
        </button>

        {/* ── DEMO PANEL (hidden by default) ──────────────────────────────── */}
        <div
          className={`overflow-hidden transition-all duration-300 ${showDemo ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'}`}
        >
          <div className="mt-3 p-4 border border-dashed border-gray-400 rounded-xl bg-gray-900 text-white flex flex-col gap-4">
            
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
              This CAPTCHA is generated using true quantum randomness from ANU QRNG.
              <br />
              Fallback uses cryptographically secure randomness when network is unavailable.
            </p>

            {/* 4. ENTROPY BYTES */}
            <div className="bg-black/40 rounded-lg px-3 py-2.5">
              <p className="text-[10px] text-gray-400 mb-1 uppercase tracking-wider font-semibold">Entropy Bytes</p>
              <p className="font-mono text-xs text-blue-400 font-bold break-all">
                [{entropyBytes.join(', ')}]
              </p>
            </div>

            {/* 5. SOURCE BADGE */}
            <div className="flex items-center justify-between border-t border-gray-700/50 pt-3 mt-1">
              <p className="text-[10px] uppercase tracking-wider font-semibold text-gray-400">Source</p>
              <span className={`text-[10px] font-bold px-2 py-1 rounded border ${
                sourceData && sourceData.includes('ANU') 
                  ? 'bg-purple-900/40 text-purple-300 border-purple-700' 
                  : 'bg-green-900/40 text-green-400 border-green-700'
              }`}>
                {sourceData || '...'}
              </span>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
};

export default CaptchaModal;
