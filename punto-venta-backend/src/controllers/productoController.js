// Archivo: punto-venta-backend/src/controllers/productoController.js

const db = require('../db');

// [GET] Obtener todos los productos (Catálogo Básico)
// Archivo: src/controllers/productoController.js (getAllProductos CORREGIDO)

exports.getAllProductos = async (req, res) => {
    let connection;
    try {
        connection = await db.oracledb.getConnection();
        
        // CORRECCIÓN CLAVE: Usamos LEFT JOIN en IMPUESTOS_PRODUCTOS para obtener la Tasa ID
        const result = await connection.execute(
            `SELECT 
                p.PRODUCTO_CODIGO AS "producto_codigo", 
                p.NOMBRE AS "nombre", 
                p.PRECIO_VENTA AS "precioVenta", 
                p.PRECIO_COSTO AS "precioCosto",
                p.STOCK_ACTUAL AS "stockActual", 
                p.ESTADO AS "estado",
                p.STOCK_MINIMO AS "stockMinimo",
                p.UNIDAD_MEDIDA AS "unidadMedida",
                p.MARCA AS "marca",
                p.DESCRIPCION AS "descripcion",
                p.CATEGORIA_ID AS "categoriaId",
                
                -- OBTENEMOS EL IMPUESTO ID DESDE LA TABLA DE UNIÓN
                ip.IMPUESTO_ID AS "tasaImpuestoId", 
                
                c.NOMBRE AS "categoria" 
            FROM PRODUCTOS p
            JOIN CATEGORIAS c ON p.CATEGORIA_ID = c.CATEGORIA_ID
            LEFT JOIN IMPUESTOS_PRODUCTOS ip ON p.PRODUCTO_CODIGO = ip.PRODUCTO_CODIGO /* <-- NUEVO JOIN */
            ORDER BY p.NOMBRE`
        );
        res.status(200).json(result.rows);
    } catch (err) {
        console.error("Error al obtener productos (FATAL):", err);
        // El error ya no debería ser 904. Se reporta cualquier otro error SQL.
        res.status(500).json({ error: 'Error interno en la consulta SQL. Revise la consola del backend.' });
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
            unidad_medida, stock_minimo, categoria_id, estado, tasa_impuesto_id // Recibimos el ID de IVA
        } = req.body;
        
        connection = await db.oracledb.getConnection();
        
        // 1. INSERT en la tabla principal (PRODUCTOS)
        await connection.execute(
            `INSERT INTO PRODUCTOS (
                PRODUCTO_CODIGO, NOMBRE, MARCA, DESCRIPCION, PRECIO_VENTA, PRECIO_COSTO, 
                UNIDAD_MEDIDA, STOCK_ACTUAL, STOCK_MINIMO, CATEGORIA_ID, ESTADO
             ) VALUES (
                :p_cod, :p_nom, :p_mar, :p_desc, :p_pv, :p_pc, 
                :p_um, 0, :p_sm, :p_cat_id, :p_estado
             )`,
            { 
                p_cod: producto_codigo, p_nom: nombre, p_mar: marca, p_desc: descripcion, 
                p_pv: precio_venta, p_pc: precio_costo, p_um: unidad_medida, 
                p_sm: stock_minimo, p_cat_id: categoria_id, p_estado: estado
            }
        );
        
        // 2. INSERT en la tabla de unión (IMPUESTOS_PRODUCTOS)
        // ESTE PASO FALTABA O ESTABA FALLANDO. AHORA GARANTIZAMOS LA INSERCIÓN.
        await connection.execute(
            `INSERT INTO IMPUESTOS_PRODUCTOS (PRODUCTO_CODIGO, IMPUESTO_ID) VALUES (:p_cod, :p_tax_id)`,
            { p_cod: producto_codigo, p_tax_id: tasa_impuesto_id }
        );

        // 3. Finalizar Transacción: Si ambos fueron exitosos, hacemos COMMIT
        await connection.commit();

        res.status(201).json({ mensaje: 'Producto e impuesto registrados exitosamente.', codigo: producto_codigo });

    } catch (err) {
        // En caso de error, revertir ambos INSERTs
        if (connection) {
            await connection.rollback().catch(e => console.error("Error en rollback:", e));
        }
        console.error("Error al registrar producto e impuesto (FATAL):", err);
        const errorMessage = err.message.split('\n')[0];
        // En un entorno de desarrollo, es útil ver el error de base de datos
        res.status(400).json({ error: errorMessage || 'Error al registrar el producto.' });
    } finally {
        if (connection) {
            await connection.close().catch(err => console.error(err));
        }
    }
};

// [PUT] Actualizar un producto existente (¡NUEVO!)
exports.updateProducto = async (req, res) => {
    let connection;
    try {
        const codigo = req.params.codigo;
        const { 
            nombre, marca, descripcion, precio_venta, precio_costo, 
            unidad_medida, stock_minimo, categoria_id, estado, tasa_impuesto_id // <-- Necesitas tasa_impuesto_id
        } = req.body;

        connection = await db.oracledb.getConnection();
        
        // --- 1. Ejecutar UPDATE en la tabla principal (PRODUCTOS) ---
        // Se usan prefijos seguros (:p_nom, :p_estado) para evitar el ORA-01745
        const updateResult = await connection.execute(
            `UPDATE PRODUCTOS 
             SET NOMBRE = :p_nom, 
                 MARCA = :p_mar, 
                 DESCRIPCION = :p_desc, 
                 PRECIO_VENTA = :p_pv, 
                 PRECIO_COSTO = :p_pc, 
                 UNIDAD_MEDIDA = :p_um, 
                 STOCK_MINIMO = :p_sm, 
                 CATEGORIA_ID = :p_cat_id, 
                 ESTADO = :p_estado
             WHERE PRODUCTO_CODIGO = :p_cod`,
            { 
                p_nom: nombre, p_mar: marca, p_desc: descripcion, p_pv: precio_venta, p_pc: precio_costo, 
                p_um: unidad_medida, p_sm: stock_minimo, p_cat_id: categoria_id, p_estado: estado, p_cod: codigo 
            }
        );

        // --- 2. Actualizar la relación N:M (IMPUESTOS_PRODUCTOS) ---
        // A. Eliminar relación antigua
        await connection.execute(
            `DELETE FROM IMPUESTOS_PRODUCTOS WHERE PRODUCTO_CODIGO = :p_cod`,
            { p_cod: codigo }
        );

        // B. Insertar nueva relación
        await connection.execute(
            `INSERT INTO IMPUESTOS_PRODUCTOS (PRODUCTO_CODIGO, IMPUESTO_ID) VALUES (:p_cod, :p_tax_id)`,
            { p_cod: codigo, p_tax_id: tasa_impuesto_id }
        );

        // 3. Finalizar Transacción: Si todo fue exitoso, hacemos COMMIT
        await connection.commit();

        if (updateResult.rowsAffected === 0) {
            return res.status(404).json({ error: 'Producto no encontrado.' });
        }

        res.status(200).json({ mensaje: 'Producto actualizado correctamente.' });

    } catch (err) {
        // En caso de error, revertir todos los cambios
        if (connection) {
            await connection.rollback().catch(e => console.error("Error en rollback:", e));
        }
        console.error("Error al actualizar producto e impuesto (FATAL):", err);
        const errorMessage = err.message.split('\n')[0];
        res.status(500).json({ error: errorMessage || 'Error interno al actualizar el producto.' });
    } finally {
        if (connection) {
            await connection.close().catch(err => console.error(err));
        }
    }
};