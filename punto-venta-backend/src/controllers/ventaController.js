// Archivo: src/controllers/ventaController.js (INICIO LIMPIO)

const db = require('../db');
const oracledb = db.oracledb;

// [GET] Listado de Clientes (Para que el frontend pueda validar la existencia)
exports.getAllClientes = async (req, res) => {
    let connection;
    try {
        connection = await db.oracledb.getConnection();
        const result = await connection.execute(`SELECT CLIENTE_ID AS "id", NOMBRE AS "nombre", APELLIDOS AS "apellidos" FROM CLIENTES WHERE ESTADO = 'activo'`);
        res.status(200).json(result.rows);
    } catch (err) {
        console.error("Error al obtener clientes:", err);
        res.status(500).json({ error: 'Error interno al obtener clientes.' });
    } finally {
        if (connection) await connection.close().catch(err => console.error(err));
    }
};


// [POST] 1. INSERTAR CABECERA DE VENTA (SOLO CABECERA, TOTALES CERO)
exports.insertVentaHeader = async (req, res) => {
    let connection;
    try {
        // Recibimos los datos esenciales desde el frontend
        const { cliente_id, tipo_pago, vendedor_id, tipo_factura } = req.body;
        
        // Asignamos el ESTADO y Totales CERO para la inserción inicial
        const totalBruto = 0;
        const impuestosTotal = 0;
        const totalNeto = 0;
        const estadoInicial = 'ABIERTA';
        
        connection = await db.oracledb.getConnection(); 
        
        // 1. Generar ID de Venta
        const seqResult = await connection.execute("SELECT SEQ_VENTAS.NEXTVAL FROM DUAL");
        const ventaId = seqResult.rows[0].NEXTVAL;

        // 2. INSERTAR CABECERA
        await connection.execute(
            `INSERT INTO VENTAS (VENTA_ID, CLIENTE_ID, FECHA_VENTA, VENDEDOR_ID, TIPO_PAGO, 
                                 TOTAL_BRUTO, IMPUESTOS_TOTAL, TOTAL_NETO, TIPO_FACTURA, ESTADO_PAGO) 
             VALUES (:vId, :cliId, SYSDATE, :vendId, :tipoPago, :bruto, :imp, :neto, :tipoFac, :estado)`,
            { 
                vId: ventaId, 
                cliId: cliente_id, 
                vendId: vendedor_id, 
                tipoPago: tipo_pago,
                bruto: totalBruto, 
                imp: impuestosTotal, 
                neto: totalNeto,
                tipoFac: tipo_factura || 'E-FACT', // Usamos un default si no se especifica
                estado: estadoInicial
            },
            { autoCommit: true } // Commit inmediatamente después de la inserción de la cabecera
        );

        res.status(201).json({ mensaje: 'Cabecera de venta registrada.', venta_id: ventaId });

    } catch (err) {
        console.error("Error al insertar cabecera de venta:", err);
        const errorMessage = err.message.split('\n')[0];
        res.status(400).json({ error: errorMessage || 'Error al procesar la cabecera de venta.' });
        
    } finally {
        if (connection) await connection.close().catch(err => console.error(err));
    }
};
// [GET] Obtener solo las ventas que están 'ABIERTA'
exports.getVentasAbiertas = async (req, res) => {
    let connection;
    try {
        const estadoRequerido = 'ABIERTA'; // El estado que insertamos en la cabecera
        
        connection = await db.oracledb.getConnection();
        
        // Consulta: La columna ESTADO_PAGO existe
        const result = await connection.execute(
            `SELECT 
                v.VENTA_ID AS "ventaId", 
                v.FECHA_VENTA AS "fechaVenta", 
                c.NOMBRE AS "clienteNombre",
                v.TOTAL_BRUTO AS "totalBruto"
            FROM VENTAS v
            JOIN CLIENTES c ON v.CLIENTE_ID = c.CLIENTE_ID
            WHERE v.ESTADO_PAGO = :estado`, // CRÍTICO: Usando ESTADO_PAGO de la tabla VENTAS
            { estado: estadoRequerido }
        );

        res.status(200).json({ openDocuments: result.rows });
    } catch (err) {
        console.error("Error al obtener ventas abiertas:", err);
        res.status(500).json({ error: 'Error interno al obtener documentos abiertos.' });
    } finally {
        if (connection) await connection.close().catch(err => console.error(err));
    }
};


