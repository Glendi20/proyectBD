// Archivo: src/routes/ventaRoutes.js

const express = require('express');
const router = express.Router();
const ventaController = require('../controllers/ventaController');

// RUTA PARA OBTENER LA LISTA DE CLIENTES (Necesario para la validación en el frontend)
router.get('/clientes', ventaController.getAllClientes);

// RUTA PARA EL PASO 1 (INSERTAR CABECERA)
router.post('/header', ventaController.insertVentaHeader);

// RUTA PARA OBTENER DOCUMENTOS ABIERTOS DE VENTA (Paso 2 de la Caja)
router.get('/abiertas', ventaController.getVentasAbiertas);

// RUTA PARA EL PASO 2 (INSERTAR DETALLE Y DECREMENTAR STOCK)
router.post('/detail', ventaController.insertarDetalleVenta);

// RUTA PARA LA BÚSQUEDA DE PRODUCTOS (GET /api/ventas/search)
router.get('/search', ventaController.searchProductos);

// AGREGAR ESTA RUTA NUEVA
router.put('/header', ventaController.updateVentaHeader);

// 5. RUTA CRÍTICA SOLICITADA: ACTUALIZAR STOCK (PUT /api/ventas/stock)
router.put('/stock', ventaController.updateStockManual);

// Añade la nueva ruta para el Checkout
router.put('/checkout/:ventaId', ventaController.processCheckout);

// 2. [GET] /api/ventas/historial
router.get('/historial', ventaController.getVentasCerradas);

// [GET] /api/ventas/factura/:ventaId
// Función: getFacturaCompleta (Obtiene cabecera, detalles, totales e impuestos de una venta)
router.get('/factura/:ventaId', ventaController.getFacturaCompleta);

module.exports = router;