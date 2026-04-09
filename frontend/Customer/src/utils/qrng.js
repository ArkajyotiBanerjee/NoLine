/**
 * qrng.js
 * True Quantum Randomness from ANU QRNG (https://qrng.anu.edu.au)
 *
 * HOW IT WORKS:
 *   Browser → GET /api/qrng/jsonI.php  (same-origin, no CORS)
 *   Vite dev server forwards this server-side to qrng.anu.edu.au
 *
 * CACHING: The ANU API is rate-limited to ~1 req/minute.
 *   We fetch a large batch (100 bytes) upfront and serve from that pool.
 *   This means the Source badge shows "Quantum (ANU QRNG)" for the entire
 *   session as long as the first fetch succeeded — no repeated hits needed.
 *
 * Fallback: window.crypto CSPRNG if ANU is unreachable.
 */

// ── Pool of pre-fetched quantum bytes ─────────────────────────────────────────
let pool = [];          // available quantum bytes
let poolSource = null;  // 'Quantum (ANU QRNG)' | 'Secure fallback (CSPRNG)'
let fetchPromise = null; // deduplicate concurrent fetches

async function fillPool() {
  if (fetchPromise) return fetchPromise;     // already in-flight

  fetchPromise = (async () => {
    try {
      // Request 100 bytes at once — well within ANU limits
      const res = await fetch('/api/qrng/jsonI.php?length=100&type=uint8', {
        signal: AbortSignal.timeout(8000),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(`ANU HTTP ${res.status}: ${text.slice(0, 60)}`);
      }

      const data = await res.json();

      if (data.success && Array.isArray(data.data) && data.data.length > 0) {
        pool = data.data;
        poolSource = 'Quantum (ANU QRNG)';
        console.info(`[QRNG] ✅ Pool filled with ${pool.length} true quantum bytes from ANU`);
      } else {
        throw new Error('Unexpected ANU payload shape');
      }
    } catch (err) {
      console.warn('[QRNG] ⚠️ ANU fetch failed, filling pool with CSPRNG:', err.message);
      const buf = new Uint8Array(100);
      window.crypto.getRandomValues(buf);
      pool = Array.from(buf);
      poolSource = 'Secure fallback (CSPRNG)';
    } finally {
      fetchPromise = null;  // allow re-fetch if pool runs empty again
    }
  })();

  return fetchPromise;
}

// ── Public API ────────────────────────────────────────────────────────────────
export async function getQRNGBytes(length = 6) {
  // Ensure pool has enough bytes
  if (pool.length < length) {
    await fillPool();
  }

  const bytes = pool.splice(0, length);   // consume from front of pool
  return { bytes, source: poolSource };
}

const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';

export function bytesToCaptcha(bytes) {
  return bytes.map((b) => CHARS[b % CHARS.length]).join('');
}

export function bytesToPin(bytes) {
  return bytes.map((b) => b % 10).join('');
}
