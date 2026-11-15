/**
 * Robotree Careers Platform — Centralized API Client Configuration
 * Supports unified same-origin deployments (Vercel) and decoupled cross-origin backends.
 */

export const API_BASE_URL = (() => {
  // Build-time Vite env variable (e.g. VITE_API_BASE_URL=https://api.robotree.in)
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_BASE_URL) {
    return String(import.meta.env.VITE_API_BASE_URL).trim().replace(/\/+$/, '');
  }
  // Runtime window injection for custom environments
  if (typeof window !== 'undefined' && window.__ROBOTREE_API_BASE__) {
    return String(window.__ROBOTREE_API_BASE__).trim().replace(/\/+$/, '');
  }
  // Default: Same-origin relative URLs (/api/...)
  return '';
})();

/**
 * Builds a fully qualified API endpoint URL based on current environment configuration.
 * @param {string} endpoint - Path such as '/api/csrf-token' or '/api/admin/login'
 * @returns {string} Fully resolved URL
 */
export function buildApiUrl(endpoint) {
  if (!endpoint) return API_BASE_URL || '/';
  if (/^https?:\/\//i.test(endpoint)) return endpoint;
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${API_BASE_URL}${cleanEndpoint}`;
}
