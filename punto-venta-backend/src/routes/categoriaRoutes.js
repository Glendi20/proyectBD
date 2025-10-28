// Archivo: src/routes/categoriaRoutes.js

const express = require('express');
const router = express.Router();
const categoriaController = require('../controllers/categoriaController');

router.get('/', categoriaController.getAllCategorias);
router.post('/', categoriaController.createCategoria);
router.put('/:id', categoriaController.updateCategoria);

module.exports = router;