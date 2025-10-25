// Archivo: src/controllers/descuentoController.js

const db = require('../db');
const oracledb = db.oracledb;

// [GET] Obtener catálogo de descuentos (Tasas)
exports.getCatalogoDescuentos = async (req, res) => {
    let connection;
    try {
        connection = await db.oracledb.getConnection();
        const result = await connection.execute(
            `SELECT DESCUENTO_ID, NOMBRE_DESCUENTO, TASA_PORCENTAJE FROM CATALOGO_DESCUENTOS`
        );
        res.status(200).json(result.rows);
    } catch (err) {
        console.error("Error al obtener catálogo de descuentos:", err);
        res.status(500).json({ error: 'Error interno al obtener catálogo.' });
    } finally {
        if (connection) {
            await connection.close().catch(err => console.error(err));
        }
    }
};

// [POST] Aplicar un descuento a Producto, Categoría o Globalmente
exports.aplicarDescuento = async (req, res) => {
    let connection;
    try {
        const { 
            descuento_id, tipo_aplicacion, producto_codigo, categoria_id, fecha_fin 
        } = req.body;

        connection = await db.oracledb.getConnection();

        // Obtener el ID de secuencia para la aplicación
        const result = await connection.execute("SELECT SEQ_DESC_APLICADOS.NEXTVAL AS NEW_ID FROM DUAL");
        const aplicacion_id = result.rows[0].NEW_ID; 

        await connection.execute(
            `INSERT INTO DESCUENTOS_APLICADOS (
                APLICACION_ID, DESCUENTO_ID, TIPO_APLICACION, PRODUCTO_CODIGO, CATEGORIA_ID, FECHA_FIN
            ) VALUES (
                :app_id, :desc_id, :tipo, :prod_cod, :cat_id, :f_fin
            )`,
            {
                app_id: aplicacion_id,
                desc_id: descuento_id,
                tipo: tipo_aplicacion,
                prod_cod: producto_codigo || null,
                cat_id: categoria_id || null,
                f_fin: fecha_fin || null,
            },
            { autoCommit: true }
        );

        res.status(201).json({ mensaje: 'Descuento aplicado exitosamente.', aplicacion_id: aplicacion_id });

    } catch (err) {
        console.error("Error al aplicar descuento:", err);
        const errorMessage = err.message.split('\n')[0];
        res.status(400).json({ error: errorMessage || 'Error al aplicar el descuento.' });
    } finally {
        if (connection) {
            await connection.close().catch(err => console.error(err));
        }
    }
};