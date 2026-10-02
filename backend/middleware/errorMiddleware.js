/**
 * Centralized Error Handling Middleware for VeriFitor API
 * 
 * This module defines all standard HTTP error statuses, provides custom error classes,
 * handles unhandled 404 routes, and intercepts all operational and runtime errors
 * across Express routes and async controllers.
 */

// ============================================================================
// 1. HTTP ERROR STATUS CODES & DESCRIPTIONS DICTIONARY
// ============================================================================
const HTTP_ERROR_STATUSES = {
  // 4xx Client Errors
  400: {
    code: 400,
    status: 'Bad Request',
    description: 'The server cannot process the request due to invalid syntax, missing fields, or failed validation.'
  },
  401: {
    code: 401,
    status: 'Unauthorized',
    description: 'Authentication is required and has failed, or token is missing, invalid, or expired.'
  },
  403: {
    code: 403,
    status: 'Forbidden',
    description: 'The authenticated user does not have permission or role clearance for this resource.'
  },
  404: {
    code: 404,
    status: 'Not Found',
    description: 'The server cannot find the requested resource or route.'
  },
  405: {
    code: 405,
    status: 'Method Not Allowed',
    description: 'The HTTP method used is not supported for this endpoint.'
  },
  408: {
    code: 408,
    status: 'Request Timeout',
    description: 'The server timed out waiting for the request.'
  },
  409: {
    code: 409,
    status: 'Conflict',
    description: 'The request conflicts with the current state of the resource (e.g. duplicate email, employee ID).'
  },
  413: {
    code: 413,
    status: 'Payload Too Large',
    description: 'The request entity or file upload is larger than limits defined by the server.'
  },
  415: {
    code: 415,
    status: 'Unsupported Media Type',
    description: 'The requested payload format or uploaded file mime type is not supported.'
  },
  422: {
    code: 422,
    status: 'Unprocessable Entity',
    description: 'The request was well-formed but failed semantic business logic or validation.'
  },
  429: {
    code: 429,
    status: 'Too Many Requests',
    description: 'The user has sent too many requests in a given amount of time (rate limit or lockout).'
  },

  // 5xx Server Errors
  500: {
    code: 500,
    status: 'Internal Server Error',
    description: 'The server encountered an unexpected condition that prevented it from fulfilling the request.'
  },
  501: {
    code: 501,
    status: 'Not Implemented',
    description: 'The server does not support the functionality required to fulfill the request.'
  },
  502: {
    code: 502,
    status: 'Bad Gateway',
    description: 'The server received an invalid response from an upstream server (e.g. Besu RPC, Cloudinary).'
  },
  503: {
    code: 503,
    status: 'Service Unavailable',
    description: 'The server is currently unable to handle the request due to database or blockchain downtime.'
  },
  504: {
    code: 504,
    status: 'Gateway Timeout',
    description: 'The server did not receive a timely response from an upstream server.'
  }
};

// ============================================================================
// 2. CUSTOM OPERATIONAL ERROR CLASS
// ============================================================================
class AppError extends Error {
  /**
   * @param {string} message - Human-readable error message
   * @param {number} statusCode - HTTP status code (default: 500)
   * @param {any} details - Additional structured details (e.g. validation error array)
   */
  constructor(message, statusCode = 500, details = null) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Convenience factory helpers
const createError = {
  badRequest: (message = 'Bad Request', details = null) => new AppError(message, 400, details),
  unauthorized: (message = 'Unauthorized') => new AppError(message, 401),
  forbidden: (message = 'Forbidden') => new AppError(message, 403),
  notFound: (message = 'Resource not found') => new AppError(message, 404),
  conflict: (message = 'Resource conflict') => new AppError(message, 409),
  unprocessable: (message = 'Validation failed', details = null) => new AppError(message, 422, details),
  tooManyRequests: (message = 'Too many requests. Please try again later.') => new AppError(message, 429),
  internal: (message = 'Internal server error') => new AppError(message, 500),
  serviceUnavailable: (message = 'Service temporarily unavailable') => new AppError(message, 503)
};

// ============================================================================
// 3. 404 NOT FOUND ROUTE MIDDLEWARE
// ============================================================================
const notFoundHandler = (req, res, next) => {
  const message = `Route not found: Cannot ${req.method} ${req.originalUrl}`;
  next(new AppError(message, 404));
};

// ============================================================================
// 4. CENTRALIZED ERROR HANDLING MIDDLEWARE
// ============================================================================
// Express error middleware requires exactly 4 arguments: (err, req, res, next)
const errorHandler = (err, req, res, next) => {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let details = err.details || null;

  // 1. Mongoose Validation Error (e.g., Schema required fields, enum failure)
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = 'Validation failed';
    details = Object.values(err.errors || {}).map((item) => ({
      field: item.path,
      message: item.message,
      value: item.value
    }));
  }

  // 2. Mongoose Invalid ObjectId (CastError)
  else if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid ID format for parameter: ${err.path}`;
    details = { field: err.path, value: err.value };
  }

  // 3. MongoDB Duplicate Key Error (E11000)
  else if (err.code === 11000) {
    statusCode = 409;
    const duplicateField = Object.keys(err.keyValue || {})[0] || 'record';
    const duplicateValue = err.keyValue ? err.keyValue[duplicateField] : '';
    message = `An account or record with this ${duplicateField} ('${duplicateValue}') already exists.`;
    details = { field: duplicateField, value: duplicateValue };
  }

  // 4. JWT Authentication Errors
  else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid authentication token. Please log in again.';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Authentication token has expired. Please log in again.';
  }

  // 5. Multer File Upload Errors
  else if (err.name === 'MulterError') {
    statusCode = 400;
    if (err.code === 'LIMIT_FILE_SIZE') {
      message = 'Uploaded file exceeds the maximum allowed size limit (10MB).';
    } else {
      message = `Upload error: ${err.message}`;
    }
  }

  // 6. Upstream / Network / Blockchain connection errors
  else if (err.code === 'ECONNREFUSED' || err.code === 'ENOTFOUND') {
    statusCode = 503;
    message = 'Upstream service or blockchain network node is currently unreachable.';
  }

  // Retrieve status metadata
  const statusInfo = HTTP_ERROR_STATUSES[statusCode] || {
    code: statusCode,
    status: statusCode >= 500 ? 'Server Error' : 'Client Error',
    description: message
  };

  // Structured Logging
  const logPrefix = `[API ERROR] [${new Date().toISOString()}]`;
  console.error(`${logPrefix} ${statusCode} ${statusInfo.status} - ${req.method} ${req.originalUrl}`);
  console.error(`Message: ${message}`);
  if (details) {
    console.error(`Details:`, JSON.stringify(details));
  }
  if (statusCode >= 500 && err.stack) {
    console.error(`Stack trace:`, err.stack);
  }

  // Prevent sending headers twice
  if (res.headersSent) {
    return next(err);
  }

  // Unified Error JSON Response
  const responsePayload = {
    success: false,
    status: statusCode,
    error: statusInfo.status,
    message,
    ...(details ? { details } : {}),
    path: req.originalUrl,
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === 'development' ? { stack: err.stack } : {})
  };

  return res.status(statusCode).json(responsePayload);
};

module.exports = {
  HTTP_ERROR_STATUSES,
  AppError,
  createError,
  notFoundHandler,
  errorHandler
};
