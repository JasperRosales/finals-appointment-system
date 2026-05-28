const env = require('../config/env');
const { AppError } = require('../utils/errors');
const { buildUrl, requestJson } = require('../utils/http');

function requireAdapterConfig() {
  if (!env.adapterBaseUrl) {
    throw new AppError(500, 'Adapter service is not configured', 'ADAPTER_NOT_CONFIGURED');
  }
}

function buildLegacyPayload(appointment) {
  return {
    patientId: pick(appointment, 'patient_id', 'patientId'),
    doctorName: pick(appointment, 'doctor_name', 'doctorName'),
    department: appointment.department || null,
    appointmentDate: pick(appointment, 'appointment_date', 'appointmentDate'),
    appointmentStatus: appointment.status || appointment.appointmentStatus || null,
    legacyAppointmentId: pick(appointment, 'legacy_id', 'legacyId', 'id'),
    patientEmail: pick(appointment, 'patient_email', 'patientEmail') || null,
    patientName: pick(appointment, 'patient_name', 'patientName') || null,
    doctorId: pick(appointment, 'doctor_id', 'doctorId') || null,
    notes: appointment.notes || null
  };
}

async function createLegacyAppointment(appointment, token, timeoutMs = env.httpTimeoutSeconds * 1000) {
  requireAdapterConfig();

  const response = await requestJson(buildUrl(env.adapterBaseUrl, env.adapterAppointmentsCreatePath), {
    method: 'POST',
    headers: authHeaders(token),
    body: buildLegacyPayload(appointment),
    timeoutMs
  });

  return response.data;
}

async function getLegacyAppointmentById(appointmentId, token, timeoutMs = env.httpTimeoutSeconds * 1000) {
  requireAdapterConfig();

  const path = formatTemplate(env.adapterAppointmentGetPathTemplate, appointmentId);
  const response = await requestJson(buildUrl(env.adapterBaseUrl, path), {
    method: 'GET',
    headers: authHeaders(token),
    timeoutMs
  });

  return response.data;
}

async function listLegacyAppointmentsByPatient(patientId, token, timeoutMs = env.httpTimeoutSeconds * 1000) {
  requireAdapterConfig();

  const path = formatTemplate(env.adapterAppointmentPatientPathTemplate, patientId);
  const response = await requestJson(buildUrl(env.adapterBaseUrl, path), {
    method: 'GET',
    headers: authHeaders(token),
    timeoutMs
  });

  return response.data;
}

async function listLegacyAppointmentsByDoctorAndDate(
  doctorId,
  date,
  token,
  timeoutMs = env.httpTimeoutSeconds * 1000
) {
  requireAdapterConfig();

  const path = formatTemplate(env.adapterAppointmentDoctorPathTemplate, doctorId);
  const response = await requestJson(buildUrl(env.adapterBaseUrl, path, { date }), {
    method: 'GET',
    headers: authHeaders(token),
    timeoutMs
  });

  return response.data;
}

async function updateLegacyAppointment(appointment, token, timeoutMs = env.httpTimeoutSeconds * 1000) {
  requireAdapterConfig();

  const legacyId = appointment.legacy_id || appointment.id;
  const path = formatTemplate(env.adapterAppointmentsUpdatePathTemplate, legacyId);

  const response = await requestJson(buildUrl(env.adapterBaseUrl, path), {
    method: 'PATCH',
    headers: authHeaders(token),
    body: buildLegacyPayload(appointment),
    timeoutMs
  });

  return response.data;
}

async function cancelLegacyAppointment(appointment, token, timeoutMs = env.httpTimeoutSeconds * 1000) {
  requireAdapterConfig();

  const legacyId = appointment.legacy_id || appointment.id;
  const path = formatTemplate(env.adapterAppointmentsCancelPathTemplate, legacyId);

  const response = await requestJson(buildUrl(env.adapterBaseUrl, path), {
    method: 'PATCH',
    headers: authHeaders(token),
    body: buildLegacyPayload({
      ...appointment,
      status: 'cancelled'
    }),
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

function formatTemplate(template, value) {
  return template.includes('%s') ? template.replace('%s', encodeURIComponent(value)) : template;
}

function pick(source, ...keys) {
  for (const key of keys) {
    if (source[key] !== undefined && source[key] !== null) {
      return source[key];
    }
  }

  return null;
}

module.exports = {
  createLegacyAppointment,
  getLegacyAppointmentById,
  listLegacyAppointmentsByPatient,
  listLegacyAppointmentsByDoctorAndDate,
  updateLegacyAppointment,
  cancelLegacyAppointment
};
