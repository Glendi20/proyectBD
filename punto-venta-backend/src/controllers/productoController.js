// Archivo: punto-venta-backend/src/controllers/productoController.js

const db = require('../db');

// [GET] Obtener todos los productos (Catálogo Básico)
exports.getAllProductos = async (req, res) => {
    let connection;
    try {
        connection = await db.oracledb.getConnection();
        const result = await connection.execute(`
            SELECT 
                p.PRODUCTO_CODIGO, p.NOMBRE, p.MARCA, p.PRECIO_VENTA, p.STOCK_ACTUAL, 
                p.STOCK_MINIMO, c.NOMBRE AS CATEGORIA, p.ESTADO
            FROM PRODUCTOS p
            JOIN CATEGORIAS c ON p.CATEGORIA_ID = c.CATEGORIA_ID
            ORDER BY p.NOMBRE
        `);
        res.status(200).json(result.rows);
    } catch (err) {
        console.error("Error al obtener productos:", err);
        res.status(500).json({ error: 'Error interno al obtener productos.' });
    } finally {
        if (connection) {
            await connection.close().catch(err => console.error(err));
        }
    }
};

// [POST] Crear un nuevo producto (inserción directa)
exports.createProducto = async (req, res) => {
    let connection;
    try {
        const { 
            producto_codigo, nombre, marca, descripcion, precio_venta, precio_costo, 
            unidad_medida, stock_minimo, categoria_id 
        } = req.body;
        
        connection = await db.oracledb.getConnection();

        await connection.execute(
            `INSERT INTO PRODUCTOS (PRODUCTO_CODIGO, NOMBRE, MARCA, DESCRIPCION, PRECIO_VENTA, PRECIO_COSTO, UNIDAD_MEDIDA, STOCK_ACTUAL, STOCK_MINIMO, CATEGORIA_ID, ESTADO)
             VALUES (:cod, :nom, :mar, :desc, :pv, :pc, :um, 0, :sm, :cat_id, 'activo')`,
            { 
                cod: producto_codigo, nom: nombre, mar: marca, desc: descripcion, 
                pv: precio_venta, pc: precio_costo, um: unidad_medida, sm: stock_minimo, cat_id: categoria_id
            },
            { autoCommit: true }
        );

        res.status(201).json({ mensaje: 'Producto registrado exitosamente.', codigo: producto_codigo });

    } catch (err) {
        console.error("Error al registrar producto:", err);
        const errorMessage = err.message.split('\n')[0];
        res.status(400).json({ error: errorMessage || 'Error al registrar el producto.' });
    } finally {
        if (connection) {
            await connection.close().catch(err => console.error(err));
        }
    }
};