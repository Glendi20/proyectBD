// Archivo: src/controllers/impuestoController.js

const db = require('../db');

// [GET] Obtener todas las tasas de impuestos
exports.getAllTasas = async (req, res) => {
    let connection;
    try {
        connection = await db.oracledb.getConnection();
        const result = await connection.execute(
            `SELECT IMPUESTO_ID, NOMBRE, TASA_PORCENTAJE FROM TASAS_IMPUESTOS ORDER BY NOMBRE`
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