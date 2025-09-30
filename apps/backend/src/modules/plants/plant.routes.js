const express = require('express');
const plantController = require('./plant.controller');
const { authMiddleware } = require('../../common/middleware/auth');

const router = express.Router();

// Public routes
router.get('/', plantController.getAllPlants);
router.get('/:id', plantController.getPlantById);

// Protected routes
router.post('/', authMiddleware, plantController.createPlant);
router.put('/:id', authMiddleware, plantController.updatePlant);
router.delete('/:id', authMiddleware, plantController.deletePlant);

module.exports = router;
