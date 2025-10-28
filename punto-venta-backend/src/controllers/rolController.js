// Archivo: src/controllers/rolController.js

const db = require('../db');

// [GET] Obtener todos los roles (Con Alias para Frontend)
exports.getAllRoles = async (req, res) => {
    let connection;
    try {
        connection = await db.oracledb.getConnection();
        const result = await connection.execute(
            `SELECT 
                ROL_ID AS "rolId", 
                NOMBRE_ROL AS "nombreRol" 
            FROM ROLES 
            ORDER BY ROL_ID`
        );
        res.status(200).json(result.rows);
    } catch (err) {
        console.error("Error al obtener roles:", err);
        res.status(500).json({ error: 'Error interno al obtener roles.' });
    } finally {
        if (connection) {
            await connection.close().catch(err => console.error(err));
        }
    }
};

// [POST] Crear un nuevo rol (usa secuencia SEQ_ROLES)
exports.createRol = async (req, res) => {
    let connection;
    try {
        const { nombre_rol } = req.body;
        let new_id;

        connection = await db.oracledb.getConnection();
        const result = await connection.execute("SELECT SEQ_ROLES.NEXTVAL AS NEW_ID FROM DUAL");
        new_id = result.rows[0].NEW_ID; 

        await connection.execute(
            `INSERT INTO ROLES (ROL_ID, NOMBRE_ROL) VALUES (:id, :nom)`,
            { id: new_id, nom: nombre_rol },
            { autoCommit: true }
        );

        res.status(201).json({ mensaje: 'Rol creado.', rol_id: new_id });

    } catch (err) {
        console.error("Error al crear rol:", err);
        const errorMessage = err.message.split('\n')[0];
        res.status(400).json({ error: errorMessage || 'Error al crear el rol.' });
    } finally {
        if (connection) {
            await connection.close().catch(err => console.error(err));
        }
    }
};

// [PUT] Actualizar un rol existente (¡NUEVO!)
exports.updateRol = async (req, res) => {
    let connection;
    try {
        const id = req.params.id; // ROL_ID del rol
        const { nombre_rol } = req.body;

        if (!nombre_rol) {
            return res.status(400).json({ error: 'El nombre del rol es requerido.' });
        }

        connection = await db.oracledb.getConnection();
        
        const result = await connection.execute(
            `UPDATE ROLES SET NOMBRE_ROL = :nom WHERE ROL_ID = :id`,
            { nom: nombre_rol, id: id },
            { autoCommit: true }
        );

        if (result.rowsAffected === 0) {
            return res.status(404).json({ error: 'Rol no encontrado.' });
        }

        res.status(200).json({ mensaje: 'Rol actualizado correctamente.' });

    } catch (err) {
        console.error("Error al actualizar rol:", err);
        const errorMessage = err.message.split('\n')[0];
        res.status(500).json({ error: errorMessage || 'Error interno al actualizar el rol.' });
    } finally {
        if (connection) {
            await connection.close().catch(err => console.error(err));
        }
    }
};