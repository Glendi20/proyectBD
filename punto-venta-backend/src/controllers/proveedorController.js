// Archivo: src/controllers/proveedorController.js

const db = require('../db');

// [GET] Obtener todos los proveedores (Fuga potencial aquí si el SELECT falla)
exports.getAllProveedores = async (req, res) => {
    let connection; 
    try {
        connection = await db.oracledb.getConnection();
        
        // Usamos alias (id, razonSocial) para mapear correctamente
        const result = await connection.execute(
            `SELECT 
                PROVEEDOR_ID AS "id", 
                RAZON_SOCIAL AS "razonSocial", 
                TELEFONO AS "telefono", 
                CONDICIONES_PAGO AS "condicionesPago",
                PLAZO_CREDITO_DIAS AS "plazoCreditoDias",
                REPRESENTANTE AS "representante",
                DIRECCION AS "direccion",
                CORREO_ELECTRONICO AS "correoElectronico"
            FROM PROVEEDORES 
            ORDER BY RAZON_SOCIAL`
        );
        
        res.status(200).json(result.rows);
        
    } catch (err) {
        console.error("Error al obtener proveedores (Fuga potencial en GET):", err);
        res.status(500).json({ error: 'Error interno al obtener proveedores.', detail: err.message });
    } finally {
        // Bloque de seguridad: Garantiza la devolución de la conexión
        if (connection) {
            await connection.close().catch(e => console.error("Error al cerrar conexión en GET:", e));
        }
    }
};

// [POST] Crear un nuevo proveedor (Fuga potencial al insertar)
exports.createProveedor = async (req, res) => {
    let connection;
    try {
        const { 
            proveedor_id, razon_social, direccion, telefono, correo_electronico, 
            condiciones_pago, plazo_credito_dias, representante 
        } = req.body;

        connection = await db.oracledb.getConnection();
        
        await connection.execute(
            `INSERT INTO PROVEEDORES (
                PROVEEDOR_ID, RAZON_SOCIAL, DIRECCION, TELEFONO, CORREO_ELECTRONICO, 
                CONDICIONES_PAGO, PLAZO_CREDITO_DIAS, REPRESENTANTE
             ) VALUES (
                :id, :razon, :dir, :tel, :corr, :cond, :plazo, :rep
             )`,
            { 
                id: proveedor_id, razon: razon_social, dir: direccion, tel: telefono, 
                corr: correo_electronico, cond: condiciones_pago, plazo: plazo_credito_dias, rep: representante
            },
            { autoCommit: true }
        );

        res.status(201).json({ mensaje: 'Proveedor registrado exitosamente.', id: proveedor_id });

    } catch (err) {
        console.error("Error al crear proveedor (Fuga potencial en POST):", err);
        const errorMessage = err.message.split('\n')[0];
        res.status(400).json({ error: errorMessage || 'Error al registrar el proveedor.' });
    } finally {
        // Bloque de seguridad: Garantiza la devolución de la conexión
        if (connection) {
            await connection.close().catch(e => console.error("Error al cerrar conexión en POST:", e));
        }
    }
};

// [PUT] Actualizar un proveedor existente (Fuga potencial al modificar)
exports.updateProveedor = async (req, res) => {
    let connection; 
    try {
        const id = req.params.id;
        const { 
            razon_social, direccion, telefono, correo_electronico, 
            condiciones_pago, plazo_credito_dias, representante 
        } = req.body;

        connection = await db.oracledb.getConnection();
        
        const result = await connection.execute(
            `UPDATE PROVEEDORES 
             SET RAZON_SOCIAL = :razon, DIRECCION = :dir, TELEFONO = :tel, CORREO_ELECTRONICO = :corr,
                 CONDICIONES_PAGO = :cond, PLAZO_CREDITO_DIAS = :plazo, REPRESENTANTE = :rep
             WHERE PROVEEDOR_ID = :id`,
            { 
                razon: razon_social, dir: direccion, tel: telefono, corr: correo_electronico,
                cond: condiciones_pago, plazo: plazo_credito_dias, rep: representante, id: id 
            },
            { autoCommit: true }
        );

        if (result.rowsAffected === 0) {
            return res.status(404).json({ error: 'Proveedor no encontrado.' });
        }

        res.status(200).json({ mensaje: 'Proveedor actualizado correctamente.' });

    } catch (err) {
        console.error("Error al actualizar proveedor (Fuga potencial en PUT):", err);
        const errorMessage = err.message.split('\n')[0];
        res.status(500).json({ error: errorMessage || 'Error interno al actualizar el proveedor.' });
    } finally {
        // Bloque de seguridad: Garantiza la devolución de la conexión
        if (connection) {
            await connection.close().catch(e => console.error("Error al cerrar conexión en PUT:", e));
        }
    }
};