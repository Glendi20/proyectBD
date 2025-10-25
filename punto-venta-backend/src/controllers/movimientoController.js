// Archivo: src/controllers/movimientoController.js

const db = require('../db');

// [GET] Obtener todos los movimientos pendientes (Cuentas por Cobrar/Pagar)
exports.getMovimientosPendientes = async (req, res) => {
    let connection;
    try {
        connection = await db.oracledb.getConnection();
        const result = await connection.execute(`
            SELECT 
                MOVIMIENTO_ID, TIPO_MOVIMIENTO, DOCUMENTO_ID, 
                FECHA_VENCIMIENTO, SALDO_PENDIENTE, ESTADO
            FROM MOVIMIENTOS_FINANCIEROS
            WHERE ESTADO IN ('pendiente', 'vencido', 'parcial')
            ORDER BY FECHA_VENCIMIENTO ASC
        `);
        res.status(200).json(result.rows);
    } catch (err) {
        console.error("Error al obtener movimientos financieros:", err);
        res.status(500).json({ error: 'Error interno al obtener movimientos financieros.' });
    } finally {
        if (connection) {
            await connection.close().catch(err => console.error(err));
        }
    }
};