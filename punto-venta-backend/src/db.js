// Archivo: punto-venta-backend/src/db.js (CORREGIDO)

const oracledb = require('oracledb');
require('dotenv').config({ path: './.env' }); // Asegura que las variables de entorno se carguen aquí también.

// Configuración de Oracle (obtenida directamente del entorno)
const dbConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    connectString: process.env.DB_CONNECTION_STRING
};

// Configuración crucial para que los resultados se devuelvan como objetos JSON
oracledb.outFormat = oracledb.OUT_FORMAT_OBJECT; 

// *Opcional pero recomendado para evitar warnings, cambia la ruta si es necesario*
// oracledb.initOracleClient({libDir: 'C:/ruta/a/tu/instantclient'}); 

/** Inicializa el pool de conexiones de Oracle. */
async function initialize() {
    try {
        await oracledb.createPool(dbConfig);
        console.log('✅ Pool de conexiones a Oracle creado exitosamente.');
    } catch (err) {
        console.error('❌ Error al crear el pool de conexiones:', err.message);
        throw err;
    }
}

async function close() {
    try {
        await oracledb.getPool().close();
        console.log('Pool de conexiones a Oracle cerrado.');
    } catch (err) {
        console.error('Error al cerrar el pool:', err);
    }
}

module.exports = {
    initialize,
    close,
    oracledb
};