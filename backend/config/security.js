const helmet = require('helmet');
const cors = require('cors');
const getClientIp = require('../utils/getClientIp');

/**
 * Helmet Security Headers Configuration
 * Enforces CSP, HSTS, frameguard, and referrer policies
 */
const helmetMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://apis.google.com", "https://vercel.live"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://cdnjs.cloudflare.com"],
      imgSrc: ["'self'", "data:", "https://res.cloudinary.com"],
      connectSrc: ["'self'", "http://localhost:5000", "https://*.vercel.app", "https://vercel.live", "wss://ws-us3.pusher.com"],
      fontSrc: ["'self'", "data:", "https://fonts.gstatic.com", "https://cdnjs.cloudflare.com"],
      frameAncestors: ["'none'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"]
    },
  },
  crossOriginEmbedderPolicy: { policy: "require-corp" }, 
  crossOriginResourcePolicy: { policy: "cross-origin" },
  crossOriginOpenerPolicy: { policy: "same-origin" },
  frameguard: { action: 'deny' },
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  hsts: { maxAge: 31536000, includeSubDomains: true, preload: true },
  xContentTypeOptions: true
});

/**
 * Dynamic CORS Configuration
 * Allows configured frontend URL, Vercel deployments, and local development ports
 */
const allowedOrigins = [
  process.env.FRONTEND_URL,
  ...(process.env.ALLOWED_ORIGIN ? process.env.ALLOWED_ORIGIN.split(',').map((s) => s.trim()) : []),
  'https://verifitor-frontend.vercel.app',
  'http://localhost:3000',
  'http://localhost:5173'
].filter(Boolean);

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    const isAllowed = allowedOrigins.includes(origin) || 
                      origin.endsWith('.vercel.app') ||
                      origin.includes('localhost') || 
                      origin.includes('127.0.0.1');

    if (isAllowed) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Accept', 'Content-Type', 'Authorization', 'ngrok-skip-browser-warning']
};

const corsMiddleware = cors(corsOptions);

/**
 * Client IP Extraction Middleware
 * Normalizes client IP across Vercel, proxies, and localhost
 */
const clientIpMiddleware = (req, res, next) => {
  req.clientIp = getClientIp(req);
  next();
};

module.exports = {
  helmetMiddleware,
  corsOptions,
  corsMiddleware,
  clientIpMiddleware
};
