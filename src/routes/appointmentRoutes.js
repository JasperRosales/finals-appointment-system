const express = require('express');
const { requireAuth } = require('../middleware/auth');
const {
  cancelAppointmentById,
  createNewAppointment,
  rescheduleAppointmentById
} = require('../services/appointmentService');

const  router = express.Router();

router.post('/', requireAuth, async (req, res, next) => {
  try {
    const result = await createNewAppointment(req.body, req.user, req.authToken);
    res.status(201).json({
      success: true,
      message: 'Appointment created',
      data: result
    });
  } catch (error) {
    next(error);
  }
});

router.patch('/:id/cancel', requireAuth, async (req, res, next) => {
  try {
    const result = await cancelAppointmentById(req.params.id, req.user, req.authToken);
    res.status(200).json({
      success: true,
      message: 'Appointment  cancelled',
      data: result
    });
  } catch (error) {
    next(error);
  }
});

router.patch('/:id/reschedule', requireAuth, async (req, res, next) => {
  try {
    const result = await rescheduleAppointmentById(req.params.id, req.body, req.user, req.authToken);
    res.status(200).json({
      success: true,
      message: 'Appointment rescheduled',
      data: result
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
