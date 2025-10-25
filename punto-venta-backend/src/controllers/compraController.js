// Archivo: src/controllers/compraController.js

const db = require('../db');

// [GET] Obtener todas las compras
exports.getAllCompras = async (req, res) => {
    let connection;
    try {
        connection = await db.oracledb.getConnection();
        const result = await connection.execute(`
            SELECT 
                c.COMPRA_ID, c.FECHA_COMPRA, p.RAZON_SOCIAL AS PROVEEDOR, 
                c.TOTAL_NETO, c.TIPO_PAGO, c.ESTADO
            FROM COMPRAS c
            JOIN PROVEEDORES p ON c.PROVEEDOR_ID = p.PROVEEDOR_ID
            ORDER BY c.FECHA_COMPRA DESC
        `);
        res.status(200).json(result.rows);
    } catch (err) {
        console.error("Error al obtener compras:", err);
        res.status(500).json({ error: 'Error interno al obtener las compras.' });
    } finally {
        if (connection) {
            await connection.close().catch(err => console.error(err));
        }
    }
};