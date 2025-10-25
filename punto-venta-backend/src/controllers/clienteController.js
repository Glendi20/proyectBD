// Archivo: punto-venta-backend/src/controllers/clienteController.js

const db = require('../db');

// [GET] Obtener todos los clientes
exports.getAllClientes = async (req, res) => {
    let connection;
    try {
        connection = await db.oracledb.getConnection();
        const result = await connection.execute(
            `SELECT CLIENTE_ID, NOMBRE, APELLIDOS, TELEFONO, TIPO_CLIENTE, LIMITE_CREDITO FROM CLIENTES ORDER BY NOMBRE`
        );
        res.status(200).json(result.rows);
    } catch (err) {
        console.error("Error al obtener clientes:", err);
        res.status(500).json({ error: 'Error interno al obtener clientes.' });
    } finally {
        if (connection) {
            await connection.close().catch(err => console.error(err));
        }
    }
};

// [POST] Crear un nuevo cliente (inserción directa)
exports.createCliente = async (req, res) => {
    let connection;
    try {
        const { cliente_id, nombre, apellidos, direccion, telefono, correo_electronico, tipo_cliente, limite_credito } = req.body;
        
        // El cliente_id es el NIT/ID, no es autoincremental
        connection = await db.oracledb.getConnection();

        await connection.execute(
            `INSERT INTO CLIENTES (CLIENTE_ID, NOMBRE, APELLIDOS, DIRECCION, TELEFONO, CORREO_ELECTRONICO, TIPO_CLIENTE, LIMITE_CREDITO)
             VALUES (:id, :nom, :ape, :dir, :tel, :corr, :tipo, :limite)`,
            { 
                id: cliente_id, nom: nombre, ape: apellidos, dir: direccion, 
                tel: telefono, corr: correo_electronico, tipo: tipo_cliente, limite: limite_credito || 0 
            },
            { autoCommit: true }
        );

        res.status(201).json({ mensaje: 'Cliente registrado exitosamente.', id: cliente_id });

    } catch (err) {
        console.error("Error al registrar cliente:", err);
        const errorMessage = err.message.split('\n')[0];
        // Captura el error de clave duplicada o restricción (ej. DUP_VAL_ON_INDEX)
        res.status(400).json({ error: errorMessage || 'Error al registrar el cliente.' });
    } finally {
        if (connection) {
            await connection.close().catch(err => console.error(err));
        }
    }
};