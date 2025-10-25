// Archivo: punto-venta-backend/src/controllers/impuestoProductoController.js

const db = require('../db');

// [GET] Obtener los impuestos aplicados a un producto específico
exports.getImpuestosByProducto = async (req, res) => {
    let connection;
    // Se espera el código del producto en los parámetros de la URL (ej: /api/impuestos/producto/XYZ)
    const { codigo } = req.params; 

    try {
        connection = await db.oracledb.getConnection();
        const result = await connection.execute(
            `SELECT 
                ip.PRODUCTO_CODIGO, t.NOMBRE, t.TASA_PORCENTAJE
            FROM IMPUESTOS_PRODUCTOS ip
            JOIN TASAS_IMPUESTOS t ON ip.IMPUESTO_ID = t.IMPUESTO_ID
            WHERE ip.PRODUCTO_CODIGO = :cod`,
            { cod: codigo }
        );
        res.status(200).json(result.rows);
    } catch (err) {
        console.error("Error al obtener impuestos por producto:", err);
        res.status(500).json({ error: 'Error interno al obtener impuestos por producto.' });
    } finally {
        if (connection) {
            await connection.close().catch(err => console.error(err));
        }
    }
};

// [POST] Asociar un impuesto a un producto
exports.addImpuestoToProducto = async (req, res) => {
    let connection;
    try {
        const { producto_codigo, impuesto_id } = req.body;
        
        connection = await db.oracledb.getConnection();

        await connection.execute(
            `INSERT INTO IMPUESTOS_PRODUCTOS (PRODUCTO_CODIGO, IMPUESTO_ID) VALUES (:prod_cod, :imp_id)`,
            { prod_cod: producto_codigo, imp_id: impuesto_id },
            { autoCommit: true }
        );

        res.status(201).json({ mensaje: 'Impuesto asociado al producto exitosamente.' });

    } catch (err) {
        console.error("Error al asociar impuesto:", err);
        const errorMessage = err.message.split('\n')[0];
        res.status(400).json({ error: errorMessage || 'Error al asociar el impuesto.' });
    } finally {
        if (connection) {
            await connection.close().catch(err => console.error(err));
        }
    }
};