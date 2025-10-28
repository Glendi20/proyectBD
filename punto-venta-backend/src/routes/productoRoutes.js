// Archivo: src/routes/productoRoutes.js

const express = require('express');
const router = express.Router();
const productoController = require('../controllers/productoController');

router.get('/', productoController.getAllProductos);
router.post('/', productoController.createProducto);
router.put('/:codigo', productoController.updateProducto);

module.exports = router;