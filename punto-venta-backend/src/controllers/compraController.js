// Archivo: src/controllers/compraController.js

const db = require('../db');
const oracledb = db.oracledb;


// 1. POST: INSERTAR CABECERA (Paso 1 del Front-end)
exports.insertCompraHeader = async (req, res) => {
    let connection;
    try {
        const {
            proveedor_id, numero_documento, tipo_pago, total_neto, impuestos_total
        } = req.body;

        if (!proveedor_id || !numero_documento) {
            return res.status(400).json({ error: 'Faltan datos de proveedor y documento.' });
        }
        
        connection = await db.oracledb.getConnection();
        
        const seqResult = await connection.execute("SELECT SEQ_COMPRAS.NEXTVAL FROM DUAL");
        const compraId = seqResult.rows[0].NEXTVAL;
        const totalBruto = parseFloat(total_neto) + parseFloat(impuestos_total); 

        // --- CORRECCIÓN CRÍTICA: ESTADO FIJO A 'ABIERTA' ---
        await connection.execute(
            `INSERT INTO COMPRAS (COMPRA_ID, PROVEEDOR_ID, FECHA_COMPRA, NUMERO_DOCUMENTO, TIPO_PAGO, 
                                  TOTAL_BRUTO, IMPUESTOS_TOTAL, TOTAL_NETO, ESTADO) 
             VALUES (:v1_id, :v2_prov, SYSDATE, :v3_doc, :v4_tipo, :v5_bruto, :v6_impuestos, :v7_neto, 'ABIERTA')`,
            { 
                v1_id: compraId, v2_prov: proveedor_id, v3_doc: numero_documento, v4_tipo: tipo_pago, 
                v5_bruto: totalBruto, v6_impuestos: impuestos_total, v7_neto: total_neto 
            },
            { autoCommit: true } // Guarda la cabecera inmediatamente
        );

        res.status(201).json({ 
            mensaje: 'Cabecera de compra registrada.', 
            compra_id: compraId
        });

    } catch (err) {
        console.error("ERROR - Inserción de Cabecera:", err);
        res.status(500).json({ error: 'Error al registrar cabecera: ' + err.message.split('\n')[0] });
    } finally {
        if (connection) await connection.close().catch(err => console.error(err));
    }
};

// Archivo: src/controllers/compraController.js (Añadir esta función)

// [GET] Obtener solo las compras que están 'ABIERTA'
exports.getComprasAbiertas = async (req, res) => {
    let connection;
    try {
        connection = await db.oracledb.getConnection();
        
        // Consulta que filtra por el estado 'ABIERTA'
        const result = await connection.execute(`
            SELECT 
                c.COMPRA_ID AS "compraId", 
                c.NUMERO_DOCUMENTO AS "numeroDocumento", 
                p.RAZON_SOCIAL AS "proveedorNombre", 
                c.TOTAL_NETO AS "totalNeto"
            FROM COMPRAS c
            JOIN PROVEEDORES p ON c.PROVEEDOR_ID = p.PROVEEDOR_ID
            WHERE c.ESTADO = 'ABIERTA'
            ORDER BY c.FECHA_COMPRA DESC
        `);

        res.status(200).json({ openDocuments: result.rows });
    } catch (err) {
        console.error("Error al obtener compras abiertas:", err);
        res.status(500).json({ error: 'Error interno al obtener documentos abiertos.' });
    } finally {
        if (connection) await connection.close().catch(err => console.error(err));
    }
};

