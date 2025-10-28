// Archivo: punto-venta-backend/src/controllers/usuarioController.js

const db = require('../db');

// [GET] Obtener todos los usuarios (Con Alias para Frontend)
exports.getAllUsuarios = async (req, res) => {
    let connection;
    try {
        connection = await db.oracledb.getConnection();
        
        // Usamos alias para mapear las columnas a camelCase
        const result = await connection.execute(
            `SELECT 
                u.USUARIO_ID AS "dpi", 
                u.NOMBRE AS "nombre", 
                u.APELLIDOS AS "apellidos",
                u.TELEFONO AS "telefono", 
                u.CORREO_ELECTRONICO AS "correo", /* <-- Alias simple para el frontend */
                u.NOMBRE_USUARIO AS "nombreUsuario",
                r.NOMBRE_ROL AS "rol" 
            FROM USUARIOS u
            JOIN ROLES r ON u.ROL_ID = r.ROL_ID
            ORDER BY u.APELLIDOS`
        );
        res.status(200).json(result.rows);
    } catch (err) {
        console.error("Error al obtener usuarios:", err);
        res.status(500).json({ error: 'Error interno al obtener usuarios.' });
    } finally {
        if (connection) {
            await connection.close().catch(err => console.error(err));
        }
    }
};

// [POST] Crear un nuevo usuario (Llama a SP_CREAR_USUARIO)
exports.createUsuario = async (req, res) => {
    let connection;
    try {
        const {
            usuario_id, nombre, apellidos, telefono, correo_electronico, // Variable JS
            nombre_usuario, contrasena, rol_id
        } = req.body;

        connection = await db.oracledb.getConnection();

        // --- CORRECCIÓN CRÍTICA DEL BINDING ---
        // El orden es CRÍTICO y el bind name debe ser simple (ej: :correo)
        await connection.execute(
            // El orden aquí debe coincidir con los 8 parámetros definidos en el SP
            `BEGIN SP_CREAR_USUARIO(:id, :nom, :ape, :tel, :correo, :n_usr, :pass, :rol); END;`, 
            
            { 
                id: usuario_id, 
                nom: nombre, 
                ape: apellidos, 
                tel: telefono, 
                correo: correo_electronico, // <-- Se asegura que la variable JS se mapee a :correo
                n_usr: nombre_usuario, 
                pass: contrasena, 
                rol: rol_id 
            },
            { autoCommit: true } 
        );

        res.status(201).json({ mensaje: 'Usuario creado exitosamente.', dpi: usuario_id });

    } catch (err) {
        console.error("Error en createUsuario:", err);
        const errorMessage = err.message.split('\n')[0];
        res.status(400).json({ error: errorMessage || 'Error desconocido al crear el usuario.' });
    } finally {
        if (connection) {
            await connection.close().catch(err => console.error(err));
        }
    }
};

// [PUT] Actualizar un usuario existente
exports.updateUsuario = async (req, res) => {
    let connection;
    try {
        const id = req.params.id;
        const { 
            nombre, apellidos, telefono, correo_electronico, 
            nombre_usuario, contrasena, rol_id 
        } = req.body;

        connection = await db.oracledb.getConnection();
        
        const result = await connection.execute(
            `UPDATE USUARIOS 
             SET NOMBRE = :nom, 
                 APELLIDOS = :ape, 
                 TELEFONO = :tel, 
                 CORREO_ELECTRONICO = :corr, 
                 NOMBRE_USUARIO = :usr, 
                 CONTRASENA = :pass, 
                 ROL_ID = :rol 
             WHERE USUARIO_ID = :id`,
            { 
                nom: nombre, ape: apellidos, tel: telefono, corr: correo_electronico,
                usr: nombre_usuario, pass: contrasena, rol: rol_id, id: id 
            },
            { autoCommit: true }
        );

        if (result.rowsAffected === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado.' });
        }

        res.status(200).json({ mensaje: 'Usuario actualizado correctamente.' });

    } catch (err) {
        console.error("Error al actualizar usuario:", err);
        const errorMessage = err.message.split('\n')[0];
        res.status(500).json({ error: errorMessage || 'Error interno al actualizar el usuario.' });
    } finally {
        if (connection) {
            await connection.close().catch(err => console.error(err));
        }
    }
};