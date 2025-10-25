// Archivo: src/routes/descuentoRoutes.js

const express = require('express');
const router = express.Router();
const descuentoController = require('../controllers/descuentoController');

// Rutas para el catálogo de descuentos (Tasas)
router.get('/catalogo', descuentoController.getCatalogoDescuentos);

// Rutas para aplicar descuentos (DESCUENTOS_APLICADOS)
router.post('/aplicar', descuentoController.aplicarDescuento);

module.exports = router;