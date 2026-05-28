const env = require('../config/env');
const { AppError } = require('../utils/errors');
const { buildUrl, requestJson } = require('../utils/http');

function unwrapCollection(data, fallbackKey) {
  if (!data) {
    return [];
  }

  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data.data)) {
    return data.data;
  }

  if (Array.isArray(data[fallbackKey])) {
    return data[fallbackKey];
  }

  if (Array.isArray(data.items)) {
    return data.items;
  }

  return [];
}

function unwrapEntity(data) {
  if (!data || Array.isArray(data) || typeof data !== 'object') {
    return data;
  }

  return data.data || data.doctor || data.patient || data.result || data.item || data;
}

function formatTemplate(template, value) {
  return template.includes('%s') ? template.replace('%s', encodeURIComponent(value)) : template;
}

async function listDoctors(timeoutMs = env.httpTimeoutSeconds * 1000) {
  if (!env.medicalRecordsBaseUrl) {
    throw new AppError(500, 'Medical records service is not configured', 'MEDICAL_RECORDS_NOT_CONFIGURED');
  }

  const url = buildUrl(env.medicalRecordsBaseUrl, env.medicalRecordsDoctorsPath);
  const response = await requestJson(url, {
    method: 'GET',
    timeoutMs
  });

  return unwrapCollection(response.data, 'doctors');
}

async function getDoctorById(doctorId, timeoutMs = env.httpTimeoutSeconds * 1000) {
  if (!env.medicalRecordsBaseUrl) {
    throw new AppError(500, 'Medical records service is not configured', 'MEDICAL_RECORDS_NOT_CONFIGURED');
  }

  const directPath = `${env.medicalRecordsDoctorsPath.replace(/\/$/, '')}/${encodeURIComponent(doctorId)}`;

  try {
    const response = await requestJson(buildUrl(env.medicalRecordsBaseUrl, directPath), {
      method: 'GET',
      timeoutMs
    });

    return unwrapEntity(response.data);
  } catch (error) {
    if (error.statusCode !== 404) {
      throw error;
    }
  }

  const doctors = await listDoctors(timeoutMs);
  const doctor = doctors.find((item) => getEntityId(item) === doctorId);

  if (!doctor) {
    throw new AppError(404, 'Doctor not found', 'DOCTOR_NOT_FOUND');
  }

  return doctor;
}

async function getDoctorSchedule(doctorId, date, timeoutMs = env.httpTimeoutSeconds * 1000) {
  if (!env.medicalRecordsBaseUrl) {
    throw new AppError(500, 'Medical records service is not configured', 'MEDICAL_RECORDS_NOT_CONFIGURED');
  }

  const queryDate = date ? { date } : {};
  const endpoints = [
    `${env.medicalRecordsDoctorsPath.replace(/\/$/, '')}/${encodeURIComponent(doctorId)}/schedule`,
    `${env.medicalRecordsDoctorsPath.replace(/\/$/, '')}/${encodeURIComponent(doctorId)}`
  ];

  for (const endpoint of endpoints) {
    try {
      const response = await requestJson(buildUrl(env.medicalRecordsBaseUrl, endpoint, queryDate), {
        method: 'GET',
        timeoutMs
      });

      return unwrapEntity(response.data);
    } catch (error) {
      if (error.statusCode !== 404) {
        throw error;
      }
    }
  }

  const doctor = await getDoctorById(doctorId, timeoutMs);
  return extractSchedule(doctor, date);
}

async function getPatientById(patientId, timeoutMs = env.httpTimeoutSeconds * 1000) {
  if (!env.medicalRecordsBaseUrl) {
    throw new AppError(500, 'Medical records service is not configured', 'MEDICAL_RECORDS_NOT_CONFIGURED');
  }

  const patientPath = formatTemplate(env.medicalRecordsPatientPathTemplate, patientId);
  const response = await requestJson(buildUrl(env.medicalRecordsBaseUrl, patientPath), {
    method: 'GET',
    timeoutMs
  });

  return unwrapEntity(response.data);
}

function getEntityId(entity) {
  if (!entity || typeof entity !== 'object') {
    return null;
  }

  return entity.id || entity._id || entity.doctorId || entity.patientId || null;
}

function getDisplayName(entity) {
  if (!entity || typeof entity !== 'object') {
    return '';
  }

  return entity.name || entity.fullName || [entity.firstName, entity.lastName].filter(Boolean).join(' ');
}

function getDepartment(entity) {
  if (!entity || typeof entity !== 'object') {
    return '';
  }

  return entity.department || entity.dept || entity.specialty || '';
}

function extractSchedule(doctor, date) {
  if (!doctor || typeof doctor !== 'object') {
    return { doctor: null, date, schedule: null };
  }

  return {
    doctor,
    date,
    schedule:
      doctor.schedule ||
      doctor.availability ||
      doctor.availableSlots ||
      doctor.slots ||
      doctor.calendar ||
      null
  };
}

module.exports = {
  listDoctors,
  getDoctorById,
  getDoctorSchedule,
  getPatientById,
  getEntityId,
  getDisplayName,
  getDepartment,
  extractSchedule
};
