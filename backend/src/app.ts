import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { env, isProduction } from './config/env.js';
import { securityHeaders } from './middleware/securityHeaders.js';
import { requestLogger } from './middleware/requestLogger.js';
import { sameOriginGuard, csrfGuard } from './middleware/csrf.js';
import { errorHandler } from './middleware/errorHandler.js';
import { createApiRouter } from './routes/index.js';
import { COURSES_CATALOG } from './services/CourseService.js';
import { hashPassword, verifyPassword, sanitizeValue } from './security/hasher.js';
import { Logger } from './telemetry/logger.js';
import { PROJECT_ROOT } from './utils/paths.js';
const DIST_DIR = path.join(PROJECT_ROOT, 'dist');
const STATIC_DIR = fs.existsSync(DIST_DIR) ? DIST_DIR : PROJECT_ROOT;
const INDEX_FILE = fs.existsSync(path.join(STATIC_DIR, 'index.html'))
  ? path.join(STATIC_DIR, 'index.html')
  : path.join(PROJECT_ROOT, 'index.html');

export function createApp(): Express {
  const app = express();

  // Configure reverse proxy IP trust (Nginx, Cloudflare, AWS ALB) for accurate client IP resolution
  app.set('trust proxy', 1);

  // 1. Structured Request Telemetry & Request ID
  app.use(requestLogger);

  // 2. Enterprise Security Headers (Helmet, CSP, HSTS, X-Content-Type-Options, Frameguard)
  app.use(securityHeaders);

  // 3. CORS configuration
  const allowedOrigins = env.ALLOWED_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean);
  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
        } else if (!isProduction && origin.endsWith('.vercel.app')) {
          callback(null, true);
        } else if (!isProduction) {
          const isLoopback = /^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0)(:\d+)?$/.test(origin);
          callback(null, isLoopback);
        } else {
          callback(null, false);
        }
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'X-Request-Id'],
      maxAge: 600,
    })
  );

  // 4. Request Body Parsers & Cookie Parser
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(cookieParser());

  // 5. CSRF & Same-Origin Protection on all /api routes
  app.use('/api', sameOriginGuard);
  app.use('/api', csrfGuard);

  // 6. Mount Master API Router (/api/v1 and /api aliases)
  app.use('/api', createApiRouter());

  // 6.5. System Resource Protection: Block unauthorized probing of server data, hidden files, source files, and traversal
  app.use((req: Request, res: Response, next: NextFunction) => {
    const rawPath = req.path || '';
    let decoded = '';
    try {
      decoded = decodeURIComponent(rawPath).toLowerCase();
    } catch {
      res.status(400).json({ success: false, error: 'BAD_REQUEST', message: 'Malformed URI encoding.' });
      return;
    }

    // Directory traversal attempt
    if (decoded.includes('..') || rawPath.includes('..')) {
      res.status(403).json({ success: false, error: 'FORBIDDEN', message: 'Access denied: Directory traversal forbidden.' });
      return;
    }

    // Block hidden files/directories (.env, .git, etc.)
    if (/(?:^|\/)\.[a-zA-Z0-9_\-]+/.test(decoded)) {
      res.status(403).json({ success: false, error: 'FORBIDDEN', message: 'Access to hidden resources is prohibited.' });
      return;
    }

    // Block direct access to server data, source code, tests, configuration, or database files
    const isSensitiveFolder = /^\/(data|backend|tests|scratch|migrations|dist-server|node_modules|scripts)(\/|$)/.test(decoded);
    const isSensitiveExt = /\.(env|json|ts|sql|yml|yaml|lock|log|sh|bat|cmd|conf|ini|bak)$/.test(decoded);
    const isSensitiveRootFile = /^\/(package\.json|package-lock\.json|tsconfig\.json|docker-compose\.yml|dockerfile|server\.js)$/.test(decoded);

    if (isSensitiveFolder || isSensitiveExt || isSensitiveRootFile) {
      res.status(403).json({ success: false, error: 'FORBIDDEN', message: 'Access denied: Protected system resource.' });
      return;
    }

    next();
  });

  // 7. Static Asset Serving
  const immutableStaticOptions = {
    maxAge: isProduction ? '365d' : '0',
    immutable: isProduction,
    setHeaders: (res: Response) => {
      res.setHeader('X-Content-Type-Options', 'nosniff');
      if (isProduction) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      } else {
        res.setHeader('Cache-Control', 'no-cache');
      }
    },
  };

  if (fs.existsSync(path.join(STATIC_DIR, 'assets'))) {
    app.use('/assets', express.static(path.join(STATIC_DIR, 'assets'), immutableStaticOptions));
  }
  app.use('/assets', express.static(path.join(PROJECT_ROOT, 'assets'), immutableStaticOptions));

  ['styles.css', 'script.js', 'security.js', 'icons.js', 'certificate.js'].forEach((fileName) => {
    app.get(`/${fileName}`, (req: Request, res: Response) => {
      res.setHeader('Cache-Control', isProduction ? 'public, max-age=3600, must-revalidate' : 'no-cache');
      res.sendFile(path.join(PROJECT_ROOT, fileName));
    });
  });

  // Explicit HTML Page Routes (both with and without .html extension)
  const HTML_PAGES = [
    'index', 'about', 'team', 'courses', 'services', 'gallery', 
    'certificate', 'contact', 'admin', 'privacy', 'terms', 
    'employee', 'employee-login', 'store'
  ];
  HTML_PAGES.forEach((page) => {
    const distPath = path.join(STATIC_DIR, `${page}.html`);
    const rootPath = path.join(PROJECT_ROOT, `${page}.html`);
    const filePath = fs.existsSync(distPath) ? distPath : rootPath;
    if (fs.existsSync(filePath)) {
      const handler = (req: Request, res: Response) => {
        res.setHeader('Cache-Control', isProduction ? 'public, max-age=3600, must-revalidate' : 'no-cache');
        res.sendFile(filePath);
      };
      app.get(`/${page}.html`, handler);
      if (page !== 'index') {
        app.get(`/${page}`, handler);
      }
    }
  });

  // Mount Certificate Generator if present
  const certGenPublic = path.join(PROJECT_ROOT, 'certificate-generator', 'public');
  if (fs.existsSync(certGenPublic)) {
    app.use('/cert-gen', express.static(certGenPublic));
    app.use('/css', express.static(path.join(certGenPublic, 'css')));
    app.use('/js', express.static(path.join(certGenPublic, 'js')));
    app.get('/certificate.jpeg', (req: Request, res: Response) => res.sendFile(path.join(certGenPublic, 'certificate.jpeg')));
    app.get('/certificate.png', (req: Request, res: Response) => res.sendFile(path.join(certGenPublic, 'certificate.png')));
    app.get(['/workshop-cert', '/generator', '/certificate-generator'], (req: Request, res: Response) => {
      res.sendFile(path.join(PROJECT_ROOT, 'certificate-generator', 'views', 'index.html'));
    });
  }

  // Official PDF Brochure & Proposal Downloads
  app.get(['/api/brochures/junior-innovation-lab', '/brochures/junior-innovation-lab.pdf', '/proposal/junior-innovation-lab.pdf'], (req: Request, res: Response) => {
    const pdfPath = path.join(PROJECT_ROOT, 'assets', 'brochures', 'robotree_junior_innovation_lab_proposal.pdf');
    if (fs.existsSync(pdfPath)) {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="Robotree_Junior_Innovation_Lab_Proposal.pdf"');
      res.sendFile(pdfPath);
    } else {
      res.status(404).json({ success: false, message: 'Proposal document not found.' });
    }
  });

  app.get(['/api/brochures/corporate-training', '/brochures/corporate-training.pdf', '/brochures/training-placement.pdf'], (req: Request, res: Response) => {
    const pdfPath = path.join(PROJECT_ROOT, 'assets', 'brochures', 'robotree_corporate_training_placement_brochure.pdf');
    if (fs.existsSync(pdfPath)) {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename="Robotree_Training_and_Placement_Brochure.pdf"');
      res.sendFile(pdfPath);
    } else {
      res.status(404).json({ success: false, message: 'Training brochure not found.' });
    }
  });

  // Fallback for root or frontend SPA routes
  app.get(/^.*$/, (req: Request, res: Response) => {
    res.setHeader('Cache-Control', 'no-cache');
    res.sendFile(INDEX_FILE);
  });

  // 8. Centralized Central Error Handler
  app.use(errorHandler);

  return app;
}

export const app = createApp();
export { COURSES_CATALOG, hashPassword, verifyPassword, sanitizeValue };

export function startServer(port = env.PORT, host = env.HOST) {
  const server = app.listen(port, host, () => {
    Logger.info(`Robotree Enterprise Server started on http://${host}:${port}`, {
      details: { environment: env.NODE_ENV, port, host },
    });
  });

  const gracefulShutdown = (signal: string) => {
    Logger.info(`Received ${signal}. Shutting down gracefully...`);
    server.close(() => {
      Logger.info('HTTP server closed. Exiting process.');
      process.exit(0);
    });
    setTimeout(() => {
      Logger.error('Forced shutdown due to timeout.');
      process.exit(1);
    }, 10000).unref();
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  return server;
}
