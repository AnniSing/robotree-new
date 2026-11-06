import { app } from '../dist-server/app.js';

export default function handler(req, res) {
  // Handle path resolution under Vercel serverless environment
  const matchedPath = req.headers['x-matched-path'];
  if (matchedPath && matchedPath.startsWith('/api')) {
    req.url = matchedPath;
  } else if (req.url && !req.url.startsWith('/api') && !req.url.startsWith('/health')) {
    req.url = `/api${req.url}`;
  }
  return app(req, res);
}
