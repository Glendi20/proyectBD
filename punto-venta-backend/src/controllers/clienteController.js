// Archivo: src/controllers/clienteController.js

const db = require('../db');

// [GET] Obtener todos los clientes (Con Alias para Frontend)
exports.getAllClientes = async (req, res) => {
    let connection;
    try {
        connection = await db.oracledb.getConnection();
        const result = await connection.execute(
            `SELECT 
                CLIENTE_ID AS "id", 
                NOMBRE AS "nombre", 
                APELLIDOS AS "apellidos", 
                TELEFONO AS "telefono", 
                TIPO_CLIENTE AS "tipoCliente", 
                LIMITE_CREDITO AS "limiteCredito",
                
                DIRECCION AS "direccion",                     /* <-- AÑADIDO */
                CORREO_ELECTRONICO AS "correoElectronico"       /* <-- AÑADIDO */
                
            FROM CLIENTES 
            ORDER BY NOMBRE`
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

// [POST] Crear un nuevo cliente (Inserción directa con COMMIT)
exports.createCliente = async (req, res) => {
    let connection;
    try {
        const { cliente_id, nombre, apellidos, direccion, telefono, correo_electronico, tipo_cliente, limite_credito } = req.body;
        
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
        res.status(400).json({ error: errorMessage || 'Error al registrar el cliente.' });
    } finally {
        if (connection) {
            await connection.close().catch(err => console.error(err));
        }
    }
};

// [PUT] Actualizar un cliente existente
exports.updateCliente = async (req, res) => {
    let connection;
    try {
        const id = req.params.id; // NIT/ID del cliente
        const { nombre, apellidos, direccion, telefono, correo_electronico, tipo_cliente, limite_credito } = req.body;

        connection = await db.oracledb.getConnection();
        
        const result = await connection.execute(
            `UPDATE CLIENTES 
             SET NOMBRE = :nom, 
                 APELLIDOS = :ape, 
                 DIRECCION = :dir, 
                 TELEFONO = :tel, 
                 CORREO_ELECTRONICO = :corr, 
                 TIPO_CLIENTE = :tipo, 
                 LIMITE_CREDITO = :limite
             WHERE CLIENTE_ID = :id`,
            { nom: nombre, ape: apellidos, dir: direccion, tel: telefono, corr: correo_electronico, tipo: tipo_cliente, limite: limite_credito, id: id },
            { autoCommit: true }
        );

        if (result.rowsAffected === 0) {
            return res.status(404).json({ error: 'Cliente no encontrado.' });
        }

        res.status(200).json({ mensaje: 'Cliente actualizado correctamente.' });

    } catch (err) {
        console.error("Error al actualizar cliente:", err);
        const errorMessage = err.message.split('\n')[0];
        res.status(500).json({ error: errorMessage || 'Error interno al actualizar el cliente.' });
    } finally {
        if (connection) {
            await connection.close().catch(err => console.error(err));
        }
    }
};