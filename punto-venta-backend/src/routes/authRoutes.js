// Archivo: punto-venta-backend/src/routes/authRoutes.js

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

// Endpoint POST para la autenticación
router.post('/login', authController.login);

module.exports = router;