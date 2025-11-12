// Archivo: src/features/Ventas/CajaModule.jsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';

// URLs de API (Ya definidas en el controlador)
const API_URL = 'http://localhost:3001/api';
const CLIENTES_URL = `${API_URL}/clientes`;
const SEARCH_PRODUCTOS_URL = `${API_URL}/ventas/search`; 
const VENTA_API_URL = `${API_URL}/ventas/procesar`; 

// Constante para el cálculo de impuestos
const TASA_IVA = 0.12; 
const calcularImpuestosMonto = (neto) => neto * TASA_IVA;
const calcularTotalBruto = (neto) => neto * (1 + TASA_IVA);

const CajaModule = ({ user }) => {
    
    // --- ESTADOS ---
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [cart, setCart] = useState([]);
    const [clientes, setClientes] = useState([]);
    const [clienteSeleccionado, setClienteSeleccionado] = useState(null); 
    const [tipoPago, setTipoPago] = useState('contado'); 
    const [loadingClientes, setLoadingClientes] = useState(true);

    // --- Lógica de Carga Inicial de Clientes ---
    useEffect(() => {
        const fetchClientes = async () => {
            try {
                const response = await axios.get(CLIENTES_URL);
                setClientes(response.data);
                if (response.data.length > 0) {
                    setClienteSeleccionado(response.data[0]);
                }
            } catch (error) {
                console.error("Error al cargar clientes:", error);
            } finally {
                setLoadingClientes(false);
            }
        };
        fetchClientes();
    }, []);

    // --- LÓGICA DE BÚSQUEDA ---
    const handleSearch = async (e) => {
        e.preventDefault();
        if (!searchTerm.trim()) return setSearchResults([]);

        try {
            const response = await axios.get(`${SEARCH_PRODUCTOS_URL}?q=${searchTerm}`);
            setSearchResults(response.data);
        } catch (err) {
            Swal.fire('Error', 'Error al conectar con la búsqueda de productos.', 'error');
        }
    };

    // --- LÓGICA DEL CARRITO (Añadir, Quitar, Totales) ---
    const addToCart = (product) => {
        if (product.stock <= 0) {
            return Swal.fire('Error', 'Stock insuficiente para este producto.', 'warning');
        }
        
        const precio = product.precio; // Precio Base (Neto)
        const existingItem = cart.find(item => item.codigo === product.codigo);

        if (existingItem) {
            if (existingItem.cantidad + 1 > product.stock) {
                return Swal.fire('Error', 'No hay más stock disponible.', 'warning');
            }
            setCart(cart.map(item =>
                item.codigo === product.codigo ? { 
                    ...item, 
                    cantidad: item.cantidad + 1,
                    subtotal: (item.cantidad + 1) * precio,
                    impuesto: calcularImpuestosMonto((item.cantidad + 1) * precio),
                    total: calcularTotalBruto((item.cantidad + 1) * precio)
                } : item
            ));
        } else {
            const subtotal = precio;
            const impuesto = calcularImpuestosMonto(precio);
            const total = calcularTotalBruto(precio);

            setCart([...cart, { ...product, codigo: product.codigo, cantidad: 1, precio: precio, descuento: 0, subtotal, impuesto, total }]);
        }
        setSearchTerm('');
        setSearchResults([]);
    };

    const removeItem = (codigo) => { setCart(cart.filter(item => item.codigo !== codigo)); };

    // --- CÁLCULOS TOTALES ---
    const calculateTotals = () => {
        const totalNeto = cart.reduce((sum, item) => sum + (item.precio * item.cantidad), 0);
        const impuestosTotal = cart.reduce((sum, item) => sum + item.impuesto, 0);
        const totalBruto = totalNeto + impuestosTotal;
        return { totalNeto, impuestosTotal, totalBruto };
    };

    const { totalNeto, impuestosTotal, totalBruto } = calculateTotals();

    // --- PROCESAMIENTO DE VENTA FINAL (CHECKOUT) ---
    const handleProcessSale = async () => {
        if (!clienteSeleccionado || cart.length === 0) {
            Swal.fire('Error', 'Debe seleccionar un cliente y agregar productos al carrito.', 'error');
            return;
        }

        const detalleParaBackend = cart.map(item => ({
            codigo: item.codigo,
            cantidad: item.cantidad,
            precio: item.precio, // Precio de venta unitario (Neto)
            descuento: item.descuento || 0,
            impuesto: item.impuesto // Se agrega el impuesto de la línea
        }));
        
        const payload = {
            cliente_id: clienteSeleccionado.id,
            tipo_pago: tipoPago,
            vendedor_id: user.dpi, // DPI del usuario logueado
            total_neto: totalNeto,
            impuestos_total: impuestosTotal,
            detalle_items: detalleParaBackend
        };

        try {
            const res = await axios.post(VENTA_API_URL, payload);
            Swal.fire('Venta Éxito', res.data.mensaje || `Venta ${res.data.venta_id} procesada.`, 'success');
            
            // Limpiar
            setCart([]);
            setSearchTerm('');
        } catch (error) {
            Swal.fire('Error Transaccional', error.response?.data?.error || 'Error de servidor al registrar la venta.', 'error');
        }
    };

    if (loadingClientes) return <div className="text-center p-4">Cargando clientes...</div>;

    return (
        <div className="container-fluid py-4">
            <h3 className="mb-4">PUNTO DE VENTA (CAJA)</h3>
            
            {/* ... (Renderizado de la interfaz de venta) ... */}
        </div>
    );
};

export default CajaModule;