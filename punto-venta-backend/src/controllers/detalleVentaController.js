// Archivo: src/controllers/detalleVentaController.js

const db = require('../db');

// [GET] Obtener los detalles de una venta específica
exports.getDetalleByVentaId = async (req, res) => {
    let connection;
    const { ventaId } = req.params;

    try {
        connection = await db.oracledb.getConnection();
        const result = await connection.execute(
            `SELECT 
                dv.PRODUCTO_CODIGO, p.NOMBRE, dv.CANTIDAD, dv.PRECIO_VENTA, dv.DESCUENTO_LINEA
            FROM DETALLE_VENTAS dv
            JOIN PRODUCTOS p ON dv.PRODUCTO_CODIGO = p.PRODUCTO_CODIGO
            WHERE dv.VENTA_ID = :id`,
            { id: ventaId }
        );
        res.status(200).json(result.rows);
    } catch (err) {
        console.error("Error al obtener detalle de venta:", err);
        res.status(500).json({ error: 'Error interno al obtener detalle de venta.' });
    } finally {
        if (connection) {
            await connection.close().catch(err => console.error(err));
        }
    }
};