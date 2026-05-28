const env = require('../config/env');
const { me } = require('../services/authService');
const { AppError } = require('../utils/errors');

function extractToken(req) {
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
    return authHeader.slice(7).trim();
  }

  return null;
}

function normalizeUser(data) {
  if (!data || typeof data !== 'object') {
    return data;
  }

  return {
    id: data.id || data._id || data.userId || data.sub || null,
    email: data.email || null,
    firstName: data.firstName || data.first_name || null,
    lastName: data.lastName || data.last_name || null,
    role: data.role || data.userRole || null,
    raw: data
  };
}

async function requireAuth(req, _res, next) {
  try {
    const token = extractToken(req);

    if (!token) {
      throw new AppError(401, 'Authentication required', 'UNAUTHORIZED');
    }

    const user = await me(token);
    req.authToken = token;
    req.user = normalizeUser(user);
    next();
  } catch (error) {
    next(error);
  }
}

module.exports = {
  requireAuth,
  extractToken,
  normalizeUser
};
