// Archivo: src/routes/auditoriaRoutes.js

const express = require('express');
const router = express.Router();
const auditoriaController = require('../controllers/auditoriaController');

router.get('/', auditoriaController.getRegistrosAuditoria);

module.exports = router;