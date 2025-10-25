// Archivo: punto-venta-backend/src/controllers/categoriaController.js

const db = require('../db');

// [GET] Obtener todas las categorías
exports.getAllCategorias = async (req, res) => {
    let connection;
    try {
        connection = await db.oracledb.getConnection();
        const result = await connection.execute(
            `SELECT CATEGORIA_ID, NOMBRE FROM CATEGORIAS ORDER BY NOMBRE`
        );
        res.status(200).json(result.rows);
    } catch (err) {
        console.error("Error al obtener categorías:", err);
        res.status(500).json({ error: 'Error interno al obtener categorías.' });
    } finally {
        if (connection) {
            await connection.close().catch(err => console.error(err));
        }
    }
};

// [POST] Crear una nueva categoría (usa secuencia SEQ_CATEGORIAS)
exports.createCategoria = async (req, res) => {
    let connection;
    try {
        const { nombre } = req.body;
        let new_id;

        connection = await db.oracledb.getConnection();
        
        // Obtener el siguiente valor de la secuencia
        const result = await connection.execute("SELECT SEQ_CATEGORIAS.NEXTVAL AS NEW_ID FROM DUAL");
        new_id = result.rows[0].NEW_ID; 

        await connection.execute(
            `INSERT INTO CATEGORIAS (CATEGORIA_ID, NOMBRE) VALUES (:id, :nom)`,
            { id: new_id, nom: nombre },
            { autoCommit: true }
        );

        res.status(201).json({ mensaje: 'Categoría creada.', categoria_id: new_id });

    } catch (err) {
        console.error("Error al crear categoría:", err);
        const errorMessage = err.message.split('\n')[0];
        res.status(400).json({ error: errorMessage || 'Error al crear la categoría.' });
    } finally {
        if (connection) {
            await connection.close().catch(err => console.error(err));
        }
    }
};