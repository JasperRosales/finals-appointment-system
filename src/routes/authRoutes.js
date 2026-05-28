const express = require('express');
const { login, register } = require('../services/authService');
const { requireAuth } = require('../middleware/auth');
const { AppError } = require('../utils/errors');

const router = express.Router();

router.post('/register', async (req, res, next) => {
  try {
    const data = await register(req.body);
    res.status(201).json({
      success: true,
      message: data.message || 'User created',
      data
    });
  } catch (error) {
    next(error);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const data = await login(req.body);
    res.status(200).json({
      success: true,
      message: data.message || 'Login successful',
      token: data.token,
      data
    });
  } catch (error) {
    next(error);
  }
});

router.post('/logout', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Logged out'
  });
});

router.get('/me', requireAuth, async (req, res, next) => {
  try {
    if (!req.user || !req.user.id) {
      throw new AppError(502, ' Auth service returned an invalid user payload', 'AUTH_ME_INVALID');
    }

    res.status(200).json({
      success: true,
      data: req.user
    });
  } catch (error) {
    next(error);
  }
});


module.exports = router;
