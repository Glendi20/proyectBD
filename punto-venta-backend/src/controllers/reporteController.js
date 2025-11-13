// Archivo: src/controllers/reporteController.js

const db = require('../db');
const oracledb = db.oracledb;

// [GET] Reporte de Mejores 50 Clientes por Venta Total
exports.getMejoresClientes = async (req, res) => {
    let connection;
    try {
        connection = await db.oracledb.getConnection();

        // Consulta SQL para agrupar por cliente, sumar TOTAL_BRUTO de ventas finalizadas y limitar a 50
        const query = `
            SELECT 
                v.CLIENTE_ID AS "CLIENTE_ID",
                c.NOMBRE || ' ' || c.APELLIDOS AS "NOMBRE_CLIENTE", -- Concatenar Nombre y Apellidos
                SUM(v.TOTAL_BRUTO) AS "TOTAL_VENTA"
            FROM 
                VENTAS v
            INNER JOIN 
                CLIENTES c 
                ON v.CLIENTE_ID = c.CLIENTE_ID
            WHERE 
                v.ESTADO_PAGO IN ('contado', 'crédito') -- Solo ventas finalizadas
            GROUP BY 
                v.CLIENTE_ID, 
                c.NOMBRE,
                c.APELLIDOS
            ORDER BY 
                "TOTAL_VENTA" DESC
            FETCH FIRST 50 ROWS ONLY
        `;

        const result = await connection.execute(
            query,
            [], // No hay binds dinámicos en esta consulta
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        // Devolvemos el array de clientes
        res.status(200).json(result.rows);

    } catch (err) {
        console.error("Error al generar reporte de mejores clientes:", err);
        // Si hay un error de Oracle, devolvemos el mensaje al cliente
        res.status(500).json({ error: err.message.split('\n')[0] || 'Error interno al generar el reporte.' });
    } finally {
        if (connection) await connection.close().catch(err => console.error(err));
    }
};

// [GET] Reporte de Top 50 Productos Vendidos por Cantidad
exports.getTopProductosVendidos = async (req, res) => {
    let connection;
    try {
        connection = await db.oracledb.getConnection();

        // Consulta SQL: Agrupa por producto, suma la cantidad de ventas (DETALLE_VENTAS) y limita a 50
        const query = `
            SELECT
                dv.PRODUCTO_CODIGO AS "PRODUCTO_CODIGO",
                p.NOMBRE AS "PRODUCTO_NOMBRE",
                SUM(dv.CANTIDAD) AS "CANTIDAD_TOTAL_VENDIDA"
            FROM
                DETALLE_VENTAS dv
            INNER JOIN
                PRODUCTOS p ON dv.PRODUCTO_CODIGO = p.PRODUCTO_CODIGO
            GROUP BY
                dv.PRODUCTO_CODIGO,
                p.NOMBRE
            ORDER BY
                "CANTIDAD_TOTAL_VENDIDA" DESC
            FETCH FIRST 50 ROWS ONLY
        `;

        const result = await connection.execute(
            query,
            [],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        res.status(200).json(result.rows);

    } catch (err) {
        console.error("Error al generar reporte de productos más vendidos:", err);
        res.status(500).json({ error: err.message.split('\n')[0] || 'Error interno al generar el reporte.' });
    } finally {
        if (connection) await connection.close().catch(err => console.error(err));
    }
};

// [GET] Reporte de Productos con Stock Actual <= Stock Mínimo
exports.getStockBajo = async (req, res) => {
    let connection;
    try {
        connection = await db.oracledb.getConnection();

        // Consulta SQL para identificar productos cuyo STOCK_ACTUAL es igual o menor al STOCK_MINIMO
        const query = `
            SELECT
                PRODUCTO_CODIGO AS "codigo",
                NOMBRE AS "nombre",
                STOCK_ACTUAL AS "stockActual",
                STOCK_MINIMO AS "stockMinimo"
            FROM
                PRODUCTOS
            WHERE
                STOCK_ACTUAL <= STOCK_MINIMO
                AND ESTADO = 'activo' -- Solo productos activos
            ORDER BY
                STOCK_ACTUAL ASC
        `;

        const result = await connection.execute(
            query,
            [],
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        res.status(200).json(result.rows);

    } catch (err) {
        console.error("Error al generar reporte de stock bajo:", err);
        res.status(500).json({ error: err.message.split('\n')[0] || 'Error interno al generar el reporte.' });
    } finally {
        if (connection) await connection.close().catch(err => console.error(err));
    }
};

// [GET] Reporte de Créditos de Compra Próximos a Vencer
exports.getCreditosPorVencer = async (req, res) => {
    let connection;
    try {
        connection = await db.oracledb.getConnection();

        // Número de días para considerar como "próximo a vencer"
        const DIAS_ALERTA = 15; 
        
        const query = `
            SELECT
                c.COMPRA_ID AS "compraId",
                p.RAZON_SOCIAL AS "proveedorNombre",
                c.FECHA_COMPRA AS "fechaCompra",
                p.PLAZO_CREDITO_DIAS AS "plazoDias",
                c.TOTAL_BRUTO AS "montoPendiente",
                
                -- Cálculo de días restantes
                (c.FECHA_COMPRA + p.PLAZO_CREDITO_DIAS - SYSDATE) AS "DIAS_RESTANTES"
            
            FROM
                COMPRAS c
            JOIN
                PROVEEDORES p ON c.PROVEEDOR_ID = p.PROVEEDOR_ID
            WHERE
                -- CRÍTICO: SOLO FILTRAMOS POR TIPO DE PAGO. Ignoramos el ESTADO.
                UPPER(c.TIPO_PAGO) = 'CRÉDITO' 
                
                -- Filtro de Alerta: Vence en 15 días o menos (o ya venció)
                AND (c.FECHA_COMPRA + p.PLAZO_CREDITO_DIAS - SYSDATE) <= :diasAlerta
                
            ORDER BY
                "DIAS_RESTANTES" ASC
        `;

        const result = await connection.execute(
            query,
            { diasAlerta: DIAS_ALERTA },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        res.status(200).json(result.rows);

    } catch (err) {
        console.error("Error al generar reporte de créditos por vencer:", err);
        res.status(500).json({ error: err.message.split('\n')[0] || 'Error interno al generar el reporte.' });
    } finally {
        if (connection) await connection.close().catch(err => console.error(err));
    }
};

// [GET] Reporte de Cuentas por Cobrar Próximas a Vencer
exports.getVentasPorCobrar = async (req, res) => {
    let connection;
    try {
        connection = await db.oracledb.getConnection();

        // Constantes del Plazo y la Alerta (Requisitos del usuario)
        const PLAZO_DEFAULT_DIAS = 15;
        const DIAS_ALERTA = 10; 
        
        // La consulta busca todas las ventas con ESTADO_PAGO = 'crédito'
        const query = `
            SELECT
                v.VENTA_ID AS "ventaId",
                c.NOMBRE AS "clienteNombre",
                v.FECHA_VENTA AS "fechaVenta",
                v.TOTAL_BRUTO AS "montoPendiente",
                
                -- Cálculo de días restantes (Fecha Compra + Plazo - Fecha Actual)
                (v.FECHA_VENTA + :plazoDefault - SYSDATE) AS "DIAS_RESTANTES",
                
                -- Incluimos el plazo default para el frontend
                :plazoDefault AS "plazoDias"
            
            FROM
                VENTAS v
            JOIN
                CLIENTES c ON v.CLIENTE_ID = c.CLIENTE_ID
            WHERE
                v.ESTADO_PAGO = 'crédito' 
                -- Filtro 2: Vence en 10 días o menos (o ya venció)
                AND (v.FECHA_VENTA + :plazoDefault - SYSDATE) <= :diasAlerta
                
            ORDER BY
                "DIAS_RESTANTES" ASC -- Muestra primero las que están más cerca de vencer
        `;

        const result = await connection.execute(
            query,
            { 
                plazoDefault: PLAZO_DEFAULT_DIAS,
                diasAlerta: DIAS_ALERTA
            },
            { outFormat: oracledb.OUT_FORMAT_OBJECT }
        );

        res.status(200).json(result.rows);

    } catch (err) {
        console.error("Error al generar reporte de cuentas por cobrar:", err);
        res.status(500).json({ error: err.message.split('\n')[0] || 'Error interno al generar el reporte.' });
    } finally {
        if (connection) await connection.close().catch(err => console.error(err));
    }
};

