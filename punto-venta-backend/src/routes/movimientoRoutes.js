// Archivo: src/routes/movimientoRoutes.js

const express = require('express');
const router = express.Router();
const movimientoController = require('../controllers/movimientoController');

// Rutas para Cuentas por Cobrar/Pagar
router.get('/pendientes', movimientoController.getMovimientosPendientes);

module.exports = router;