// Archivo: punto-venta-backend/src/controllers/ventaController.js

const db = require('../db');
const oracledb = db.oracledb;

// [POST] Pagar una Venta (Llama a SP_PAGAR_VENTA)
// Procesa pagos totales o parciales y actualiza saldos.
exports.pagarVenta = async (req, res) => {
    let connection;
    try {
        const { venta_id, monto_pago, usuario_cajero_id } = req.body;

        connection = await oracledb.getConnection();

        // Llama al procedimiento almacenado PL/SQL
        await connection.execute(
            `BEGIN SP_PAGAR_VENTA(:p_v_id, :p_monto, :p_cajero_id); END;`,
            {
                p_v_id: venta_id,
                p_monto: monto_pago,
                p_cajero_id: usuario_cajero_id
            }
        );

        res.status(200).json({ mensaje: 'Pago procesado exitosamente.' });

    } catch (err) {
        console.error("Error en pagarVenta:", err);
        const errorMessage = err.message.split('\n')[0];
        // Los errores de PL/SQL (-2000X) se envían de vuelta aquí
        res.status(400).json({ error: errorMessage || 'Error al procesar el pago.' });

    } finally {
        if (connection) {
            await connection.close().catch(err => console.error(err));
        }
    }
};

// [POST] Insertar Detalle de Venta (Llama a SP_INSERTAR_DETALLE_VENTA)
// Inserta una línea de producto y decrementa stock.
exports.insertarDetalleVenta = async (req, res) => {
    let connection;
    try {
        const { 
            venta_id, producto_codigo, cantidad, precio_venta, descuento_linea, impuestos_linea
        } = req.body;

        connection = await oracledb.getConnection();

        // Llama al procedimiento almacenado PL/SQL
        await connection.execute(
            `BEGIN SP_INSERTAR_DETALLE_VENTA(:p_v_id, :p_prod_cod, :p_cant, :p_pv, :p_desc, :p_imp); END;`,
            {
                p_v_id: venta_id, p_prod_cod: producto_codigo, p_cant: cantidad, 
                p_pv: precio_venta, p_desc: descuento_linea, p_imp: impuestos_linea
            }
        );

        res.status(201).json({ mensaje: 'Detalle de venta insertado y stock actualizado.' });

    } catch (err) {
        console.error("Error en insertarDetalleVenta:", err);
        const errorMessage = err.message.split('\n')[0];
        res.status(400).json({ error: errorMessage || 'Error al insertar detalle de venta.' });
    } finally {
        if (connection) {
            await connection.close().catch(err => console.error(err));
        }
    }
};

// Nota: Falta una ruta para crear la CABECERA de la venta. Se puede hacer aquí o en un SP.
// exports.createVentaCabecera = ...