// 2. POST: Insertar una línea de detalle de compra (Paso 2 del Front-end)
exports.insertCompraDetail = async (req, res) => {
    let connection;
    try {
        const { compraId, item } = req.body; 
        
        connection = await db.oracledb.getConnection();

        // VALIDACIÓN DE EXISTENCIA DE PRODUCTO: ELIMINADA. Confiamos en la Clave Foránea.
        
        // INSERTAR DETALLE DE COMPRA
        const detalleId = (await connection.execute("SELECT SEQ_DETALLE_COMPRAS.NEXTVAL FROM DUAL")).rows[0].NEXTVAL;
        
        // CORRECCIÓN FINAL: Usamos un binding simple y directo
        await connection.execute(
            `INSERT INTO DETALLE_COMPRAS (DETALLE_COMPRA_ID, COMPRA_ID, PRODUCTO_CODIGO, CANTIDAD, PRECIO_COSTO, DESCUENTO_LINEA, IMPUESTOS_LINEA)
             VALUES (:detId, :compraIdBind, :prodCod, :cant, :p_costo, :d_desc, :d_impLinea)`,
            { 
                detId: detalleId, 
                compraIdBind: compraId, 
                prodCod: item.codigo, 
                cant: item.cantidad, 
                p_costo: item.precio_costo, // <-- BIND SEGURO
                d_desc: item.descuento_linea, // <-- BIND SEGURO
                d_impLinea: item.impuestos_linea // <-- BIND SEGURO
            },
            { autoCommit: true } // COMMIT individual
        );

        res.status(201).json({ mensaje: 'Línea de detalle registrada.' });

    } catch (err) {
        // ... (Manejo de errores) ...
        console.error("ERROR FATAL al insertar detalle:", err);
        res.status(500).json({ error: 'Error al insertar línea: ' + err.message.split('\n')[0] });
    } finally {
        if (connection) await connection.close().catch(err => console.error(err));
    }
};

// 3. PUT: Actualizar Stock (Paso 3 del Front-end)
exports.updateStockManual = async (req, res) => {
    let connection;
    try {
        const { codigo, cantidad } = req.body;
        
        if (!codigo || !cantidad || cantidad <= 0) {
            return res.status(400).json({ error: 'El código y la cantidad son necesarios para actualizar el stock.' });
        }
        
        connection = await db.oracledb.getConnection();
        
        await connection.execute(
            `UPDATE PRODUCTOS SET STOCK_ACTUAL = STOCK_ACTUAL + :cant WHERE PRODUCTO_CODIGO = :codigo`,
            { cant: cantidad, codigo: codigo },
            { autoCommit: true } // COMMIT inmediato
        );
        res.status(200).json({ mensaje: 'Stock actualizado.' });
    } catch (err) {
        console.error("ERROR al actualizar stock:", err);
        res.status(500).json({ error: 'Error al actualizar stock: ' + err.message.split('\n')[0] });
    } finally {
        if (connection) await connection.close().catch(err => console.error(err));
    }
}

// Archivo: src/controllers/compraController.js (Añadir esta función)

exports.updateCompraHeader = async (req, res) => {
    let connection;
    try {
        const { total_neto, impuestos_total } = req.body;
        // CORRECCIÓN CRÍTICA: Obtener el ID del parámetro de la URL (req.params)
        const compraId = req.params.compraId; // <-- ESTO ES LO QUE ESTABA FALTANDO

        if (!compraId || total_neto === undefined || impuestos_total === undefined) {
            // Este error se dispara si no se encuentra el ID en la URL
            return res.status(400).json({ error: 'Faltan datos de compraId o totales.' });
        }
        
        connection = await db.oracledb.getConnection();
        const totalBruto = parseFloat(total_neto) + parseFloat(impuestos_total); 

        // UPDATE DE LA CABECERA (SOLO TOTALES)
        const result = await connection.execute(
            `UPDATE COMPRAS 
             SET TOTAL_NETO = :neto, IMPUESTOS_TOTAL = :imp, TOTAL_BRUTO = :bruto
             WHERE COMPRA_ID = :id`,
            { 
                neto: total_neto, 
                imp: impuestos_total, 
                bruto: totalBruto, 
                id: compraId // Usamos el ID capturado de la URL
            },
            { autoCommit: true }
        );

        if (result.rowsAffected === 0) {
            return res.status(404).json({ error: `Cabecera de compra ID ${compraId} no encontrada.` });
        }

        res.status(200).json({ mensaje: 'Totales de cabecera actualizados.' });

    } catch (err) {
        console.error("ERROR - Actualización de Cabecera:", err);
        res.status(500).json({ error: 'Error al actualizar cabecera: ' + err.message.split('\n')[0] });
    } finally {
        if (connection) await connection.close().catch(err => console.error(err));
    }
};

