// Archivo: src/routes/impuestoRoutes.js

const express = require('express');
const router = express.Router();
const impuestoController = require('../controllers/impuestoController');

// Rutas para las tasas de impuestos (ej. /api/impuestos)
router.get('/tasas', impuestoController.getAllTasas);
router.post('/tasas', impuestoController.createTasa);
router.put('/tasas/:id', impuestoController.updateTasa);

// Rutas para la tabla de unión (ej. /api/impuestos/producto/XYZ)
const impuestoProductoController = require('../controllers/impuestoProductoController');
router.get('/producto/:codigo', impuestoProductoController.getImpuestosByProducto);
router.post('/producto', impuestoProductoController.addImpuestoToProducto);

module.exports = router;