const { randomUUID } = require('crypto');
const env = require('../config/env');
const { AppError } = require('../utils/errors');
const {
  assertIsoDate,
  isAtLeastOneDayBefore,
  normalizeCalendarDate,
  sameUtcDay,
  toIsoString
} = require('../utils/date');
const {
  getDoctorById,
  getDoctorSchedule,
  getEntityId,
  getDepartment,
  getDisplayName,
  getPatientById,
  listDoctors
} = require('./medicalRecordsService');
const {
  createLegacyAppointment,
  getLegacyAppointmentById,
  listLegacyAppointmentsByPatient,
  listLegacyAppointmentsByDoctorAndDate,
  updateLegacyAppointment,
  cancelLegacyAppointment
} = require('./adapterService');
const { sendNotification } = require('./notificationService');

function getUserId(user) {
  if (!user || typeof user !== 'object') {
    return null;
  }

  return user.id || user._id || user.userId || user.sub || null;
}

function getUserRole(user) {
  if (!user || typeof user !== 'object') {
    return null;
  }

  return user.role || user.userRole || null;
}

function assertPatientOwnership(user, patientId) {
  if (getUserRole(user) === 'patient' && getUserId(user) !== patientId) {
    throw new AppError(403, 'Patients can only manage their own appointments', 'FORBIDDEN');
  }
}

function isDoctorAvailableOnDate(doctor, date) {
  if (!doctor || typeof doctor !== 'object') {
    return false;
  }

  const target = normalizeCalendarDate(date).value;
  const weekday = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][
    target.getUTCDay()
  ];
  const availableDates = doctor.availableDates || doctor.available_dates;

  if (Array.isArray(availableDates) && availableDates.length > 0) {
    return availableDates.some((item) => String(item).startsWith(date));
  }

  const schedule = doctor.schedule || doctor.availability || doctor.availableSlots || doctor.slots;

  if (Array.isArray(schedule) && schedule.length > 0) {
    return schedule.some((entry) => {
      if (!entry) {
        return false;
      }

      if (typeof entry === 'string') {
        return entry.startsWith(date) || entry.toLowerCase() === weekday.toLowerCase();
      }

      const entryDate = entry.date || entry.day || entry.weekday;
      return String(entryDate || '').toLowerCase() === weekday.toLowerCase() || String(entryDate || '').startsWith(date);
    });
  }

  if (schedule && typeof schedule === 'object') {
    return Boolean(schedule[date] || schedule[weekday] || schedule[weekday.toLowerCase()]);
  }

  return true;
}

function extractCollection(data) {
  if (!data) {
    return [];
  }

  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data.data)) {
    return data.data;
  }

  if (Array.isArray(data.appointments)) {
    return data.appointments;
  }

  if (Array.isArray(data.items)) {
    return data.items;
  }

  return [];
}

function normalizeLegacyAppointment(data) {
  const source = data && typeof data === 'object' ? data.data || data.appointment || data.result || data : data;

  if (!source || typeof source !== 'object' || Array.isArray(source)) {
    return null;
  }

  return {
    id: source.id || source._id || source.appointmentId || null,
    patientId: source.patientId || source.patient_id || null,
    patientName: source.patientName || source.patient_name || null,
    patientEmail: source.patientEmail || source.patient_email || null,
    doctorId: source.doctorId || source.doctor_id || null,
    doctorName: source.doctorName || source.doctor_name || source.doctor || null,
    department: source.department || source.dept || null,
    appointmentDate: source.appointmentDate || source.appointment_date || source.date || null,
    status: normalizeStatus(source.status || source.appointmentStatus || source.appointment_status),
    legacyId: source.legacyId || source.legacy_id || source.id || null,
    notes: source.notes || null,
    raw: source
  };
}

function normalizeStatus(value) {
  const status = String(value || '').toLowerCase();

  if (status === 'cancelled' || status === 'canceled') {
    return 'cancelled';
  }

  if (status === 'rescheduled') {
    return 'rescheduled';
  }

  return 'scheduled';
}

