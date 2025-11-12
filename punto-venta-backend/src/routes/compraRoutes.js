// Archivo: src/routes/compraRoutes.js

const express = require('express');
const router = express.Router();
const compraController = require('../controllers/compraController');

// RUTA PARA EL PASO 1 (INSERTAR CABECERA)
router.post('/header', compraController.insertCompraHeader);

router.get('/abiertas', compraController.getComprasAbiertas);

router.post('/detail', compraController.insertCompraDetail);

router.put('/stock', compraController.updateStockManual);

router.put('/header/:compraId', compraController.updateCompraHeader);

router.put('/status/:compraId', compraController.updateCompraStatus);

router.get('/historial', compraController.getComprasHistorial); // Lista de compras cerradas

router.get('/:compraId/reporte', compraController.getCompraDetalleCompleto); // Detalle de un documento

// Aquí irían las rutas router.get('/', ...) y las de detalle, pero las omitimos por ahora.

module.exports = router;