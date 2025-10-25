// Archivo: src/routes/compraRoutes.js

const express = require('express');
const router = express.Router();
const compraController = require('../controllers/compraController');
const detalleCompraController = require('../controllers/detalleCompraController');

// Ruta principal para listar cabeceras de compras
router.get('/', compraController.getAllCompras);

// Ruta para ver el detalle de una compra específica
router.get('/:compraId/detalle', detalleCompraController.getDetalleByCompraId);

// Nota: La ruta POST para crear una compra completa se implementaría con un SP dedicado.

module.exports = router;