// [GET] Búsqueda Rápida de Productos (Para llenar el carrito)
exports.searchProductos = async (req, res) => {
    let connection;
    try {
        const searchTerm = req.query.q; 
        if (!searchTerm) return res.status(200).json([]); // Retorna vacío si no hay término

        connection = await db.oracledb.getConnection();
        
        // Consulta que obtiene stock y precio para la interfaz de caja
        const result = await connection.execute(
            `SELECT 
                PRODUCTO_CODIGO AS "codigo", 
                NOMBRE AS "nombre", 
                PRECIO_VENTA AS "precio",
                STOCK_ACTUAL AS "stock"
            FROM PRODUCTOS
            WHERE ESTADO = 'activo'
              AND (UPPER(PRODUCTO_CODIGO) LIKE UPPER(:search) OR UPPER(NOMBRE) LIKE UPPER(:search))
            ORDER BY NOMBRE
            FETCH NEXT 15 ROWS ONLY`,
            { search: `%${searchTerm}%` }
        );

        res.status(200).json(result.rows);
    } catch (err) {
        console.error("Error en la búsqueda de productos:", err);
        res.status(500).json({ error: 'Error interno en la búsqueda de productos.' });
    } finally {
        if (connection) await connection.close().catch(err => console.error(err));
    }
};



// [POST] 2. INSERTAR DETALLE (SOLO INSERCIÓN EN DETALLE_VENTAS)
exports.insertarDetalleVenta = async (req, res) => {
    let connection;
    try {
        // ... (Parseo de variables) ...
        const { ventaId, producto_codigo } = req.body; 
        const cantidad = parseFloat(req.body.cantidad);
        const precio_venta = parseFloat(req.body.precio_venta);
        const descuento_linea = parseFloat(req.body.descuento_linea || 0);
        const impuestos_linea = parseFloat(req.body.impuestos_linea || 0);

        // ... (Validaciones) ...
        
        connection = await db.oracledb.getConnection(); 
        
        // *************************************************************
        // ** CRÍTICO: 1. GENERAR EL ID DEL DETALLE USANDO UNA SECUENCIA **
        // *************************************************************
        const seqResult = await connection.execute("SELECT SEQ_DETALLE_VENTAS.NEXTVAL FROM DUAL");
        const detalleVentaId = seqResult.rows[0].NEXTVAL;
        
        // 2. INSERTAR DETALLE DE VENTA
        await connection.execute(
            // ** CRÍTICO: AÑADIR DETALLE_VENTA_ID y la variable ligada :detVtaId **
            `INSERT INTO DETALLE_VENTAS (DETALLE_VENTA_ID, VENTA_ID, PRODUCTO_CODIGO, CANTIDAD, PRECIO_VENTA, DESCUENTO_LINEA, IMPUESTOS_LINEA)
              VALUES (:detVtaId, :vId, :prodCod, :cant, :pv, :descuentoLinea, :impLinea)`,
            { 
                detVtaId: detalleVentaId, // <-- Nuevo Binding
                vId: ventaId, 
                prodCod: producto_codigo, 
                cant: cantidad, 
                pv: precio_venta, 
                descuentoLinea: descuento_linea, 
                impLinea: impuestos_linea 
            },
            { autoCommit: true }
        );

        res.status(201).json({ mensaje: 'Línea de detalle registrada.', venta_id: ventaId, detalle_id: detalleVentaId });

    } catch (err) {
        // ...
    } finally {
        if (connection) await connection.close().catch(err => console.error(err));
    }
};

