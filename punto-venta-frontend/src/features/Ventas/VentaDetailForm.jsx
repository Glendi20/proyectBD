// Archivo: src/features/Ventas/VentaDetailForm.jsx

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';

// URLs de API
const API_URL = 'http://localhost:3001/api';
// Endpoints utilizados:
const SEARCH_PRODUCTOS_URL = `${API_URL}/ventas/search`; 
const DETAIL_API_URL = `${API_URL}/ventas/detail`; 
const STOCK_API_URL = `${API_URL}/ventas/stock`; 
const HEADER_UPDATE_API_URL = `${API_URL}/ventas/header`; 
const IMPUESTO_PRODUCTO_URL = `${API_URL}/impuestos/producto`; 

// Constante para el cálculo de impuestos
const TASA_IVA_DEFAULT = 0.12; 
const calcularImpuestosMonto = (neto, tasaDecimal) => neto * tasaDecimal;
const calcularTotalBruto = (neto, impuesto) => neto + impuesto;

const VentaDetailForm = ({ user, ventaId, onDetailCompleted }) => {
    
    // --- ESTADOS ---
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [cart, setCart] = useState([]);
    const [clienteIdInput, setClienteIdInput] = useState('1'); 
    const [tipoPago, setTipoPago] = useState('contado'); 
    const [loading, setLoading] = useState(false);
    
    // --- LÓGICA DE CÁLCULO ---
    const calculateTotals = useCallback(() => {
        let totalNeto = 0;
        let impuestosTotal = 0;

        cart.forEach(item => {
            // Aseguramos que precio y cantidad sean números
            const precio = parseFloat(item.precio) || 0;
            const cantidad = parseInt(item.cantidad) || 0;
            const descuento = parseFloat(item.descuento) || 0;

            const subtotalNeto = precio * cantidad;
            const subtotalConDesc = subtotalNeto - descuento;

            const montoImpuesto = calcularImpuestosMonto(subtotalConDesc, TASA_IVA_DEFAULT);
            
            totalNeto += subtotalConDesc;
            impuestosTotal += montoImpuesto;
        });

        const totalBruto = calcularTotalBruto(totalNeto, impuestosTotal);

        return { 
            totalNeto: totalNeto, 
            impuestosTotal: impuestosTotal, 
            totalBruto: totalBruto 
        };
    }, [cart]);

    const { totalNeto, impuestosTotal, totalBruto } = calculateTotals();


    // --- LÓGICA DE BÚSQUEDA ---
    const handleSearch = async (e) => {
        e.preventDefault();
        setLoading(true);
        setSearchResults([]);
        if (searchTerm.trim().length < 3) {
            setLoading(false);
            return;
        }

        try {
            const response = await axios.get(SEARCH_PRODUCTOS_URL, {
                params: { q: searchTerm.trim() }
            });
            // Aseguramos que los precios y stocks sean números al cargarlos
            const products = response.data.map(p => ({
                ...p,
                precio: parseFloat(p.precio),
                stock: parseInt(p.stock)
            }));
            setSearchResults(products);
        } catch (error) {
            Swal.fire('Error Búsqueda', 'No se pudieron cargar los productos.', 'error');
            setSearchResults([]);
        } finally {
            setLoading(false);
        }
    };
    
    // --- LÓGICA DEL CARRITO ---
    const addToCart = (product) => {
        const existingItem = cart.find(item => item.codigo === product.codigo);
        const stockDisponible = product.stock;

        if (existingItem) {
            const newQuantity = existingItem.cantidad + 1;
            if (newQuantity > stockDisponible) {
                 Swal.fire('Atención', `Solo quedan ${stockDisponible} unidades de ${product.nombre}.`, 'warning');
                 return;
            }
            setCart(cart.map(item => 
                item.codigo === product.codigo 
                ? { ...item, cantidad: newQuantity }
                : item
            ));
        } else {
            if (stockDisponible < 1) {
                Swal.fire('Sin Stock', `El producto ${product.nombre} no tiene stock disponible.`, 'error');
                return;
            }

            setCart([...cart, { 
                ...product, 
                cantidad: 1, 
                descuento: 0, 
                stock: stockDisponible 
            }]);
        }
        setSearchTerm('');
        setSearchResults([]); 
    };

    const removeItem = (codigo) => { 
        setCart(cart.filter(item => item.codigo !== codigo)); 
    };

    // --- PROCESAMIENTO DE VENTA FINAL (CHECKOUT MANUAL / LÍNEA POR LÍNEA) ---
    const handleProcessSale = async () => {
        if (!ventaId || cart.length === 0) {
            Swal.fire('Error', 'El ID de Venta no fue encontrado o el carrito está vacío.', 'error');
            return;
        }
        if (!clienteIdInput) {
            Swal.fire('Error', 'Debe ingresar el ID del cliente.', 'error');
            return;
        }
        
        setLoading(true);
        
        try {
            // 1. Loop para Insertar Detalle y Decrementar Stock (LÍNEA POR LÍNEA)
            for (const item of cart) {
                
                // Aseguramos que los valores a enviar sean números
                const precio = parseFloat(item.precio);
                const cantidad = parseInt(item.cantidad);
                const descuento = parseFloat(item.descuento || 0);
                
                const subtotalNetoLinea = precio * cantidad - descuento;
                const impuestoTotalLinea = calcularImpuestosMonto(subtotalNetoLinea, TASA_IVA_DEFAULT);
                
                // 1A. Insertar Línea de Detalle (POST /detail) - REGISTRA LA VENTA
                const payloadDetalle = {
                    ventaId: ventaId, 
                    producto_codigo: item.codigo,
                    // CRÍTICO: Enviar valores limpios y numéricos
                    cantidad: cantidad, 
                    precio_venta: precio, 
                    descuento_linea: descuento, 
                    impuestos_linea: parseFloat(impuestoTotalLinea.toFixed(2)) 
                };

                // CRÍTICO 1: Llama al POST /api/ventas/detail
                // Esto requerirá que el controlador en el backend use la bind variable :descuentoLinea
                await axios.post(DETAIL_API_URL, payloadDetalle);
                
                // 1B. Actualizar Stock Individualmente (PUT /stock) - DECREMENTA INVENTARIO
                const payloadStock = {
                    codigo: item.codigo,
                    cantidad: cantidad, 
                };

                // CRÍTICO 2: Llama al PUT /api/ventas/stock
                await axios.put(STOCK_API_URL, payloadStock);
            }
            
            // 2. ACTUALIZAR CABECERA DE VENTA (FINALIZAR LA TRANSACCIÓN)
            const finalTotals = calculateTotals();

            const payloadHeader = {
                ventaId: ventaId,
                totalBruto: parseFloat(finalTotals.totalBruto.toFixed(2)),
                impuestosTotal: parseFloat(finalTotals.impuestosTotal.toFixed(2)),
                totalNeto: parseFloat(finalTotals.totalNeto.toFixed(2)),
            };

            // CRÍTICO 3: Llama al PUT/POST para actualizar la cabecera
            await axios.put(HEADER_UPDATE_API_URL, payloadHeader);

            Swal.fire('Venta Éxito', `Venta ID ${ventaId} finalizada correctamente.`, 'success');
            
            // Limpiar y notificar al padre
            setCart([]);
            setClienteIdInput('1'); 
            if (onDetailCompleted) onDetailCompleted(); 

        } catch (error) {
            console.error("Error completo en la venta:", error);
            Swal.fire({
                title: 'Error Transaccional',
                text: error.response?.data?.error || 'Error de servidor al registrar la venta. Por favor, verifique el estado del stock y el detalle de la venta.',
                icon: 'error'
            });
        } finally {
            setLoading(false);
        }
    };

    // --- RENDERIZADO DEL COMPONENTE ---
    return (
        <div className="container-fluid py-4">
            <h3 className="mb-4">🛍️ PUNTO DE VENTA (CAJA) - Documento ID: **{ventaId || 'Nuevo'}**</h3>
            <hr/>
            <div className="row">
                
                {/* Columna Izquierda: Búsqueda y Carrito */}
                <div className="col-lg-8">
                    
                    {/* BÚSQUEDA DE PRODUCTOS */}
                    <div className="card shadow-sm mb-4">
                        <div className="card-body">
                            <form onSubmit={handleSearch} className="input-group">
                                <input
                                    type="text"
                                    className="form-control form-control-lg"
                                    placeholder="Buscar producto por código o nombre..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                                <button type="submit" className="btn btn-primary" disabled={loading}>
                                    {loading ? 'Buscando...' : 'Buscar'}
                                </button>
                            </form>
                            
                            {/* Resultados de la Búsqueda */}
                            {searchResults.length > 0 && (
                                <ul className="list-group mt-3">
                                    {searchResults.map((product) => (
                                        <li 
                                            key={product.codigo} 
                                            className="list-group-item list-group-item-action d-flex justify-content-between align-items-center"
                                            onClick={() => addToCart(product)}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            <div>
                                                **{product.nombre}** <small className="text-muted d-block">{product.codigo}</small>
                                            </div>
                                            <span className={`badge bg-${product.stock > 0 ? 'info' : 'danger'} me-3`}>
                                                Stock: {product.stock}
                                            </span>
                                            <span className="fw-bold">${product.precio.toFixed(2)}</span>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>
                    
                    {/* LISTA DEL CARRITO */}
                    <div className="card shadow-sm">
                        <div className="card-header bg-secondary text-white">
                            <h5 className="mb-0">🛒 Productos en Carrito ({cart.length})</h5>
                        </div>
                        <div className="card-body">
                            {cart.length === 0 ? (
                                <div className="alert alert-info text-center">No hay productos en el carrito.</div>
                            ) : (
                                <ul className="list-group">
                                    {cart.map(item => (
                                        <li 
                                            key={item.codigo} 
                                            className="list-group-item d-flex justify-content-between align-items-center"
                                        >
                                            <div>
                                                **{item.nombre}** ({item.cantidad} x ${item.precio.toFixed(2)})
                                                <small className="text-muted d-block">Subtotal: ${(item.precio * item.cantidad).toFixed(2)}</small>
                                            </div>
                                            <button 
                                                className="btn btn-sm btn-outline-danger"
                                                onClick={() => removeItem(item.codigo)}
                                            >
                                                Quitar
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </div>
                    </div>

                </div>

                {/* Columna Derecha: Resumen de Pago y Cliente */}
                <div className="col-lg-4">
                    <div className="card shadow-lg bg-light p-4 sticky-top" style={{ top: '20px' }}>
                        
                        <h5 className="mb-3">Información de Venta</h5>
                        <div className="mb-3">
                            <label className="form-label">ID del Cliente</label>
                            <input
                                type="text"
                                className="form-control"
                                value={clienteIdInput}
                                onChange={(e) => setClienteIdInput(e.target.value)}
                                placeholder="Ej: 1"
                                disabled={loading}
                            />
                        </div>
                        <div className="mb-4">
                            <label className="form-label">Tipo de Pago</label>
                            <select 
                                className="form-select" 
                                value={tipoPago} 
                                onChange={(e) => setTipoPago(e.target.value)}
                                disabled={loading}
                            >
                                <option value="contado">Contado</option>
                                <option value="credito">Crédito</option>
                            </select>
                        </div>
                        
                        <hr/>
                        
                        <h4 className="text-center mb-3">Total a Pagar</h4>
                        <div className="mb-3">
                            <p className="d-flex justify-content-between">
                                Neto (Base Imponible): **${totalNeto.toFixed(2)}**
                            </p>
                            <p className="d-flex justify-content-between">
                                Impuestos (IVA {TASA_IVA_DEFAULT*100}%): **${impuestosTotal.toFixed(2)}**
                            </p>
                            <h3 className="d-flex justify-content-between text-success">
                                TOTAL BRUTO: **${totalBruto.toFixed(2)}**
                            </h3>
                        </div>

                        <button 
                            className="btn btn-lg btn-success mt-3" 
                            onClick={handleProcessSale}
                            disabled={cart.length === 0 || !clienteIdInput || loading}
                        >
                            {loading ? (
                                <>
                                    <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                                    Procesando...
                                </>
                            ) : (
                                'Finalizar Venta'
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default VentaDetailForm;