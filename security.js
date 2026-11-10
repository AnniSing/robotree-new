/* Robotree browser-side validation and form safety helpers */

// Defensive guard: Prevent 'Unexpected end of JSON input' on empty/invalid responses globally
if (typeof Response !== 'undefined' && Response.prototype && !Response.prototype._safeJsonPatched) {
  const originalJson = Response.prototype.json;
  Response.prototype.json = async function () {
    try {
      const text = await this.text();
      if (!text || !text.trim()) {
        return {};
      }
      try {
        return JSON.parse(text);
      } catch (parseErr) {
        return { success: false, error: 'INVALID_JSON', message: 'Server returned an invalid JSON response.', raw: text };
      }
    } catch (err) {
      return { success: false, error: 'READ_ERROR', message: err?.message || 'Failed to read response.' };
    }
  };
  Response.prototype._safeJsonPatched = true;
}

export async function readJsonResponse(response) {
  if (!response) return {};
  try {
    const text = await response.text();
    if (!text || !text.trim()) return {};
    return JSON.parse(text);
  } catch {
    return { success: false, message: 'Server returned an invalid response.' };
  }
}

export function sanitizeInput(input) {
  if (typeof input !== 'string') return input;
  return input
    .trim()
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

export function sanitizePlainText(input, maxLength = 1000) {
  if (typeof input !== 'string') return input;
  return input
    .trim()
    .replace(/[\u0000-\u001F\u007F]/g, '')
    .replace(/[<>]/g, '')
    .slice(0, maxLength);
}

export function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(email).trim());
}

export function validatePhone(phone) {
  const value = String(phone || '').trim();
  if (!value) return true;
  return /^(\+?[0-9][0-9\s().-]{7,20})$/.test(value);
}

export const CSRFManager = {
  token: '',
  pending: null,

  async getToken() {
    if (this.token) return this.token;

    // Check if a real server token was previously saved in sessionStorage
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        const cached = window.sessionStorage.getItem('robotree_csrf_token');
        if (cached && typeof cached === 'string' && !cached.startsWith('rb_token_') && cached.length >= 16) {
          this.token = cached;
          return this.token;
        }
      }
    } catch (_) {}

    if (this.pending) return this.pending;

    this.pending = (async () => {
      // 1. Try fetching from /api/csrf-token with a 4s timeout
      try {
        const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
        const timeoutId = controller ? setTimeout(() => controller.abort(), 4000) : null;

        const response = await fetch('/api/csrf-token', {
          credentials: 'include',
          signal: controller?.signal
        });
        if (timeoutId) clearTimeout(timeoutId);

        const data = await readJsonResponse(response);
        if (response.ok && data && data.csrfToken) {
          this.token = data.csrfToken;
          try {
            if (typeof window !== 'undefined' && window.sessionStorage) {
              window.sessionStorage.setItem('robotree_csrf_token', this.token);
            }
          } catch (_) {}
          return this.token;
        }
      } catch (err) {
        console.warn('[Robotree CSRF] Server CSRF endpoint unavailable, using temporary token:', err?.message || err);
      }

      // 2. Return non-persisted fallback token so UI never crashes, without poisoning sessionStorage
      return 'rb_token_' + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
    })().finally(() => {
      this.pending = null;
    });

    return this.pending;
  },

  reset() {
    this.token = '';
    this.pending = null;
    try {
      if (typeof window !== 'undefined' && window.sessionStorage) {
        window.sessionStorage.removeItem('robotree_csrf_token');
      }
    } catch (_) {}
  }
};

export async function getCsrfToken() {
  return CSRFManager.getToken();
}

export const RateLimiter = {
  attempts: new Map(),

  isRateLimited(actionKey, maxAttempts = 5, windowMs = 60000) {
    const now = Date.now();
    const attempts = this.attempts.get(actionKey) || [];
    const recentAttempts = attempts.filter((timestamp) => now - timestamp < windowMs);

    if (recentAttempts.length >= maxAttempts) {
      this.attempts.set(actionKey, recentAttempts);
      return true;
    }

    recentAttempts.push(now);
    this.attempts.set(actionKey, recentAttempts);
    return false;
  }
};

export const RobotreeSecurity = {
  sanitizeInput,
  sanitizePlainText,
  validateEmail,
  validatePhone,
  CSRFManager,
  RateLimiter,
  readJsonResponse
};

if (typeof window !== 'undefined') {
  window.RobotreeSecurity = RobotreeSecurity;
}