exports.updateVentaHeader = async (req, res) => {
    let connection;
    try {
        // 1. Recibir datos finales de la cabecera
        const { 
            ventaId, 
            totalBruto, 
            impuestosTotal, 
            totalNeto 
        } = req.body; 

        if (!ventaId || totalBruto == null || impuestosTotal == null || totalNeto == null) {
            return res.status(400).json({ error: 'Faltan datos críticos para actualizar la cabecera.' });
        }
        
        connection = await db.oracledb.getConnection(); 
        
        // ** CRÍTICO: Eliminamos la actualización de ESTADO_PAGO a 'PAGADA' **
        // La venta se mantiene en el estado inicial: 'ABIERTA' o el que tuviera.

        // 3. Ejecutar el UPDATE: Solo actualiza los totales.
        const result = await connection.execute(
            `UPDATE VENTAS SET 
                TOTAL_BRUTO = :bruto, 
                IMPUESTOS_TOTAL = :imp, 
                TOTAL_NETO = :neto
            WHERE VENTA_ID = :vId
            AND ESTADO_PAGO = 'ABIERTA'`, // Mantenemos la condición de solo actualizar si está abierta
            { 
                bruto: totalBruto, 
                imp: impuestosTotal, 
                neto: totalNeto, 
                vId: ventaId
            },
            { autoCommit: true } 
        );

        if (result.rowsAffected === 0) {
            return res.status(404).json({ error: `No se pudo actualizar la cabecera de la Venta ID: ${ventaId}. Puede que ya esté cerrada o no exista.` });
        }

        // Mensaje ajustado para indicar que solo se actualizaron totales.
        res.status(200).json({ mensaje: `Cabecera de venta ID ${ventaId} actualizada con totales. Estado permanece ABIERTA.` });

    } catch (err) {
        console.error("Error al actualizar cabecera de venta:", err);
        const errorMessage = err.message.split('\n')[0];
        res.status(500).json({ error: errorMessage || 'Error interno al actualizar la cabecera de venta.' });
        
    } finally {
        if (connection) await connection.close().catch(err => console.error(err));
    }
};

exports.updateStockManual = async (req, res) => {
    let connection;
    try {
        const { codigo, cantidad } = req.body;
        
        if (!codigo || !cantidad || cantidad <= 0) {
            return res.status(400).json({ error: 'El código y la cantidad son necesarios para actualizar el stock.' });
        }
        
        connection = await db.oracledb.getConnection();
        
        // 1. Chequeo de Stock
        const stockCheck = await connection.execute(
            `SELECT STOCK_ACTUAL FROM PRODUCTOS WHERE PRODUCTO_CODIGO = :codigo`,
            { codigo: codigo }
        );
        if (stockCheck.rows.length === 0 || stockCheck.rows[0].STOCK_ACTUAL < cantidad) {
            throw new Error(`ORA-20016: Stock insuficiente para el producto ${codigo}.`);
        }


        // 2. ACTUALIZAR STOCK ACTUAL (Decremento)
        await connection.execute(
            `UPDATE PRODUCTOS SET STOCK_ACTUAL = STOCK_ACTUAL - :cant WHERE PRODUCTO_CODIGO = :codigo`,
            { cant: cantidad, codigo: codigo },
            { autoCommit: true } // COMMIT individual
        );
        res.status(200).json({ mensaje: 'Stock actualizado (decremento).' });
    } catch (err) {
        console.error("ERROR al actualizar stock:", err);
        const errorMessage = err.message.split('\n')[0];
        res.status(500).json({ error: errorMessage || 'Error al actualizar stock.' });
    } finally {
        if (connection) await connection.close().catch(err => console.error(err));
    }
};

// Endpoint Asumido: [PUT] /api/ventas/checkout/:ventaId
const normalizeAndUpper = (text) => {
    if (!text) return '';
    return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
};
// --------------------------------------------------------

