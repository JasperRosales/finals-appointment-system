const env = require('../config/env');
const { AppError } = require('../utils/errors');
const { buildUrl, requestJson } = require('../utils/http');

function authHeaders(token) {
  const headers = {};

  if (token) {
    headers.Authorization = `Bearer ${token}`;
    headers.Cookie = `${env.authCookieName}=${token}`;
  }

  return headers;
}

async function register(payload, timeoutMs = env.httpTimeoutSeconds * 1000) {
  const url = buildUrl(env.authBaseUrl, '/api/auth/register');
  const response = await requestJson(url, {
    method: 'POST',
    body: payload,
    timeoutMs
  });

  return response.data;
}

async function login(payload, timeoutMs = env.httpTimeoutSeconds * 1000) {
  const url = buildUrl(env.authBaseUrl, '/api/auth/login');
  const response = await requestJson(url, {
    method: 'POST',
    body: payload,
    timeoutMs
  });

  const token = response.data && typeof response.data === 'object' ? response.data.token : null;

  if (!token) {
    throw new AppError(502, 'Auth service did not return a token', 'AUTH_TOKEN_MISSING');
  }

  return {
    ...response.data,
    token
  };
}

async function me(token, timeoutMs = env.httpTimeoutSeconds * 1000) {
  const url = buildUrl(env.authBaseUrl, '/api/auth/me');
  const response = await requestJson(url, {
    method: 'GET',
    headers: authHeaders(token),
    timeoutMs
  });

  return response.data;
}

async function logout(token, timeoutMs = env.httpTimeoutSeconds * 1000) {
  const url = buildUrl(env.authBaseUrl, '/api/auth/logout');
  const response = await requestJson(url, {
    method: 'POST',
    headers: authHeaders(token),
    timeoutMs
  });

  return response.data;
}

module.exports = {
  register,
  login,
  me,
  logout
};
