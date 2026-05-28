const { isAppError } = require('../utils/errors');

function notFoundHandler(_req, res) {
  res.status(404).json({
    success: false,
    error: 'NOT_FOUND',
    message: 'Route not found'
  });
}

function errorHandler(error, _req, res, _next) {
  if (res.headersSent) {
    return;
  }

  if (isAppError(error)) {
    res.status(error.statusCode).json({
      success: false,
      error: error.code,
      message: error.message,
      details: error.details || undefined
    });
    return;
  }

  if (error.type === 'entity.parse.failed') {
    res.status(400).json({
      success: false,
      error: 'INVALID_JSON',
      message: 'Invalid JSON payload'
    });
    return;
  }

  res.status(500).json({
    success: false,
    error: 'INTERNAL_SERVER_ERROR',
    message: error.message || 'Internal Server Error'
  });
}

module.exports = {
  notFoundHandler,
  errorHandler
};
