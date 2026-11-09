import helmet from 'helmet';
import { Request, Response, NextFunction } from 'express';
import { isProduction } from '../config/env.js';

export const securityHeaders = [
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'",
          'https://checkout.razorpay.com',
        ],
        styleSrc: [
          "'self'",
          "'unsafe-inline'",
          'https://fonts.googleapis.com',
        ],
        fontSrc: ["'self'", 'https://fonts.gstatic.com'],
        imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
        frameSrc: [
          "'self'",
          'https://api.razorpay.com',
          'https://maps.google.com',
          'https://www.google.com',
        ],
        connectSrc: ["'self'", 'https://api.razorpay.com'],
        objectSrc: ["'none'"],
        baseUri: ["'self'"],
        formAction: ["'self'"],
        frameAncestors: ["'none'"],
        manifestSrc: ["'self'"],
        workerSrc: ["'self'", 'blob:'],
        upgradeInsecureRequests: isProduction ? [] : null,
      },
    },
    hsts: {
      maxAge: 63072000,
      includeSubDomains: true,
      preload: true,
    },
    frameguard: { action: 'deny' },
    crossOriginOpenerPolicy: { policy: 'same-origin' },
    crossOriginResourcePolicy: { policy: 'same-origin' },
    crossOriginEmbedderPolicy: false,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    xssFilter: false,
    hidePoweredBy: true,
    noSniff: true,
    permittedCrossDomainPolicies: { permittedPolicies: 'none' },
    dnsPrefetchControl: { allow: false },
  }),
  (req: Request, res: Response, next: NextFunction) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader(
      'Permissions-Policy',
      'geolocation=(), microphone=(), camera=(), payment=(self), usb=(), magnetometer=(), gyroscope=(), accelerometer=(), fullscreen=(self)'
    );
    res.removeHeader('X-Powered-By');
    next();
  },
];
