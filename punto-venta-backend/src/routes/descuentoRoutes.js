// Archivo: src/routes/descuentoRoutes.js

const express = require('express');
const router = express.Router();
const descuentoController = require('../controllers/descuentoController');

// --- RUTAS CRÍTICAS ---

// Catálogo de tasas (GET/POST/PUT para el CRUD de las tasas %)
router.get('/catalogo', descuentoController.getCatalogoDescuentos);
router.post('/catalogo', descuentoController.createDescuento); 
router.put('/catalogo/:id', descuentoController.updateDescuento); 

// Aplicación de reglas (POST)
router.post('/aplicar', descuentoController.aplicarDescuento);
router.get('/tasas', descuentoController.getCatalogoDescuentos);

router.delete('/aplicadas/:id', descuentoController.deleteReglaAplicada);

// --- RUTA DE CONSULTA (LISTAR REGLAS APLICADAS) ---
router.get('/aplicadas', descuentoController.getReglasAplicadas); // <-- ESTA ES LA RUTA FALTANTE

module.exports = router;