function normalizeAppointmentCollection(data) {
  return extractCollection(data)
    .map((item) => normalizeLegacyAppointment(item))
    .filter(Boolean);
}

async function getLegacyAppointmentsForDoctor(doctorId, date, token) {
  return normalizeAppointmentCollection(await listLegacyAppointmentsByDoctorAndDate(doctorId, date, token));
}

async function getLegacyAppointmentContext(appointment, token) {
  const patientId = appointment.patientId || appointment.patient_id;
  const doctorId = appointment.doctorId || appointment.doctor_id;
  const [patient, doctor] = await Promise.all([
    patientId ? getPatientById(patientId).catch(() => null) : Promise.resolve(null),
    doctorId ? getDoctorById(doctorId).catch(() => null) : Promise.resolve(null)
  ]);

  return {
    ...appointment,
    patientId: appointment.patientId || appointment.patient_id || patientId,
    patientName:
      appointment.patientName ||
      appointment.patient_name ||
      getDisplayName(patient) ||
      null,
    patientEmail:
      appointment.patientEmail ||
      appointment.patient_email ||
      patient?.email ||
      patient?.contactEmail ||
      patient?.patientEmail ||
      null,
    doctorId: appointment.doctorId || appointment.doctor_id || doctorId,
    doctorName:
      appointment.doctorName ||
      appointment.doctor_name ||
      getDisplayName(doctor) ||
      null,
    department:
      appointment.department ||
      getDepartment(doctor) ||
      null,
    legacyId: appointment.legacyId || appointment.legacy_id || appointment.id || null
  };
}

function buildNotificationMessage(action, appointment) {
  const readableDate = new Date(appointment.appointmentDate).toUTCString();
  const title =
    action === 'created'
      ? 'Appointment Confirmation'
      : action === 'cancelled'
        ? 'Appointment Cancellation'
        : 'Appointment Rescheduled';

  return {
    senderSystem: 'Online Appointment System',
    recipientEmail: appointment.patientEmail,
    subject: title,
    message:
      action === 'created'
        ? `Your appointment with ${appointment.doctorName} is scheduled for ${readableDate}.`
        : action === 'cancelled'
          ? `Your appointment with ${appointment.doctorName} on ${readableDate} has been cancelled.`
          : `Your appointment with ${appointment.doctorName} has been rescheduled to ${readableDate}.`
  };
}

function buildLegacyCreatePayload(appointment) {
  return {
    patientId: appointment.patientId,
    patientName: appointment.patientName,
    patientEmail: appointment.patientEmail,
    doctorId: appointment.doctorId,
    doctorName: appointment.doctorName,
    department: appointment.department,
    appointmentDate: appointment.appointmentDate,
    appointmentStatus: appointment.status,
    notes: appointment.notes || null
  };
}

function resolveAppointmentResponse(result, fallback) {
  const appointment = normalizeLegacyAppointment(result);

  if (appointment) {
    return appointment;
  }

  return fallback;
}

async function getDoctorScheduleSummary(doctorId, date, token) {
  const doctor = await getDoctorById(doctorId);
  const schedule = await getDoctorSchedule(doctorId, date);
  let bookedAppointments = [];
  let integrationWarnings = [];

  try {
    bookedAppointments = await getLegacyAppointmentsForDoctor(doctorId, date, token);
  } catch (error) {
    integrationWarnings = [error.message];
  }

  return {
    doctor: {
      id: getEntityId(doctor),
      name: getDisplayName(doctor),
      department: getDepartment(doctor),
      raw: doctor,
      schedule: schedule && typeof schedule === 'object' ? schedule.schedule || schedule : schedule
    },
    date,
    schedule: schedule && typeof schedule === 'object' ? schedule.schedule || schedule : schedule,
    bookedAppointments,
    integrationWarnings,
    available: isDoctorAvailableOnDate(doctor, date)
  };
}

