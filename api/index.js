import { app } from '../dist-server/app.js';

export default function handler(req, res) {
  // Preserve original /api/* path under Vercel serverless rewrites without clobbering with /api/index.js
  let url = req.url || '/api';

  // 1. Check if original path was provided via query param (_path)
  if (url.includes('_path=')) {
    try {
      const parsedUrl = new URL(url, 'http://localhost');
      const paramPath = parsedUrl.searchParams.get('_path');
      if (paramPath && (paramPath.startsWith('/api') || paramPath.startsWith('/health'))) {
        url = paramPath;
      }
    } catch (_) {}
  }

  // 2. Check headers passed by Vercel / reverse proxy
  const matchedUri = req.headers['x-matched-path'] ||
                     req.headers['x-vercel-matched-path'] ||
                     req.headers['x-forwarded-uri'] ||
                     req.headers['x-invoke-path'] ||
                     req.headers['x-original-url'];

  if (typeof matchedUri === 'string' && (matchedUri.startsWith('/api') || matchedUri.startsWith('/health'))) {
    url = matchedUri;
  } else if (url.startsWith('/api/index.js')) {
    const suffix = url.slice('/api/index.js'.length);
    url = suffix.startsWith('/') ? `/api${suffix}` : `/api${suffix ? `/${suffix}` : ''}`;
  }

  if (!url.startsWith('/api') && !url.startsWith('/health')) {
    url = `/api${url.startsWith('/') ? url : `/${url}`}`;
  }

  // 3. Preserve any original query parameters (excluding internal _path param)
  const rawUrl = req.url || '';
  const queryIndex = rawUrl.indexOf('?');
  if (queryIndex !== -1 && !url.includes('?')) {
    try {
      const searchParams = new URLSearchParams(rawUrl.slice(queryIndex));
      searchParams.delete('_path');
      const cleanQuery = searchParams.toString();
      if (cleanQuery) {
        url = `${url}?${cleanQuery}`;
      }
    } catch (_) {}
  }

  req.url = url;
  return app(req, res);
}
