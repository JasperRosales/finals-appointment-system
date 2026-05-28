const express = require('express');
const authRoutes = require('./routes/authRoutes');
const doctorRoutes = require('./routes/doctorRoutes');
const appointmentRoutes = require('./routes/appointmentRoutes');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

const  app = express();

app.use(express.json({ limit: '1mb' }));

app.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'Online Appointment System is running'
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/doctors', doctorRoutes );
app.use('/api/appointments', appointmentRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
