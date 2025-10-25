// Archivo: punto-venta-backend/src/controllers/usuarioController.js

const db = require('../db');

// [GET] Obtener todos los usuarios (para gestión interna)
exports.getAllUsuarios = async (req, res) => {
    let connection;
    try {
        connection = await db.oracledb.getConnection();
        const result = await connection.execute(`
            SELECT 
                u.USUARIO_ID, u.NOMBRE, u.APELLIDOS, u.NOMBRE_USUARIO, r.NOMBRE_ROL 
            FROM USUARIOS u
            JOIN ROLES r ON u.ROL_ID = r.ROL_ID
            ORDER BY u.APELLIDOS
        `);
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
            usuario_id, nombre, apellidos, telefono, correo, nombre_usuario, contrasena, rol_id
        } = req.body;

        connection = await db.oracledb.getConnection();

        // Llama al procedimiento almacenado PL/SQL
        await connection.execute(
            `BEGIN SP_CREAR_USUARIO(:id, :nom, :ape, :tel, :corr, :n_usr, :pass, :rol); END;`,
            {
                id: usuario_id, nom: nombre, ape: apellidos, tel: telefono, corr: correo,
                n_usr: nombre_usuario, pass: contrasena, rol: rol_id
            }
        );

        res.status(201).json({ mensaje: 'Usuario creado exitosamente.', dpi: usuario_id });

    } catch (err) {
        console.error("Error en createUsuario:", err);
        const errorMessage = err.message.split('\n')[0];
        // Los errores de PL/SQL (-2000X) se envían de vuelta aquí
        res.status(400).json({ error: errorMessage || 'Error desconocido al crear el usuario.' });
    } finally {
        if (connection) {
            await connection.close().catch(err => console.error(err));
        }
    }
};