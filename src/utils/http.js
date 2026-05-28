const { AppError } = require('./errors');

async function requestJson(url, options = {}) {
  const {
    method = 'GET',
    headers = {},
    body,
    timeoutMs = 10000
  } = options;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  const requestHeaders = { ...headers };
  let requestBody = body;

  if (body && typeof body !== 'string' && !(body instanceof Buffer)) {
    requestHeaders['Content-Type'] = requestHeaders['Content-Type'] || 'application/json';
    requestBody = JSON.stringify(body);
  }

  try {
    const response = await fetch(url, {
      method,
      headers: requestHeaders,
      body: requestBody,
      signal: controller.signal
    });

    const text = await response.text();
    const data = text ? safeJsonParse(text) : null;

    if (!response.ok) {
      throw new AppError(
        response.status >= 500 ? 502 : response.status,
        extractMessage(data, text, response.statusText),
        'DEPENDENCY_REQUEST_FAILED',
        { url, status: response.status, data }
      );
    }

    return {
      status: response.status,
      ok: response.ok,
      data,
      headers: response.headers
    };
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new AppError(502, 'Request timed out', 'DEPENDENCY_TIMEOUT', { url });
    }

    if (error instanceof AppError) {
      throw error;
    }

    throw new AppError(502, error.message, 'DEPENDENCY_REQUEST_FAILED', { url });
  } finally {
    clearTimeout(timeout);
  }
}

function safeJsonParse(value) {
  try {
    return JSON.parse(value);
  } catch (_error) {
    return value;
  }
}

function extractMessage(data, fallback, statusText) {
  if (data && typeof data === 'object') {
    return data.message || data.error || statusText || fallback || 'Request failed';
  }

  if (typeof data === 'string' && data.trim()) {
    return data;
  }

  return statusText || fallback || 'Request failed';
}

function buildUrl(baseUrl, path, query = {}) {
  const url = new URL(path, ensureTrailingSlash(baseUrl));

  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value));
    }
  }

  return url.toString();
}

function ensureTrailingSlash(value) {
  return value.endsWith('/') ? value : `${value}/`;
}

module.exports = {
  requestJson,
  buildUrl
};
