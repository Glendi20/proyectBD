// Archivo: src/controllers/auditoriaController.js

const db = require('../db');

// [GET] Obtener registros de auditoría
exports.getRegistrosAuditoria = async (req, res) => {
    let connection;
    try {
        connection = await db.oracledb.getConnection();
        const result = await connection.execute(`
            SELECT 
                a.AUDITORIA_ID, a.FECHA_OPERACION, a.OPERACION, u.NOMBRE_USUARIO AS USUARIO, 
                a.MOTIVO, a.DETALLES_CAMBIO
            FROM AUDITORIA a
            JOIN USUARIOS u ON a.USUARIO_ID = u.USUARIO_ID
            ORDER BY a.FECHA_OPERACION DESC
            FETCH NEXT 50 ROWS ONLY -- Limitar a los 50 más recientes
        `);
        res.status(200).json(result.rows);
    } catch (err) {
        console.error("Error al obtener auditoría:", err);
        res.status(500).json({ error: 'Error interno al obtener registros de auditoría.' });
    } finally {
        if (connection) {
            await connection.close().catch(err => console.error(err));
        }
    }
};