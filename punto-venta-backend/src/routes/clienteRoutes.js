// Archivo: src/routes/clienteRoutes.js

const express = require('express');
const router = express.Router();
const clienteController = require('../controllers/clienteController');

router.get('/', clienteController.getAllClientes);
router.post('/', clienteController.createCliente);
router.put('/:id', clienteController.updateCliente);

module.exports = router;