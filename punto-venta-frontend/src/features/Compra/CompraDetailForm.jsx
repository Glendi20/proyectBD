// Archivo: src/features/Compra/CompraDetailForm.jsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';

const API_URL = 'http://localhost:3001/api'; 
const PRODUCTOS_URL = `${API_URL}/productos`; 
const DETAIL_API_URL = `${API_URL}/compras/detail`; // POST: Detalle
const STOCK_API_URL = `${API_URL}/compras/stock`;   // PUT: Stock Update
const HEADER_PUT_URL = `${API_URL}/compras/header`; // <--- NUEVA URL PARA ACTUALIZAR CABECERA CON TOTALES

const TASA_IVA = 0.12; 
const calcularImpuestosMonto = (neto) => neto * TASA_IVA;
const calcularTotalBruto = (neto) => neto * (1 + TASA_IVA);


const CompraDetailForm = ({ compraId, onDetailCompleted }) => {
    
    // --- ESTADOS ---
    const [productos, setProductos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [productoSeleccionado, setProductoSeleccionado] = useState(null);
    const [cantidad, setCantidad] = useState(1);
    const [precioCosto, setPrecioCosto] = useState(0);

    const [detalleCompra, setDetalleCompra] = useState([]); // Carrito local
    
    // --- Lógica de Carga de Productos ---
    useEffect(() => {
        const fetchProductos = async () => {
            try {
                const res = await axios.get(PRODUCTOS_URL);
                setProductos(res.data);
                if (res.data.length > 0) {
                    // Se asegura de que haya un valor inicial
                    setProductoSeleccionado(res.data[0]); 
                    setPrecioCosto(res.data[0].precioCosto || 0); 
                }
            } catch (err) {
                setError('No se pudieron cargar los productos.');
            } finally {
                setLoading(false);
            }
        };
        fetchProductos();
    }, []);
    
    // ... (Lógica de carrito) ...
    const handleProductoSelect = (e) => {
        const codigo = e.target.value;
        const prod = productos.find(p => p.producto_codigo === codigo);
        setProductoSeleccionado(prod);
        
        if (prod) {
            setPrecioCosto(prod.precioCosto || 0); 
        }
    };
    
    const agregarProducto = () => {
        if (!productoSeleccionado || cantidad <= 0 || precioCosto <= 0) {
            Swal.fire('Atención', 'Seleccione producto, cantidad y costo válidos.', 'warning');
            return;
        }

        const subtotal = precioCosto * cantidad;
        const impuesto = calcularImpuestosMonto(subtotal);
        const total = subtotal + impuesto;
        const codigo = productoSeleccionado.producto_codigo;

        const nuevoItem = {
            codigo: codigo,
            nombre: productoSeleccionado.nombre,
            cantidad: cantidad,
            precio_costo: precioCosto, // Costo unitario neto
            subtotal: subtotal,
            impuesto: impuesto,
            total: total,
            descuento_linea: 0 // Se inicializa en 0
        };

        // Lógica de adición/actualización de carrito local
        setDetalleCompra(prev => {
            const indexExistente = prev.findIndex(item => item.codigo === codigo);
            if (indexExistente !== -1) {
                // Producto existente: sumar cantidad y recalcular totales de línea
                const nuevaCantidad = item.cantidad + cantidad;
                const nuevoSubtotal = nuevaCantidad * precioCosto;
                
                return prev.map((item, index) => 
                    index === indexExistente ? { 
                        ...item, 
                        cantidad: nuevaCantidad, 
                        subtotal: nuevoSubtotal,
                        impuesto: calcularImpuestosMonto(nuevoSubtotal),
                        total: calcularTotalBruto(nuevoSubtotal)
                    } : item
                );
            } else {
                return [...prev, nuevoItem];
            }
        });
        
        // Limpiar inputs
        setCantidad(1);
        setPrecioCosto(productoSeleccionado.precioCosto || 0);
    };

    const eliminarItem = (codigo) => {
        if (!window.confirm('¿Está seguro de eliminar este producto del detalle?')) return;
        setDetalleCompra(detalleCompra.filter(item => item.codigo !== codigo));
    };

    // --- CÁLCULOS TOTALES ---
    const calcularTotales = () => {
        const totalNeto = detalleCompra.reduce((sum, item) => sum + item.subtotal, 0);
        const impuestosTotal = detalleCompra.reduce((sum, item) => sum + item.impuesto, 0);
        const totalBruto = totalNeto + impuestosTotal;
        return { totalNeto, impuestosTotal, totalBruto };
    };
    // Estos valores se actualizan en cada render y reflejan el estado actual del carrito
    const { totalNeto, impuestosTotal, totalBruto } = calcularTotales();

    // --- PROCESAMIENTO FINAL: Ejecuta la lógica completa ---
    const handleInsertDetailsAndStock = async () => {
        if (detalleCompra.length === 0) return Swal.fire('Error', 'Debe agregar productos al detalle.', 'warning');
        
        try {
            // 1. PASO CRÍTICO: ACTUALIZAR CABECERA CON LOS TOTALES CALCULADOS (PUT)
            // Esto asegura que TOTAL_NETO e IMPUESTOS_TOTAL tengan los valores correctos
            await axios.put(`${HEADER_PUT_URL}/${compraId}`, {
                total_neto: totalNeto,          // Total Compra (Neto)
                impuestos_total: impuestosTotal // Total IVA
            });
            Swal.fire({
                icon: 'info',
                title: 'Cabecera Actualizada',
                text: 'Iniciando inserción de detalles y stock...',
                showConfirmButton: false,
                timer: 1500
            });

            // 2. Insertar Detalle y Actualizar Stock (Loop)
            for (const item of detalleCompra) {
                
                // 2A. Insertar Línea de Detalle (POST /detail)
                await axios.post(DETAIL_API_URL, {
                    compraId: compraId,
                    item: {
                        codigo: item.codigo,
                        cantidad: item.cantidad,
                        precio_costo: item.precio_costo, 
                        descuento_linea: item.descuento_linea,
                        impuestos_linea: item.impuesto,
                    }
                });

                // 2B. Actualizar Stock Individualmente (PUT /stock)
                await axios.put(STOCK_API_URL, {
                    codigo: item.codigo,
                    cantidad: item.cantidad,
                });
            }

            Swal.fire('¡Transacción Completa!', `Documento ID ${compraId} finalizado. Stock actualizado.`, 'success');
            onDetailCompleted(); // Llama al padre para avanzar al Historial
            
        } catch (error) {
            // Manejo de errores para cualquiera de los 3 pasos (PUT header, POST detail, PUT stock)
            Swal.fire('Error', `Fallo CRÍTICO en la transacción: ${error.response?.data?.error || error.message || 'Error de red.'}`, 'error');
        }
    };


    if (loading) return <div className="text-center py-4">Cargando productos...</div>;
    if (error) return <div className="alert alert-danger p-4">{error}</div>;

    return (
        <div className="p-4 border rounded-md shadow bg-white">
            <h4 className="mb-4 text-success">2. Detalle de Compra (Documento ID: {compraId})</h4>
            
            {/* INTERFAZ DE INPUTS */}
            <div className="row bg-light p-3 rounded mb-4 align-items-end">
                {/* Select de Producto */}
                <div className="col-md-5 mb-3">
                    <label className="form-label">Producto</label>
                    <select onChange={handleProductoSelect} className="form-select" value={productoSeleccionado?.producto_codigo || ''}>
                        <option value="">Seleccione Producto</option>
                        {productos.map(p => (
                            <option key={p.producto_codigo} value={p.producto_codigo}>
                                {p.nombre} (Stock: {p.stockActual})
                            </option>
                        ))}
                    </select>
                </div>
                {/* Cantidad */}
                <div className="col-md-2 mb-3">
                    <label className="form-label">Cantidad</label>
                    <input type="number" min="1" value={cantidad} onChange={(e) => setCantidad(parseInt(e.target.value) || 1)} className="form-control" />
                </div>
                {/* Costo Unitario */}
                <div className="col-md-3 mb-3">
                    <label className="form-label">Costo Unitario</label>
                    <input type="number" step="0.01" value={precioCosto} onChange={(e) => setPrecioCosto(parseFloat(e.target.value) || 0)} className="form-control" />
                </div>
                {/* Botón Añadir */}
                <div className="col-md-2 mb-3">
                    <button onClick={agregarProducto} type="button" className="btn btn-primary w-100">Añadir</button>
                </div>
            </div>

            {/* TABLA DE DETALLE (CARRITO) */}
            <div className="table-responsive mb-4">
                <h5 className="mb-3">Productos Añadidos</h5>
                <table className="table table-bordered table-striped table-sm">
                    <thead className="table-dark">
                        <tr>
                            <th>Producto</th>
                            <th>Costo Unit.</th>
                            <th>Cantidad</th>
                            <th>Subtotal</th>
                            <th>IVA ({TASA_IVA * 100}%)</th>
                            <th>Total Línea</th>
                            <th>Acción</th>
                        </tr>
                    </thead>
                    <tbody>
                        {detalleCompra.map(item => (
                            <tr key={item.codigo}>
                                <td>{item.nombre}</td>
                                <td>Q{item.precio_costo.toFixed(2)}</td>
                                <td>{item.cantidad}</td>
                                <td>Q{item.subtotal.toFixed(2)}</td>
                                <td>Q{item.impuesto.toFixed(2)}</td>
                                <td className="fw-bold">Q{item.total.toFixed(2)}</td>
                                <td><button onClick={() => eliminarItem(item.codigo)} className="btn btn-sm btn-danger">X</button></td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            
            {/* RESUMEN DE TOTALES Y BOTÓN FINAL */}
            <div className="row justify-content-end">
                <div className="col-md-5">
                    <div className="card p-3 bg-light">
                        <div className="d-flex justify-content-between fw-bold"><span>Neto:</span><span>Q{totalNeto.toFixed(2)}</span></div>
                        <div className="d-flex justify-content-between fw-bold"><span>IVA Total:</span><span>Q{impuestosTotal.toFixed(2)}</span></div>
                        <div className="d-flex justify-content-between fs-5 text-success border-top mt-2 pt-2">
                            <span>TOTAL:</span>
                            <span>Q{totalBruto.toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-4 text-center">
                <button onClick={handleInsertDetailsAndStock} disabled={detalleCompra.length === 0} className="btn btn-success btn-lg">
                    Finalizar Detalle y Actualizar Stock
                </button>
            </div>
        </div>
    );
};

export default CompraDetailForm;