exports.processCheckout = async (req, res) => {
    let connection;
    try {
        const ventaId = req.params.ventaId;
        const { tipo_pago, monto_recibido } = req.body; 
        
        if (!ventaId || !tipo_pago) {
            return res.status(400).json({ error: 'Faltan datos críticos (ID de Venta o Tipo de Pago).' });
        }
        
        connection = await db.oracledb.getConnection();

        // 1. OBTENER DATOS DE LA VENTA Y EL CLIENTE
        const ventaResult = await connection.execute(
            `SELECT v.CLIENTE_ID AS CLIENTE_ID, 
                    v.TOTAL_BRUTO AS TOTAL_BRUTO, 
                    TRIM(c.TIPO_CLIENTE) AS TIPO_CLIENTE, 
                    c.LIMITE_CREDITO AS LIMITE_CREDITO
             FROM VENTAS v
             JOIN CLIENTES c ON v.CLIENTE_ID = c.CLIENTE_ID
             WHERE v.VENTA_ID = :vId`,
            { vId: ventaId },
            { outFormat: db.oracledb.OUT_FORMAT_OBJECT }
        );
        // ... (El resto de la obtención de datos se mantiene) ...
        const ventaData = ventaResult.rows[0];
        const clienteId = ventaData.CLIENTE_ID;
        const totalBruto = ventaData.TOTAL_BRUTO;
        const tipoCliente = ventaData.TIPO_CLIENTE;
        const limiteCredito = ventaData.LIMITE_CREDITO || 0; // Aseguramos que sea 0 si es NULL
        const totalVenta = totalBruto;
        
        let estadoFinal;
        let tipoPagoDB;
        let mensaje;
        let vuelto = 0;

        // --- LÓGICA DE PAGO ---

        if (tipo_pago === 'Contado') {
            // Este bloque ya funciona
            vuelto = parseFloat(monto_recibido) - totalVenta;
            estadoFinal = 'contado'; 
            tipoPagoDB = 'contado';
            mensaje = `Venta finalizada al contado. Vuelto: Q${vuelto.toFixed(2)}`;

        } else if (tipo_pago === 'Crédito') { // <--- TRUE si el Frontend envía 'Crédito'
            
            // Validamos cliente: comparamos con 'mayorista' (minúsculas)
            const tipoClienteNormalizado = tipoCliente ? tipoCliente.trim().toLowerCase() : '';

            if (tipoClienteNormalizado !== 'mayorista') { 
                return res.status(403).json({ error: `El cliente (${tipoCliente || 'Tipo no definido'}) no es mayorista y no puede pagar a crédito.` });
            }
            
            // 2. OBTENER SALDO PENDIENTE
            const saldoResult = await connection.execute(
                `SELECT SUM(TOTAL_BRUTO) AS SALDO_PENDIENTE
                 FROM VENTAS
                 WHERE CLIENTE_ID = :cliId AND ESTADO_PAGO = 'crédito'`,
                { cliId: clienteId },
                { outFormat: db.oracledb.OUT_FORMAT_OBJECT }
            );
            
            const saldoPendiente = saldoResult.rows[0].SALDO_PENDIENTE || 0;
            const nuevoSaldo = saldoPendiente + totalVenta;

            // 3. VALIDAR LÍMITE DE CRÉDITO
            if (nuevoSaldo > limiteCredito) {
                return res.status(400).json({ 
                    error: `Límite de crédito excedido. Límite: Q${limiteCredito.toFixed(2)}, Saldo actual: Q${saldoPendiente.toFixed(2)}, Venta: Q${totalVenta.toFixed(2)}.` 
                });
            }

            // *** Asignar valores de la restricción ***
            estadoFinal = 'crédito';
            tipoPagoDB = 'crédito';
            mensaje = `Venta procesada a crédito. Nuevo saldo: Q${nuevoSaldo.toFixed(2)}`;
            vuelto = 0;
            
        } else {
            return res.status(400).json({ error: 'Tipo de pago no válido.' });
        }

        // 4. ACTUALIZAR ESTADO DE LA VENTA
        await connection.execute(
            `UPDATE VENTAS SET 
                ESTADO_PAGO = :estado, 
                TIPO_PAGO = :tipoPago 
             WHERE VENTA_ID = :vId`,
            { 
                estado: estadoFinal, 
                tipoPago: tipoPagoDB, 
                vId: ventaId 
            },
            { autoCommit: true }
        );

        // 5. RESPUESTA FINAL
        res.status(200).json({ mensaje: mensaje, vuelto: vuelto });

    } catch (err) {
        console.error("Error al procesar el checkout:", err);
        res.status(500).json({ error: err.message.split('\n')[0] || 'Error interno al procesar el pago.' });
    } finally {
        if (connection) await connection.close().catch(err => console.error(err));
    }
};

