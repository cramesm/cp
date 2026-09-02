const rateLimit = require('express-rate-limit');

// Global rate limiter
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 2000, // Limit each IP to 2000 requests per `window` to allow dashboard polling and standard usage
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    message: 'Too many requests from this IP, please try again after 15 minutes'
});

// Stricter limiter for sensitive routes (e.g., login, auth)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // Limit each IP to 10 requests per `window` for auth routes
    standardHeaders: true,
    legacyHeaders: false,
    message: 'Too many authentication attempts, please try again later'
});

module.exports = {
    globalLimiter,
    authLimiter
};
