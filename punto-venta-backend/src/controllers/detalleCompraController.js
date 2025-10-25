// Archivo: src/controllers/detalleCompraController.js

const db = require('../db');

// [GET] Obtener los detalles de una compra específica
exports.getDetalleByCompraId = async (req, res) => {
    let connection;
    const { compraId } = req.params; 

    try {
        connection = await db.oracledb.getConnection();
        const result = await connection.execute(
            `SELECT 
                dc.PRODUCTO_CODIGO, p.NOMBRE, dc.CANTIDAD, dc.PRECIO_COSTO, dc.DESCUENTO_LINEA
            FROM DETALLE_COMPRAS dc
            JOIN PRODUCTOS p ON dc.PRODUCTO_CODIGO = p.PRODUCTO_CODIGO
            WHERE dc.COMPRA_ID = :id`,
            { id: compraId }
        );
        res.status(200).json(result.rows);
    } catch (err) {
        console.error("Error al obtener detalle de compra:", err);
        res.status(500).json({ error: 'Error interno al obtener detalle de compra.' });
    } finally {
        if (connection) {
            await connection.close().catch(err => console.error(err));
        }
    }
};