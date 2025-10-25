// Archivo: punto-venta-backend/src/controllers/rolController.js

const db = require('../db');

// [GET] Obtener todos los roles
exports.getAllRoles = async (req, res) => {
    let connection;
    try {
        connection = await db.oracledb.getConnection();
        
        // Uso de alias ("rolId", "nombreRol") para forzar la caja y mapear correctamente a JSON
        const result = await connection.execute(
            `SELECT 
                ROL_ID AS "rolId", 
                NOMBRE_ROL AS "nombreRol" 
            FROM ROLES 
            ORDER BY ROL_ID`
        );
        
        // El array de objetos devuelto (result.rows) ahora tiene claves en minúsculas
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
        
        // 1. Obtener el nuevo ID de la secuencia
        const seqResult = await connection.execute("SELECT SEQ_ROLES.NEXTVAL AS NEW_ID FROM DUAL");
        new_id = seqResult.rows[0].NEW_ID; 

        // 2. Insertar y asegurar el COMMIT
        await connection.execute(
            `INSERT INTO ROLES (ROL_ID, NOMBRE_ROL) VALUES (:id, :nom)`,
            { id: new_id, nom: nombre_rol },
            { autoCommit: true } 
        );

        res.status(201).json({ mensaje: 'Rol creado y guardado exitosamente.', rol_id: new_id });

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