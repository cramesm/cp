const AuditLog = require('../models/AuditLog');

const logger = {
  info: async (message, metadata = {}) => {
    try {
      await AuditLog.create({
        level: 'info',
        message,
        metadata,
        method: metadata?.method,
        path: metadata?.path,
        ip: metadata?.ip,
        userEmail: metadata?.email || 'Anonymous',
        statusCode: metadata?.statusCode,
        durationMs: typeof metadata?.metadata?.duration === 'string'
          ? parseInt(metadata.metadata.duration, 10)
          : (typeof metadata?.durationMs === 'number' ? metadata.durationMs : undefined)
      });
      console.log('[AUDIT INFO]', message, metadata);
    } catch (error) {
      console.error('Failed to write info log:', error);
    }
  },

  warn: async (message, metadata = {}) => {
    try {
      await AuditLog.create({
        level: 'warn',
        message,
        metadata,
        method: metadata?.method,
        path: metadata?.path,
        ip: metadata?.ip,
        userEmail: metadata?.email || 'Anonymous',
        statusCode: metadata?.statusCode,
        durationMs: typeof metadata?.metadata?.duration === 'string'
          ? parseInt(metadata.metadata.duration, 10)
          : (typeof metadata?.durationMs === 'number' ? metadata.durationMs : undefined)
      });
      console.log('[AUDIT WARN]', message, metadata);
    } catch (error) {
      console.error('Failed to write warn log:', error);
    }
  },

  error: async (message, metadata = {}) => {
    try {
      await AuditLog.create({
        level: 'error',
        message,
        metadata,
        method: metadata?.method,
        path: metadata?.path,
        ip: metadata?.ip,
        userEmail: metadata?.email || 'Anonymous',
        statusCode: metadata?.statusCode,
        durationMs: typeof metadata?.metadata?.duration === 'string'
          ? parseInt(metadata.metadata.duration, 10)
          : (typeof metadata?.durationMs === 'number' ? metadata.durationMs : undefined)
      });
      console.log('[AUDIT ERROR]', message, metadata);
    } catch (error) {
      console.error('Failed to write error log:', error);
    }
  }
};

const auditLoggerMiddleware = (request, response, next) => {
  const startTime = Date.now();

  const originalSend = response.send;
  response.send = function (data) {
    response.send = originalSend;

    const duration = Date.now() - startTime;

    const clientIp = (request.headers && request.headers['x-forwarded-for'])
      ? request.headers['x-forwarded-for'].split(',')[0].trim()
      : (request.ip || request.connection?.remoteAddress || request.socket?.remoteAddress || '127.0.0.1');

    const logData = {
      method: request.method,
      path: request.originalUrl || request.path,
      ip: clientIp,
      userId: request.user?.id || request.user?._id || null,
      email: request.user?.email || null,
      statusCode: response.statusCode,
      metadata: { duration: `${duration}ms` }
    };

    const message = `${logData.method} ${logData.path} - ${logData.statusCode}`;
    if (response.statusCode >= 500) {
      logger.error(message, logData);
    } else if (response.statusCode >= 400) {
      logger.warn(message, logData);
    } else {
      logger.info(message, logData);
    }

    return response.send(data);
  };

  next();
};

module.exports = auditLoggerMiddleware;
module.exports.logger = logger;
module.exports.auditLoggerMiddleware = auditLoggerMiddleware;