async function getAvailableDoctorsByDate(date) {
  const doctors = await listDoctors();

  return doctors.map((doctor) => ({
    doctor: {
      id: getEntityId(doctor),
      name: getDisplayName(doctor),
      department: getDepartment(doctor),
      raw: doctor
    },
    date,
    available: isDoctorAvailableOnDate(doctor, date)
  }));
}

async function createNewAppointment(payload, user, token) {
  const patientId = String(payload.patientId || '').trim();
  const doctorId = String(payload.doctorId || '').trim();
  const appointmentDate = String(payload.appointmentDate || '').trim();

  if (!patientId || !doctorId || !appointmentDate) {
    throw new AppError(400, 'patientId, doctorId, and appointmentDate are required', 'INVALID_APPOINTMENT');
  }

  assertPatientOwnership(user, patientId);
  assertIsoDate(appointmentDate, 'appointmentDate');

  const [patient, doctor, doctorAppointments] = await Promise.all([
    getPatientById(patientId),
    getDoctorById(doctorId),
    getLegacyAppointmentsForDoctor(doctorId, appointmentDate, token)
  ]);

  if (!patient) {
    throw new AppError(404, 'Patient not found', 'PATIENT_NOT_FOUND');
  }

  if (!doctor) {
    throw new AppError(404, 'Doctor not found', 'DOCTOR_NOT_FOUND');
  }

  if (!isDoctorAvailableOnDate(doctor, appointmentDate)) {
    throw new AppError(400, 'Doctor is not available on the selected date', 'DOCTOR_UNAVAILABLE');
  }

  const appointmentIso = toIsoString(appointmentDate);
  const conflict = doctorAppointments.find(
    (item) => item.appointmentDate === appointmentIso && item.status !== 'cancelled'
  );

  if (conflict) {
    throw new AppError(409, 'Doctor is already booked for this time', 'DOUBLE_BOOKING');
  }

  const appointment = {
    id: randomUUID(),
    patientId,
    patientName: getDisplayName(patient) || patient.email || patientId,
    patientEmail: patient.email || patient.contactEmail || patient.patientEmail,
    doctorId,
    doctorName: getDisplayName(doctor) || doctorId,
    department: getDepartment(doctor),
    appointmentDate: appointmentIso,
    status: 'scheduled',
    notes: payload.notes || null
  };

  if (!appointment.patientEmail) {
    throw new AppError(400, 'Patient email is required for notifications', 'PATIENT_EMAIL_REQUIRED');
  }

  const legacyResponse = await createLegacyAppointment(buildLegacyCreatePayload(appointment), token);
  const normalized = resolveAppointmentResponse(legacyResponse, {
    ...appointment,
    legacyId: appointment.id,
    raw: legacyResponse
  });

  let notification = null;
  try {
    notification = await sendNotification(token, buildNotificationMessage('created', normalized));
  } catch (error) {
    notification = { success: false, error: error.message };
  }

  return {
    appointment: normalized,
    notification
  };
}

async function resolveCurrentAppointment(id, user, token) {
  const direct = await getLegacyAppointmentById(id, token).catch((error) => {
    if (error.statusCode === 404) {
      return null;
    }

    throw error;
  });

  if (direct) {
    return normalizeLegacyAppointment(direct);
  }

  const patientId = getUserRole(user) === 'patient' ? getUserId(user) : null;

  if (!patientId) {
    throw new AppError(404, 'Appointment not found', 'APPOINTMENT_NOT_FOUND');
  }

  const patientAppointments = normalizeAppointmentCollection(await listLegacyAppointmentsByPatient(patientId, token));
  const appointment = patientAppointments.find((item) => item.id === id || item.legacyId === id);

  if (!appointment) {
    throw new AppError(404, 'Appointment not found', 'APPOINTMENT_NOT_FOUND');
  }

  return appointment;
}

