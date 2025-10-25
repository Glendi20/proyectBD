// Archivo: src/routes/proveedorRoutes.js

const express = require('express');
const router = express.Router();
const proveedorController = require('../controllers/proveedorController');

router.get('/', proveedorController.getAllProveedores);
router.post('/', proveedorController.createProveedor);

module.exports = router;