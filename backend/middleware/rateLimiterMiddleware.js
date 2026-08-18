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

const LoginLockout = require('../models/LoginLockout');

// 2. Custom Progressive Rate Limiter for Login (Persistent)
const loginProgressiveLimiter = async (req, res, next) => {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const now = Date.now();

  try {
    let attempt = await LoginLockout.findOne({ ip });

    if (!attempt) {
      attempt = await LoginLockout.create({ ip, failures: 0, lockedUntil: null });
    }

    // Check if IP is currently locked out
    if (attempt.lockedUntil && now < attempt.lockedUntil.getTime()) {
      // User is locked out but tried again -> Penalize further by incrementing failures
      attempt.failures += 1;
      attempt.lastAttempt = now;
      applyLockout(attempt, now); // Re-apply lock out logic with new failure count
      await attempt.save();
      
      const remainingTime = Math.ceil((attempt.lockedUntil.getTime() - now) / 1000);
      return res.status(429).json({
        success: false,
        message: `Too many failed login attempts. Try again in ${remainingTime} seconds.`
      });
    }

    // If lock time passed, clear the lock but keep failure count
    if (attempt.lockedUntil && now >= attempt.lockedUntil.getTime()) {
      attempt.lockedUntil = null;
      await attempt.save();
    }

    // Intercept the response finish event to check status code
    res.on('finish', async () => {
      const statusCode = res.statusCode;

      try {
        if (statusCode === 200 || statusCode === 201) {
          // Successful login resets the counter
          await LoginLockout.deleteOne({ ip });
        } else if (statusCode === 400 || statusCode === 401 || statusCode === 403 || statusCode === 404) {
          // Failed login attempt
          const currentAttempt = await LoginLockout.findOne({ ip });
          if (currentAttempt) {
            currentAttempt.failures += 1;
            currentAttempt.lastAttempt = Date.now();
            applyLockout(currentAttempt, Date.now());
            await currentAttempt.save();
          }
        }
      } catch (err) {
        console.error('Error updating LoginLockout on finish:', err);
      }
    });

    next();
  } catch (error) {
    console.error('Login rate limiter error:', error);
    next(); // Proceed anyway if DB fails
  }
};

function applyLockout(attempt, now) {
  if (attempt.failures >= 10) {
    // 30 min lockout
    attempt.lockedUntil = new Date(now + 30 * 60 * 1000);
  } else if (attempt.failures >= 8) {
    // 5 min lockout
    attempt.lockedUntil = new Date(now + 5 * 60 * 1000);
  } else if (attempt.failures >= 5) {
    // 3 min lockout
    attempt.lockedUntil = new Date(now + 3 * 60 * 1000);
  }
}

module.exports = {
  registerLimiter,
  loginProgressiveLimiter
};
