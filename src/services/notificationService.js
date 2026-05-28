const env = require('../config/env');
const { AppError } = require('../utils/errors');
const { buildUrl, requestJson } = require('../utils/http');

function requireNotificationConfig() {
  if (!env.notificationBaseUrl) {
    throw new AppError(500, 'Notification service is not configured', 'NOTIFICATION_NOT_CONFIGURED');
  }
}

async function sendNotification(token, payload, timeoutMs = env.httpTimeoutSeconds * 1000) {
  requireNotificationConfig();

  const response = await requestJson(buildUrl(env.notificationBaseUrl, env.notificationPath), {
    method: 'POST',
    headers: authHeaders(token),
    body: payload,
    timeoutMs
  });

  return response.data;
}

function authHeaders(token) {
  const headers = {};

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return headers;
}

module.exports = {
  sendNotification
};
