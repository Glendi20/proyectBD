// Archivo: src/routes/rolRoutes.js

const express = require('express');
const router = express.Router();
const rolController = require('../controllers/rolController');

router.get('/', rolController.getAllRoles);
router.post('/', rolController.createRol);
router.put('/:id', rolController.updateRol);

module.exports = router;