// Archivo: punto-venta-backend/server.js

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const db = require('./src/db'); 

// --- Módulos de Swagger ---
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const swaggerDocument = YAML.load('./swagger.yaml');
// --------------------------

// Importar TODOS los módulos de rutas
const clienteRoutes = require('./src/routes/clienteRoutes');
const categoriaRoutes = require('./src/routes/categoriaRoutes');
const productoRoutes = require('./src/routes/productoRoutes');
const usuarioRoutes = require('./src/routes/usuarioRoutes');
const proveedorRoutes = require('./src/routes/proveedorRoutes');
const rolRoutes = require('./src/routes/rolRoutes');
const impuestoRoutes = require('./src/routes/impuestoRoutes'); 
const descuentoRoutes = require('./src/routes/descuentoRoutes');
const compraRoutes = require('./src/routes/compraRoutes');
const ventaRoutes = require('./src/routes/ventaRoutes');
const movimientoRoutes = require('./src/routes/movimientoRoutes');
const auditoriaRoutes = require('./src/routes/auditoriaRoutes');

const app = express();
const PORT = process.env.API_PORT || 3001;

// Middlewares
app.use(cors()); 
app.use(bodyParser.json()); 
app.use(bodyParser.urlencoded({ extended: true }));

// ----------------------------------------------------
// 1. INTEGRACIÓN DE SWAGGER
// ----------------------------------------------------
// La interfaz de Swagger estará disponible en http://localhost:3001/api-docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// ----------------------------------------------------
// 2. CARGA DE RUTAS DE LA API
// ----------------------------------------------------
app.get('/', (req, res) => res.send('API de Punto de Venta en funcionamiento. Visita /api-docs para la documentación.'));

// Rutas de Entidades y Catálogos
app.use('/api/clientes', clienteRoutes);
app.use('/api/categorias', categoriaRoutes);
app.use('/api/productos', productoRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/proveedores', proveedorRoutes);
app.use('/api/roles', rolRoutes);

// Rutas de Impuestos y Descuentos (Catálogos y Unión N:M)
app.use('/api/impuestos', impuestoRoutes); 
app.use('/api/descuentos', descuentoRoutes);

// Rutas Transaccionales y de Reporte
app.use('/api/compras', compraRoutes);
app.use('/api/ventas', ventaRoutes);
app.use('/api/movimientos', movimientoRoutes);
app.use('/api/auditoria', auditoriaRoutes);

// ----------------------------------------------------
// 3. INICIO DEL SERVIDOR Y CONEXIÓN A DB
// ----------------------------------------------------
db.initialize()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`🌍 Servidor API Node.js escuchando en puerto ${PORT}`);
            console.log(`📄 Documentación Swagger disponible en http://localhost:${PORT}/api-docs`);
        });
    })
    .catch(err => {
        console.error('Error fatal al iniciar la aplicación. Revise db.js y las credenciales en .env');
        process.exit(1);
    });