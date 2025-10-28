// Archivo: src/routes/compraRoutes.js

const express = require('express');
const router = express.Router();
const compraController = require('../controllers/compraController');

// RUTA PARA EL PASO 1 (INSERTAR CABECERA)
router.post('/header', compraController.insertCompraHeader);

// Aquí irían las rutas router.get('/', ...) y las de detalle, pero las omitimos por ahora.

module.exports = router;