// Archivo: src/controllers/impuestoController.js

const db = require('../db');

// [GET] Obtener todas las tasas de impuestos
exports.getAllTasas = async (req, res) => {
    let connection;
    try {
        connection = await db.oracledb.getConnection();
        
        // CORRECCIÓN CLAVE: Usamos alias ("id", "nombre", "porcentaje") para 
        // mapear las columnas de Oracle a minúsculas, lo que espera React.
        const result = await connection.execute(
            `SELECT 
                IMPUESTO_ID AS "id", 
                NOMBRE AS "nombre", 
                TASA_PORCENTAJE AS "porcentaje" 
             FROM TASAS_IMPUESTOS 
             ORDER BY NOMBRE`
        );
        res.status(200).json(result.rows);
    } catch (err) {
        console.error("Error al obtener tasas de impuesto:", err);
        res.status(500).json({ error: 'Error interno al obtener tasas de impuesto.' });
    } finally {
        if (connection) {
            await connection.close().catch(err => console.error(err));
        }
    }
};

// [POST] Crear una nueva tasa de impuesto (usa secuencia SEQ_IMPUESTOS)
exports.createTasa = async (req, res) => {
    let connection;
    try {
        const { nombre, tasa_porcentaje } = req.body;
        let new_id;

        connection = await db.oracledb.getConnection();
        
        const result = await connection.execute("SELECT SEQ_IMPUESTOS.NEXTVAL AS NEW_ID FROM DUAL");
        new_id = result.rows[0].NEW_ID; 

        await connection.execute(
            `INSERT INTO TASAS_IMPUESTOS (IMPUESTO_ID, NOMBRE, TASA_PORCENTAJE) VALUES (:id, :nom, :tasa)`,
            { id: new_id, nom: nombre, tasa: tasa_porcentaje },
            { autoCommit: true }
        );

        res.status(201).json({ mensaje: 'Tasa de impuesto creada.', impuesto_id: new_id });

    } catch (err) {
        console.error("Error al crear tasa de impuesto:", err);
        const errorMessage = err.message.split('\n')[0];
        res.status(400).json({ error: errorMessage || 'Error al crear la tasa de impuesto.' });
    } finally {
        if (connection) {
            await connection.close().catch(err => console.error(err));
        }
    }
};

// [PUT] Actualizar una tasa de impuesto existente (¡NUEVO!)
exports.updateTasa = async (req, res) => {
    let connection;
    try {
        // ID de la tasa a actualizar viene de la URL (ej: /api/impuestos/tasas/1)
        const id = req.params.id; 
        const { nombre, tasa_porcentaje } = req.body;

        if (!nombre || tasa_porcentaje === undefined) {
            return res.status(400).json({ error: 'Faltan parámetros: nombre y tasa_porcentaje son requeridos.' });
        }

        connection = await db.oracledb.getConnection();
        
        const result = await connection.execute(
            `UPDATE TASAS_IMPUESTOS 
             SET NOMBRE = :nom, TASA_PORCENTAJE = :tasa 
             WHERE IMPUESTO_ID = :id`,
            { nom: nombre, tasa: tasa_porcentaje, id: id },
            { autoCommit: true }
        );

        // Si no se actualizó ninguna fila, el ID no existe
        if (result.rowsAffected === 0) {
            return res.status(404).json({ error: 'Tasa de impuesto no encontrada.' });
        }

        res.status(200).json({ mensaje: 'Tasa de impuesto actualizada correctamente.' });

    } catch (err) {
        console.error("Error al actualizar tasa de impuesto:", err);
        const errorMessage = err.message.split('\n')[0];
        res.status(500).json({ error: errorMessage || 'Error interno al actualizar la tasa de impuesto.' });
    } finally {
        if (connection) {
            await connection.close().catch(err => console.error(err));
        }
    }
};