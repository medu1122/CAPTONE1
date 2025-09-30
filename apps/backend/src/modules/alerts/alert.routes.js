const express = require('express');
const Alert = require('./alert.model');
const { authMiddleware } = require('../../common/middleware/auth');
const { httpSuccess, httpError } = require('../../common/utils/http');
const alertService = require('./alert.service');

const router = express.Router();

/**
 * Create a new alert
 */
router.post('/', authMiddleware, async (req, res, next) => {
  try {
    const alertData = {
      ...req.body,
      user: req.user.id,
    };
    
    const alert = await Alert.create(alertData);
    const { statusCode, body } = httpSuccess(201, 'Alert created successfully', alert);
    
    res.status(statusCode).json(body);
  } catch (error) {
    next(error);
  }
});

/**
 * Get user's alerts
 */
router.get('/', authMiddleware, async (req, res, next) => {
  try {
    const alerts = await Alert.find({ user: req.user.id });
    const { statusCode, body } = httpSuccess(200, 'Alerts retrieved successfully', alerts);
    
    res.status(statusCode).json(body);
  } catch (error) {
    next(error);
  }
});

/**
 * Get alert by ID
 */
router.get('/:id', authMiddleware, async (req, res, next) => {
  try {
    const alert = await Alert.findById(req.params.id);
    
    if (!alert) {
      return next(httpError(404, 'Alert not found'));
    }
    
    // Check if user is authorized to view
    if (alert.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(httpError(403, 'Not authorized to view this alert'));
    }
    
    const { statusCode, body } = httpSuccess(200, 'Alert retrieved successfully', alert);
    
    res.status(statusCode).json(body);
  } catch (error) {
    next(error);
  }
});

/**
 * Update alert
 */
router.put('/:id', authMiddleware, async (req, res, next) => {
  try {
    const alert = await Alert.findById(req.params.id);
    
    if (!alert) {
      return next(httpError(404, 'Alert not found'));
    }
    
    // Check if user is authorized to update
    if (alert.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(httpError(403, 'Not authorized to update this alert'));
    }
    
    const updatedAlert = await Alert.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    
    const { statusCode, body } = httpSuccess(200, 'Alert updated successfully', updatedAlert);
    
    res.status(statusCode).json(body);
  } catch (error) {
    next(error);
  }
});

/**
 * Delete alert
 */
router.delete('/:id', authMiddleware, async (req, res, next) => {
  try {
    const alert = await Alert.findById(req.params.id);
    
    if (!alert) {
      return next(httpError(404, 'Alert not found'));
    }
    
    // Check if user is authorized to delete
    if (alert.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(httpError(403, 'Not authorized to delete this alert'));
    }
    
    await alert.remove();
    
    const { statusCode, body } = httpSuccess(200, 'Alert deleted successfully');
    
    res.status(statusCode).json(body);
  } catch (error) {
    next(error);
  }
});

/**
 * Test weather alert
 */
router.post('/:id/test', authMiddleware, async (req, res, next) => {
  try {
    const alert = await Alert.findById(req.params.id);
    
    if (!alert) {
      return next(httpError(404, 'Alert not found'));
    }
    
    // Check if user is authorized
    if (alert.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return next(httpError(403, 'Not authorized to test this alert'));
    }
    
    // Force send a test alert
    await alertService.sendSMS(
      alert.phone,
      'This is a test alert from GreenGrow. Your weather alerts are working correctly.'
    );
    
    const { statusCode, body } = httpSuccess(200, 'Test alert sent successfully');
    
    res.status(statusCode).json(body);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
