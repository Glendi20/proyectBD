// Archivo: src/controllers/proveedorController.js

const db = require('../db');

// [GET] Obtener todos los proveedores
exports.getAllProveedores = async (req, res) => {
    let connection;
    try {
        connection = await db.oracledb.getConnection();
        const result = await connection.execute(
            `SELECT PROVEEDOR_ID, RAZON_SOCIAL, TELEFONO, CONDICIONES_PAGO, PLAZO_CREDITO_DIAS FROM PROVEEDORES ORDER BY RAZON_SOCIAL`
        );
        res.status(200).json(result.rows);
    } catch (err) {
        console.error("Error al obtener proveedores:", err);
        res.status(500).json({ error: 'Error interno al obtener proveedores.' });
    } finally {
        if (connection) {
            await connection.close().catch(err => console.error(err));
        }
    }
};

// [POST] Crear un nuevo proveedor
exports.createProveedor = async (req, res) => {
    let connection;
    try {
        const { proveedor_id, razon_social, direccion, telefono, correo_electronico, condiciones_pago, plazo_credito_dias, representante } = req.body;
        
        connection = await db.oracledb.getConnection();

        await connection.execute(
            `INSERT INTO PROVEEDORES (PROVEEDOR_ID, RAZON_SOCIAL, DIRECCION, TELEFONO, CORREO_ELECTRONICO, CONDICIONES_PAGO, PLAZO_CREDITO_DIAS, REPRESENTANTE)
             VALUES (:id, :razon, :dir, :tel, :corr, :cond, :plazo, :rep)`,
            { 
                id: proveedor_id, razon: razon_social, dir: direccion, tel: telefono, 
                corr: correo_electronico, cond: condiciones_pago, plazo: plazo_credito_dias, rep: representante
            },
            { autoCommit: true }
        );

        res.status(201).json({ mensaje: 'Proveedor registrado exitosamente.', id: proveedor_id });

    } catch (err) {
        console.error("Error al registrar proveedor:", err);
        const errorMessage = err.message.split('\n')[0];
        res.status(400).json({ error: errorMessage || 'Error al registrar el proveedor.' });
    } finally {
        if (connection) {
            await connection.close().catch(err => console.error(err));
        }
    }
};