// [GET] Listado de Ventas Cerradas/Finalizadas (Contado o Crédito)
exports.getVentasCerradas = async (req, res) => {
    let connection;
    try {
        const estadosFinales = ['contado', 'crédito']; // Los estados que confirmamos
        
        connection = await db.oracledb.getConnection();
        
        // La consulta busca ventas que ya no están 'ABIERTA'
        const result = await connection.execute(
            `SELECT 
                v.VENTA_ID AS "ventaId", 
                v.FECHA_VENTA AS "fechaVenta", 
                c.NOMBRE AS "clienteNombre",
                v.TOTAL_BRUTO AS "totalBruto",
                v.ESTADO_PAGO AS "estadoPago",
                v.TIPO_PAGO AS "tipoPago"
            FROM VENTAS v
            JOIN CLIENTES c ON v.CLIENTE_ID = c.CLIENTE_ID
            WHERE v.ESTADO_PAGO IN (:estado1, :estado2)
            ORDER BY v.FECHA_VENTA DESC`,
            { 
                estado1: estadosFinales[0], // 'contado'
                estado2: estadosFinales[1]  // 'crédito'
            },
            { outFormat: db.oracledb.OUT_FORMAT_OBJECT }
        );

        res.status(200).json({ closedDocuments: result.rows });
    } catch (err) {
        console.error("Error al obtener ventas cerradas:", err);
        res.status(500).json({ error: 'Error interno al obtener el historial de ventas.' });
    } finally {
        if (connection) await connection.close().catch(err => console.error(err));
    }
};

// [GET] /api/ventas/factura/:ventaId
exports.getFacturaCompleta = async (req, res) => {
    let connection;
    try {
        const ventaId = req.params.ventaId;
        if (!ventaId) return res.status(400).json({ error: 'ID de venta requerido.' });

        connection = await db.oracledb.getConnection();

        // 1. OBTENER CABECERA Y TOTALES FINALES
        const headerResult = await connection.execute(
            `SELECT VENTA_ID, FECHA_VENTA, CLIENTE_ID, TIPO_PAGO, TOTAL_BRUTO, 
                    IMPUESTOS_TOTAL, TOTAL_NETO, VENDEDOR_ID, ESTADO_PAGO
             FROM VENTAS WHERE VENTA_ID = :vId`,
            { vId: ventaId },
            { outFormat: db.oracledb.OUT_FORMAT_OBJECT }
        );

        if (headerResult.rows.length === 0) {
            return res.status(404).json({ error: 'Factura no encontrada.' });
        }
        const header = headerResult.rows[0];

        // 2. OBTENER DATOS DEL CLIENTE (Nombre y Apellido)
        const clientResult = await connection.execute(
            `SELECT NOMBRE, APELLIDOS FROM CLIENTES WHERE CLIENTE_ID = :cliId`,
            { cliId: header.CLIENTE_ID },
            { outFormat: db.oracledb.OUT_FORMAT_OBJECT }
        );
        const cliente = clientResult.rows[0] || {};
        
        // 3. OBTENER DETALLES DE LA LÍNEA
        // *** CRÍTICO: Usamos LEFT JOIN para que la consulta no falle si el PRODUCTO ha sido borrado. ***
        const detailResult = await connection.execute(
            `SELECT dv.PRODUCTO_CODIGO, p.NOMBRE AS PRODUCTO_NOMBRE, dv.CANTIDAD, 
                    dv.PRECIO_VENTA, dv.DESCUENTO_LINEA, dv.IMPUESTOS_LINEA
             FROM DETALLE_VENTAS dv
             LEFT JOIN PRODUCTOS p ON dv.PRODUCTO_CODIGO = p.PRODUCTO_CODIGO
             WHERE dv.VENTA_ID = :vId`,
            { vId: ventaId },
            { outFormat: db.oracledb.OUT_FORMAT_OBJECT }
        );
        
        // 4. CONSTRUIR LA RESPUESTA FINAL
        res.status(200).json({
            cabecera: {
                ...header,
                CLIENTE_NOMBRE: `${cliente.NOMBRE || ''} ${cliente.APELLIDOS || ''}`.trim(),
            },
            detalles: detailResult.rows
        });

    } catch (err) {
        console.error("Error FATAL al obtener factura completa:", err);
        // Devolvemos el error real para debugging
        res.status(500).json({ error: err.message.split('\n')[0] || 'Error interno al consultar la factura.' });
    } finally {
        if (connection) await connection.close().catch(err => console.error(err));
    }
};