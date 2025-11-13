// Archivo: src/routes/reportesRoutes.js

const express = require('express');
const router = express.Router();
const reporteController = require('../controllers/reporteController'); // Debe apuntar a 'src/controllers'

// La ruta que el router intenta encontrar después del prefijo /api/reportes/
router.get('/mejores-clientes', reporteController.getMejoresClientes); 

// [GET] /api/reportes/top-productos
router.get('/top-productos', reporteController.getTopProductosVendidos);

// ...productos con estock bajo
router.get('/stock-bajo', reporteController.getStockBajo);

// reporte de creditos de compra por vender...
router.get('/creditos-por-vencer', reporteController.getCreditosPorVencer);

// reporte de credito por venta por vencer...
router.get('/ventas-por-cobrar', reporteController.getVentasPorCobrar);



module.exports = router; // <--- CRÍTICO: Debe exportar el router
