// Archivo: src/controllers/compraController.js

const db = require('../db');
const oracledb = db.oracledb;


// 1. POST: INSERTAR CABECERA (Paso 1 del Front-end)
exports.insertCompraHeader = async (req, res) => {
    let connection;
    try {
        const { proveedor_id, numero_documento, tipo_pago, total_neto, impuestos_total } = req.body;

        if (!proveedor_id || !numero_documento) {
            return res.status(400).json({ error: 'Faltan datos de proveedor y documento.' });
        }
        
        connection = await db.oracledb.getConnection();
        
        // Obtener ID de Compra
        const seqResult = await connection.execute("SELECT SEQ_COMPRAS.NEXTVAL FROM DUAL");
        const compraId = seqResult.rows[0].NEXTVAL;
        const totalBruto = parseFloat(total_neto) + parseFloat(impuestos_total); 

        // INSERTAR CABECERA (Commit inmediato)
        await connection.execute(
            `INSERT INTO COMPRAS (COMPRA_ID, PROVEEDOR_ID, FECHA_COMPRA, NUMERO_DOCUMENTO, TIPO_PAGO, 
                                  TOTAL_BRUTO, IMPUESTOS_TOTAL, TOTAL_NETO, ESTADO) 
             VALUES (:v1_id, :v2_prov, SYSDATE, :v3_doc, :v4_tipo, :v5_bruto, :v6_impuestos, :v7_neto, 
                     CASE WHEN :v4_tipo = 'contado' THEN 'pagada' ELSE 'pendiente' END)`,
            { 
                v1_id: compraId, v2_prov: proveedor_id, v3_doc: numero_documento, v4_tipo: tipo_pago, 
                v5_bruto: totalBruto, v6_impuestos: impuestos_total, v7_neto: total_neto 
            },
            { autoCommit: true } // Guarda la cabecera inmediatamente
        );

        res.status(201).json({ 
            mensaje: 'Cabecera de compra registrada.', 
            compra_id: compraId // Devolvemos el ID para el detalle
        });

    } catch (err) {
        // Manejo de errores de restricción única (documento) o sintaxis
        console.error("ERROR - Inserción de Cabecera:", err);
        res.status(500).json({ error: 'Error al registrar cabecera: ' + err.message.split('\n')[0] });
    } finally {
        if (connection) await connection.close().catch(err => console.error(err));
    }
};