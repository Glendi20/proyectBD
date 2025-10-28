// Archivo: punto-venta-backend/src/controllers/descuentoController.js

const db = require('../db');

// --- MÉTODOS DE CATÁLOGO (TASAS FIJAS) ---

// [GET] Obtener catálogo de descuentos (Tasas)
exports.getCatalogoDescuentos = async (req, res) => {
    let connection;
    try {
        connection = await db.oracledb.getConnection();
        const result = await connection.execute(
            `SELECT 
                DESCUENTO_ID AS "id", 
                NOMBRE_DESCUENTO AS "nombre", 
                TASA_PORCENTAJE AS "porcentaje" 
            FROM CATALOGO_DESCUENTOS 
            ORDER BY NOMBRE_DESCUENTO`
        );
        res.status(200).json(result.rows);
    } catch (err) {
        console.error("Error al obtener catálogo de descuentos:", err);
        res.status(500).json({ error: 'Error interno al obtener el catálogo de descuentos.' });
    } finally {
        if (connection) {
            await connection.close().catch(err => console.error(err));
        }
    }
};

// [POST] Crear una nueva tasa de descuento en el catálogo
exports.createDescuento = async (req, res) => {
    let connection;
    try {
        const { nombre_descuento, tasa_porcentaje } = req.body;
        let new_id;

        connection = await db.oracledb.getConnection();
        const result = await connection.execute("SELECT SEQ_CATALOGO_DESC.NEXTVAL AS NEW_ID FROM DUAL");
        new_id = result.rows[0].NEW_ID; 

        await connection.execute(
            `INSERT INTO CATALOGO_DESCUENTOS (DESCUENTO_ID, NOMBRE_DESCUENTO, TASA_PORCENTAJE) 
             VALUES (:id, :nom, :tasa)`,
            { id: new_id, nom: nombre_descuento, tasa: tasa_porcentaje },
            { autoCommit: true }
        );

        res.status(201).json({ mensaje: 'Descuento creado.', id: new_id });

    } catch (err) {
        console.error("Error al crear descuento:", err);
        const errorMessage = err.message.split('\n')[0];
        res.status(400).json({ error: errorMessage || 'Error al crear la tasa de descuento.' });
    } finally {
        if (connection) {
            await connection.close().catch(err => console.error(err));
        }
    }
};

// [PUT] Actualizar una tasa de descuento existente en el catálogo
exports.updateDescuento = async (req, res) => {
    let connection;
    try {
        const id = req.params.id; 
        const { nombre_descuento, tasa_porcentaje } = req.body;

        if (!nombre_descuento || tasa_porcentaje === undefined) {
            return res.status(400).json({ error: 'Faltan parámetros.' });
        }

        connection = await db.oracledb.getConnection();
        
        const result = await connection.execute(
            `UPDATE CATALOGO_DESCUENTOS 
             SET NOMBRE_DESCUENTO = :nom, TASA_PORCENTAJE = :tasa 
             WHERE DESCUENTO_ID = :id`,
            { nom: nombre_descuento, tasa: tasa_porcentaje, id: id },
            { autoCommit: true }
        );

        if (result.rowsAffected === 0) {
            return res.status(404).json({ error: 'Tasa de descuento no encontrada.' });
        }

        res.status(200).json({ mensaje: 'Tasa de descuento actualizada correctamente.' });

    } catch (err) {
        console.error("Error al actualizar tasa de descuento:", err);
        const errorMessage = err.message.split('\n')[0];
        res.status(500).json({ error: errorMessage || 'Error interno al actualizar la tasa de descuento.' });
    } finally {
        if (connection) {
            await connection.close().catch(err => console.error(err));
        }
    }
};

// --- MÉTODO DE APLICACIÓN DE REGLAS (TABLA DESCUENTOS_APLICADOS) ---

