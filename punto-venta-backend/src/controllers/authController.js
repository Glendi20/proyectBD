// Archivo: punto-venta-backend/src/controllers/authController.js

const db = require('../db');

exports.login = async (req, res) => {
    let connection;
    try {
        const { nombre_usuario, contrasena } = req.body;

        connection = await db.oracledb.getConnection();
        
        // --- CONSULTA SQL FINAL Y SEGURA ---
        // 1. Cambiamos :user a :usernameVal
        // 2. Mantenemos las comillas dobles en las columnas para seguridad.
        const result = await connection.execute(
            `SELECT 
                u.USUARIO_ID AS "dpi", 
                u.NOMBRE AS "nombre", 
                r.NOMBRE_ROL AS "rol" 
            FROM USUARIOS u
            JOIN ROLES r ON u.ROL_ID = r.ROL_ID
            WHERE u."NOMBRE_USUARIO" = :usernameVal AND u."CONTRASENA" = :passwordVal`, 
            
            // 3. El objeto de BINDING usa las nuevas claves seguras
            { usernameVal: nombre_usuario, passwordVal: contrasena } // <-- CAMBIO CLAVE
        );
        // ---------------------------------------------

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Credenciales inválidas.' });
        }

        res.status(200).json({ 
            mensaje: 'Autenticación exitosa.',
            usuario: result.rows[0]
        });

    } catch (err) {
        console.error("Error FATAL en el login (Oracle/SQL):", err.message);
        res.status(500).json({ error: 'Error interno del servidor durante el login. (Verifique consola del backend)' });
    } finally {
        if (connection) {
            await connection.close().catch(err => console.error(err));
        }
    }
};