import { app } from '../dist-server/app.js';

export default function handler(req, res) {
  // Preserve original /api/* path under Vercel serverless rewrites without clobbering with /api/index.js
  let url = req.url || '/api';

  const forwardedUri = req.headers['x-forwarded-uri'] || req.headers['x-invoke-path'];
  if ((url === '/api/index.js' || url.startsWith('/api/index.js?')) && typeof forwardedUri === 'string' && forwardedUri.startsWith('/api')) {
    url = forwardedUri;
  } else if (url.startsWith('/api/index.js')) {
    const suffix = url.slice('/api/index.js'.length);
    url = suffix.startsWith('/') ? `/api${suffix}` : `/api${suffix ? `/${suffix}` : ''}`;
  }

  if (!url.startsWith('/api') && !url.startsWith('/health')) {
    url = `/api${url.startsWith('/') ? url : `/${url}`}`;
  }

  req.url = url;
  return app(req, res);
}
