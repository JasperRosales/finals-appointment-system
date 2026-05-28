const express = require('express');
const { requireAuth } = require('../middleware/auth');
const {
  getAvailableDoctorsByDate,
  getDoctorScheduleSummary
} = require('../services/appointmentService');
const { AppError } = require('../utils/errors');

const router = express.Router();

router.get('/available', requireAuth, async (req, res, next) => {
  try {
    const { date } = req.query;

    if (!date) {
      throw new AppError(400, 'date is required', 'INVALID_DATE');
    }

    const doctors = await getAvailableDoctorsByDate(String(date));
    res.status(200).json({
      success: true,
      data: doctors
    });
  } catch (error) {
    next(error);
  }
});

router.get('/:doctorId/schedule', requireAuth, async (req, res, next) => {
  try {
    const { date } = req.query;

    if (!date) {
      throw new AppError(400, 'date is required', 'INVALID_DATE');
    }

    const schedule = await getDoctorScheduleSummary(req.params.doctorId, String(date), req.authToken);
    res.status(200).json({
      success: true,
      data: schedule
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
