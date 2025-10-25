// Archivo: src/routes/ventaRoutes.js

const express = require('express');
const router = express.Router();
const ventaController = require('../controllers/ventaController');
const detalleVentaController = require('../controllers/detalleVentaController');

// Rutas para la transacción de Venta
// POST para crear la cabecera de la venta (si es necesario)

// Rutas para las operaciones transaccionales (usando SP)
router.post('/detalle', ventaController.insertarDetalleVenta); // Usa SP_INSERTAR_DETALLE_VENTA
router.post('/pagar', ventaController.pagarVenta); // Usa SP_PAGAR_VENTA

// Rutas de consulta
router.get('/:ventaId/detalle', detalleVentaController.getDetalleByVentaId);

module.exports = router;