exports.updateCompraStatus = async (req, res) => {
    let connection;
    try {
        const { compraId } = req.params; // ID de la compra a actualizar (desde la URL)
        const { nuevo_estado } = req.body; // El nuevo estado (e.g., 'CERRADA' o 'FINALIZADA')

        if (!compraId || !nuevo_estado) {
            return res.status(400).json({ error: 'Faltan datos de compraId o nuevo_estado.' });
        }
        
        connection = await db.oracledb.getConnection();
        
        // UPDATE DE LA CABECERA (SOLO EL ESTADO)
        const result = await connection.execute(
            `UPDATE COMPRAS 
             SET ESTADO = :estado 
             WHERE COMPRA_ID = :id`,
            { estado: nuevo_estado, id: compraId },
            { autoCommit: true }
        );

        if (result.rowsAffected === 0) {
            return res.status(404).json({ error: `Cabecera de compra ID ${compraId} no encontrada.` });
        }

        res.status(200).json({ mensaje: `Estado de compra ${compraId} actualizado a ${nuevo_estado}.` });

    } catch (err) {
        console.error("ERROR - Actualización de Estado:", err);
        res.status(500).json({ error: 'Error al actualizar el estado: ' + err.message.split('\n')[0] });
    } finally {
        if (connection) await connection.close().catch(err => console.error(err));
    }
};

// [GET] Obtener Historial (Solo estado 'CERRADA' o 'FINALIZADA')
exports.getComprasHistorial = async (req, res) => {
    let connection;
    try {
        connection = await db.oracledb.getConnection();
        const result = await connection.execute(`
            SELECT 
                c.COMPRA_ID AS "compraId", c.FECHA_COMPRA AS "fechaCompra", 
                p.RAZON_SOCIAL AS "proveedorNombre", c.NUMERO_DOCUMENTO AS "numeroDocumento",
                c.TOTAL_BRUTO AS "totalBruto", c.ESTADO AS "estado"
            FROM COMPRAS c
            JOIN PROVEEDORES p ON c.PROVEEDOR_ID = p.PROVEEDOR_ID
            WHERE c.ESTADO = 'CERRADA' OR c.ESTADO = 'CERRADA'
            ORDER BY c.FECHA_COMPRA DESC
        `);
        res.status(200).json({ closedDocuments: result.rows });
    } catch (err) {
        console.error("Error al obtener historial:", err);
        res.status(500).json({ error: 'Error interno al obtener historial.' });
    } finally {
        if (connection) await connection.close().catch(err => console.error(err));
    }
};

// [GET] Obtener Detalle Completo de Compra por ID (Para el reporte/PDF)
exports.getCompraDetalleCompleto = async (req, res) => {
    let connection;
    try {
        const compraId = req.params.compraId; // ID que viene de la URL
        
        connection = await db.oracledb.getConnection();
        
        // 1. Obtener la cabecera (incluye totales y proveedor)
        const headerResult = await connection.execute(`
            SELECT 
                c.COMPRA_ID, c.NUMERO_DOCUMENTO, c.TOTAL_NETO, c.IMPUESTOS_TOTAL, c.TOTAL_BRUTO,
                p.RAZON_SOCIAL AS "proveedorNombre"
            FROM COMPRAS c
            JOIN PROVEEDORES p ON c.PROVEEDOR_ID = p.PROVEEDOR_ID
            WHERE c.COMPRA_ID = :id`,
            { id: compraId }
        );
        
        // 2. Obtener el detalle de productos
        const detalleResult = await connection.execute(`
            SELECT 
                d.PRODUCTO_CODIGO AS "codigo", d.CANTIDAD AS "cantidad", 
                d.PRECIO_COSTO AS "costoUnitario", d.IMPUESTOS_LINEA AS "impuestoLinea",
                (d.CANTIDAD * d.PRECIO_COSTO) AS "subtotalLinea"
            FROM DETALLE_COMPRAS d
            WHERE d.COMPRA_ID = :id`,
            { id: compraId }
        );

        // Devolver un objeto consolidado para el reporte
        res.status(200).json({ 
            header: headerResult.rows[0] || {}, 
            detalle: detalleResult.rows 
        });

    } catch (err) {
        console.error("Error al obtener detalle de compra:", err);
        res.status(500).json({ error: 'Error interno al obtener detalle.' });
    } finally {
        if (connection) await connection.close().catch(err => console.error(err));
    }
};