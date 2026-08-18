const rateLimit = require('express-rate-limit');

// 1. Standard Rate Limiter for Registration
// 10 requests per hour
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, 
  max: 10,
  message: {
    success: false,
    message: 'Too many accounts created from this IP, please try again after an hour'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// 2. Custom Progressive Rate Limiter for Login
// Store in memory: { [ip]: { failures: number, lockedUntil: number } }
const loginAttempts = {};

const loginProgressiveLimiter = (req, res, next) => {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const now = Date.now();

  if (!loginAttempts[ip]) {
    loginAttempts[ip] = { failures: 0, lockedUntil: null };
  }

  const attempt = loginAttempts[ip];

  // Check if IP is currently locked out
  if (attempt.lockedUntil && now < attempt.lockedUntil) {
    // User is locked out but tried again -> Penalize further by incrementing failures
    attempt.failures += 1;
    applyLockout(attempt, now); // Re-apply lock out logic with new failure count
    
    const remainingTime = Math.ceil((attempt.lockedUntil - now) / 1000);
    return res.status(429).json({
      success: false,
      message: `Too many failed login attempts. Try again in ${remainingTime} seconds.`
    });
  }

  // If lock time passed, clear the lock but keep failure count? 
  // No, if lock expired, we let them try again. If they fail, it increments from previous.
  // Actually, standard behavior usually resets or halves it, but we'll leave failures intact to ensure progression.
  if (attempt.lockedUntil && now >= attempt.lockedUntil) {
    attempt.lockedUntil = null;
  }

  // Intercept the response finish event to check status code
  res.on('finish', () => {
    const statusCode = res.statusCode;

    if (statusCode === 200 || statusCode === 201) {
      // Successful login resets the counter
      delete loginAttempts[ip];
    } else if (statusCode === 400 || statusCode === 401 || statusCode === 403 || statusCode === 404) {
      // Failed login attempt
      if (loginAttempts[ip]) {
        loginAttempts[ip].failures += 1;
        applyLockout(loginAttempts[ip], Date.now());
      }
    }
  });

  next();
};

function applyLockout(attempt, now) {
  if (attempt.failures >= 10) {
    // 30 min lockout
    attempt.lockedUntil = now + 30 * 60 * 1000;
  } else if (attempt.failures >= 8) {
    // 5 min lockout
    attempt.lockedUntil = now + 5 * 60 * 1000;
  } else if (attempt.failures >= 5) {
    // 3 min lockout
    attempt.lockedUntil = now + 3 * 60 * 1000;
  }
}

module.exports = {
  registerLimiter,
  loginProgressiveLimiter
};
