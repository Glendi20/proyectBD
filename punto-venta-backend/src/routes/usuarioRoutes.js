// Archivo: src/routes/usuarioRoutes.js

const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuarioController');

router.get('/', usuarioController.getAllUsuarios);
router.post('/', usuarioController.createUsuario); // Usa SP_CREAR_USUARIO

module.exports = router;