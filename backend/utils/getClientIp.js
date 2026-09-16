/**
 * Extract client IP address from request, prioritizing X-Forwarded-For (Vercel / Proxies)
 * @param {import('express').Request} req
 * @returns {string} Clean client IP address
 */
const getClientIp = (req) => {
  if (!req) return '';
  const forwarded = req.headers && req.headers['x-forwarded-for'];
  if (forwarded) {
    return forwarded.split(',')[0].trim().replace(/^::ffff:/, '');
  }
  const rawIp = req.clientIp || req.socket?.remoteAddress || req.ip || '';
  return String(rawIp).replace(/^::ffff:/, '');
};

module.exports = getClientIp;