async function cancelAppointmentById(id, user, token) {
  const current = await resolveCurrentAppointment(id, user, token);
  const hydrated = await getLegacyAppointmentContext(current, token);

  assertPatientOwnership(user, hydrated.patientId);

  if (normalizeStatus(hydrated.status) === 'cancelled') {
    throw new AppError(400, 'Appointment cannot be cancelled', 'INVALID_APPOINTMENT_STATE');
  }

  if (!isAtLeastOneDayBefore(hydrated.appointmentDate)) {
    throw new AppError(400, 'Appointments can only be cancelled until the day before', 'CANCELLATION_WINDOW_CLOSED');
  }

  const updated = {
    ...hydrated,
    status: 'cancelled',
    cancelledAt: new Date().toISOString()
  };

  const legacyResponse = await cancelLegacyAppointment(updated, token);
  const normalized = resolveAppointmentResponse(legacyResponse, updated);

  let notification = null;
  try {
    notification = await sendNotification(token, buildNotificationMessage('cancelled', normalized));
  } catch (error) {
    notification = { success: false, error: error.message };
  }

  return {
    appointment: normalized,
    notification
  };
}

async function rescheduleAppointmentById(id, payload, user, token) {
  const current = await resolveCurrentAppointment(id, user, token);
  const hydrated = await getLegacyAppointmentContext(current, token);

  assertPatientOwnership(user, hydrated.patientId);

  if (normalizeStatus(hydrated.status) === 'cancelled') {
    throw new AppError(400, 'Appointment cannot be rescheduled', 'INVALID_APPOINTMENT_STATE');
  }

  if (!isAtLeastOneDayBefore(hydrated.appointmentDate)) {
    throw new AppError(400, 'Appointments can only be rescheduled until the day before', 'RESCHEDULE_WINDOW_CLOSED');
  }

  const newAppointmentDate = String(payload.appointmentDate || '').trim();
  if (!newAppointmentDate) {
    throw new AppError(400, 'appointmentDate is required', 'INVALID_APPOINTMENT');
  }

  assertIsoDate(newAppointmentDate, 'appointmentDate');

  const appointmentDateIso = toIsoString(newAppointmentDate);

  if (sameUtcDay(hydrated.appointmentDate, appointmentDateIso) && hydrated.appointmentDate === appointmentDateIso) {
    throw new AppError(400, 'New appointment date must be different', 'INVALID_APPOINTMENT');
  }

  const doctor = await getDoctorById(hydrated.doctorId);
  if (!isDoctorAvailableOnDate(doctor, newAppointmentDate)) {
    throw new AppError(400, 'Doctor is not available on the selected date', 'DOCTOR_UNAVAILABLE');
  }

  const doctorAppointments = await getLegacyAppointmentsForDoctor(hydrated.doctorId, newAppointmentDate, token);
  const conflict = doctorAppointments.find(
    (item) => item.appointmentDate === appointmentDateIso && item.id !== hydrated.id && item.status !== 'cancelled'
  );

  if (conflict) {
    throw new AppError(409, 'Doctor is already booked for this time', 'DOUBLE_BOOKING');
  }

  const updated = {
    ...hydrated,
    appointmentDate: appointmentDateIso,
    status: 'rescheduled',
    rescheduledFrom: hydrated.appointmentDate
  };

  const legacyResponse = await updateLegacyAppointment(updated, token);
  const normalized = resolveAppointmentResponse(legacyResponse, updated);

  let notification = null;
  try {
    notification = await sendNotification(token, buildNotificationMessage('rescheduled', normalized));
  } catch (error) {
    notification = { success: false, error: error.message };
  }

  return {
    appointment: normalized,
    notification
  };
}

module.exports = {
  getDoctorScheduleSummary,
  getAvailableDoctorsByDate,
  createNewAppointment,
  cancelAppointmentById,
  rescheduleAppointmentById
};