// [POST] Aplicar un descuento (Individual, por Lote/Categoría o Global) - CORREGIDO ORA-00911
exports.aplicarDescuento = async (req, res) => {
    let connection;
    try {
        const { descuento_id, tipo_aplicacion, producto_codigo, categoria_id, fecha_fin } = req.body;
        
        // Asumiendo que categoria_id es el valor que podría ser problemático.
        // Convertimos el ID a número ANTES de enviarlo al binding si no es NULL.
        const catIdForDb = categoria_id ? parseInt(categoria_id) : null; 

        connection = await db.oracledb.getConnection();
        const result = await connection.execute("SELECT SEQ_DESC_APLICADOS.NEXTVAL AS NEW_ID FROM DUAL");
        const aplicacion_id = result.rows[0].NEW_ID; 

        await connection.execute(
            `INSERT INTO DESCUENTOS_APLICADOS (
                APLICACION_ID, DESCUENTO_ID, TIPO_APLICACION, PRODUCTO_CODIGO, CATEGORIA_ID, FECHA_FIN
            ) VALUES (
                :app_id, :desc_id, :tipo, :prod_cod, :cat_id, TO_DATE(:f_fin, 'YYYY-MM-DD')
            )`,
            {
                app_id: aplicacion_id,
                desc_id: descuento_id,
                tipo: tipo_aplicacion,
                prod_cod: producto_codigo || null,
                // Utilizamos el valor pre-parseado que garantiza que es INT o NULL
                cat_id: catIdForDb, 
                f_fin: fecha_fin || null,
            },
            { autoCommit: true }
        );

        res.status(201).json({ mensaje: 'Regla de descuento aplicada.', aplicacion_id: aplicacion_id });

    } catch (err) {
        console.error("Error al aplicar descuento:", err);
        const errorMessage = err.message.split('\n')[0];
        res.status(400).json({ error: errorMessage || 'Error al aplicar la regla de descuento.' });
    } finally {
        if (connection) {
            await connection.close().catch(err => console.error(err));
        }
    }
};

// [GET] Obtener lista de reglas de descuento aplicadas
exports.getReglasAplicadas = async (req, res) => {
    let connection;
    try {
        connection = await db.oracledb.getConnection();

        // Consulta compleja para obtener las reglas aplicadas y sus detalles
        const result = await connection.execute(
            `SELECT
                da.APLICACION_ID AS "reglaId",
                cd.NOMBRE_DESCUENTO AS "nombreDescuento",
                cd.TASA_PORCENTAJE AS "porcentaje",
                da.TIPO_APLICACION AS "tipoAplicacion",
                COALESCE(p.NOMBRE, c.NOMBRE, 'GLOBAL') AS "aplicadoA",
                da.FECHA_INICIO AS "fechaInicio",
                da.FECHA_FIN AS "fechaFin"
            FROM DESCUENTOS_APLICADOS da
            JOIN CATALOGO_DESCUENTOS cd ON da.DESCUENTO_ID = cd.DESCUENTO_ID
            LEFT JOIN PRODUCTOS p ON da.PRODUCTO_CODIGO = p.PRODUCTO_CODIGO
            LEFT JOIN CATEGORIAS c ON da.CATEGORIA_ID = c.CATEGORIA_ID
            ORDER BY da.FECHA_INICIO DESC`,
            [],
            { outFormat: db.oracledb.OUT_FORMAT_OBJECT }
        );

        res.status(200).json(result.rows);

    } catch (err) {
        console.error("Error al obtener reglas aplicadas:", err);
        res.status(500).json({ error: 'Error interno al obtener la lista de reglas aplicadas.' });
    } finally {
        if (connection) {
            await connection.close().catch(err => console.error(err));
        }
    }
};

// [DELETE] Eliminar una regla de descuento aplicada por ID
exports.deleteReglaAplicada = async (req, res) => {
    let connection;
    try {
        const id = req.params.id; // ID de la regla a eliminar

        connection = await db.oracledb.getConnection();
        
        const result = await connection.execute(
            `DELETE FROM DESCUENTOS_APLICADOS WHERE APLICACION_ID = :id`,
            { id: id },
            { autoCommit: true }
        );

        if (result.rowsAffected === 0) {
            return res.status(404).json({ error: 'Regla de descuento no encontrada.' });
        }

        res.status(200).json({ mensaje: 'Regla de descuento eliminada (deshabilitada) correctamente.' });

    } catch (err) {
        console.error("Error al eliminar regla:", err);
        const errorMessage = err.message.split('\n')[0];
        res.status(500).json({ error: errorMessage || 'Error al eliminar la regla de descuento.' });
    } finally {
        if (connection) {
            await connection.close().catch(err => console.error(err));
        }
    }
};