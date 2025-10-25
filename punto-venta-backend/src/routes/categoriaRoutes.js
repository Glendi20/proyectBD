// Archivo: src/routes/categoriaRoutes.js

const express = require('express');
const router = express.Router();
const categoriaController = require('../controllers/categoriaController');

router.get('/', categoriaController.getAllCategorias);
router.post('/', categoriaController.createCategoria);

module.exports = router;