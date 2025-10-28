// Archivo: src/controllers/categoriaController.js

const db = require('../db');

// [GET] Obtener todas las categorías (Con Alias para Frontend)
exports.getAllCategorias = async (req, res) => {
    let connection;
    try {
        connection = await db.oracledb.getConnection();
        const result = await connection.execute(
            `SELECT 
                CATEGORIA_ID AS "categoriaId", 
                NOMBRE AS "nombre" 
            FROM CATEGORIAS 
            ORDER BY NOMBRE`
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

// [POST] Crear una nueva categoría
exports.createCategoria = async (req, res) => {
    let connection;
    try {
        const { nombre } = req.body;
        let new_id;

        connection = await db.oracledb.getConnection();
        const seqResult = await connection.execute("SELECT SEQ_CATEGORIAS.NEXTVAL AS NEW_ID FROM DUAL");
        new_id = seqResult.rows[0].NEW_ID; 

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

// [PUT] Actualizar una categoría existente (¡NUEVO!)
exports.updateCategoria = async (req, res) => {
    let connection;
    try {
        const id = req.params.id; // Viene de la URL /api/categorias/:id
        const { nombre } = req.body;

        if (!nombre) {
            return res.status(400).json({ error: 'El nombre de la categoría es requerido.' });
        }

        connection = await db.oracledb.getConnection();
        
        const result = await connection.execute(
            `UPDATE CATEGORIAS SET NOMBRE = :nom WHERE CATEGORIA_ID = :id`,
            { nom: nombre, id: id },
            { autoCommit: true }
        );

        if (result.rowsAffected === 0) {
            return res.status(404).json({ error: 'Categoría no encontrada.' });
        }

        res.status(200).json({ mensaje: 'Categoría actualizada correctamente.' });

    } catch (err) {
        console.error("Error al actualizar categoría:", err);
        const errorMessage = err.message.split('\n')[0];
        res.status(500).json({ error: errorMessage || 'Error interno al actualizar la categoría.' });
    } finally {
        if (connection) {
            await connection.close().catch(err => console.error(err));
        }
    }
};