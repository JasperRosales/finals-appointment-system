const dotenv = require('dotenv');

dotenv.config();

function toNumber(value, fallback) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function toBoolean(value, fallback = false) {
  if (value === undefined || value === null || value === '') {
    return fallback;
  }

  return ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase());
}

const env = {
  port: toNumber(process.env.PORT, 8080),
  host: process.env.HOST || '0.0.0.0',
  nodeEnv: process.env.NODE_ENV || 'development',
  authBaseUrl: process.env.AUTH_BASE_URL || 'https://has-auth.onrender.com',
  medicalRecordsBaseUrl: process.env.MEDICAL_RECORDS_BASE_URL || '',
  notificationBaseUrl: process.env.NOTIFICATION_BASE_URL || '',
  adapterBaseUrl: process.env.ADAPTER_URL || process.env.ADAPTER_BASE_URL || '',
  httpTimeoutSeconds: toNumber(process.env.HTTP_TIMEOUT_SECONDS, 10),
  medicalRecordsDoctorsPath: process.env.MEDICAL_RECORDS_DOCTORS_PATH || '/doctors',
  medicalRecordsPatientPathTemplate:
    process.env.MEDICAL_RECORDS_PATIENT_PATH_TEMPLATE || '/patients/%s',
  notificationPath: process.env.NOTIFICATION_PATH || '/api/notify',
  adapterAppointmentGetPathTemplate:
    process.env.ADAPTER_APPOINTMENTS_GET_PATH_TEMPLATE || '/api/adapter/appointments/%s',
  adapterAppointmentPatientPathTemplate:
    process.env.ADAPTER_APPOINTMENTS_PATIENT_PATH_TEMPLATE ||
    '/api/adapter/appointments/patient/%s',
  adapterAppointmentDoctorPathTemplate:
    process.env.ADAPTER_APPOINTMENTS_DOCTOR_PATH_TEMPLATE ||
    '/api/adapter/appointments/doctor/%s',
  adapterAppointmentsCreatePath:
    process.env.ADAPTER_APPOINTMENTS_CREATE_PATH || '/api/adapter/appointments/create',
  adapterAppointmentsUpdatePathTemplate:
    process.env.ADAPTER_APPOINTMENTS_UPDATE_PATH_TEMPLATE || '/api/adapter/appointments/%s',
  adapterAppointmentsCancelPathTemplate:
    process.env.ADAPTER_APPOINTMENTS_CANCEL_PATH_TEMPLATE || '/api/adapter/appointments/%s/cancel'
};

module.exports = env;
