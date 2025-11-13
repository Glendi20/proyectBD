// Archivo: src/features/Ventas/VentaList.jsx

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';

// URLs
const API_URL = 'http://localhost:3001/api/ventas/historial'; 
const FACTURA_API_URL = 'http://localhost:3001/api/ventas/factura'; 

// --- FUNCIÓN AUXILIAR CRÍTICA ---
const safeString = (s) => (s || '').toString().replace(/"/g, "'").trim();
// ---------------------------------


const VentaList = () => {
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [refreshKey, setRefreshKey] = useState(0); 

    const fetchSales = useCallback(async () => {
        setLoading(true);
        try {
            const params = {};
            if (startDate) params.startDate = startDate;
            if (endDate) params.endDate = endDate;

            const response = await axios.get(API_URL, { params });
            setSales(response.data.closedDocuments || []); 
        } catch (err) {
            Swal.fire('Error', 'No se pudo cargar el historial de ventas.', 'error');
            setSales([]);
        } finally {
            setLoading(false);
        }
    }, [startDate, endDate]); 

    useEffect(() => {
        fetchSales();
    }, [fetchSales, refreshKey]);

    const handleSearch = () => {
        setRefreshKey(prev => prev + 1);
    };

    const handleClearFilters = () => {
        setStartDate(''); 
        setEndDate('');
        setRefreshKey(prev => prev + 1);
    };

    // --- CÁLCULO: TOTAL ACUMULADO ---
    const calculateGrandTotal = () => {
        const total = sales.reduce((sum, sale) => {
            const bruto = parseFloat(sale.totalBruto) || 0;
            return sum + bruto;
        }, 0);
        return total.toFixed(2);
    };
    const grandTotal = calculateGrandTotal();


    // --- FUNCIÓN PARA VER/GENERAR PDF (Factura) ---
    const handleViewPdf = async (ventaId) => {
        
        const swalLoading = Swal.fire({
            title: 'Cargando Factura...',
            allowOutsideClick: false,
            didOpen: () => { Swal.showLoading(); }
        });

        try {
            const urlConCacheBuster = `${FACTURA_API_URL}/${ventaId}?t=${Date.now()}`;
            const response = await axios.get(urlConCacheBuster);
            const { cabecera, detalles } = response.data;
            
            const detallesArray = detalles || []; 

            // Manejo seguro de la fecha.
            let fechaFormateada = 'N/A';
            try {
                fechaFormateada = new Date(cabecera.FECHA_VENTA).toLocaleDateString();
            } catch (e) { /* Si falla el parseo, se mantiene 'N/A' */ }

            // 1. CONSTRUCCIÓN DE LA CADENA HTML DE DETALLES
            const detallesHtml = detallesArray.map(d => `
                <tr>
                    <td>${safeString(d.PRODUCTO_CODIGO)}</td>
                    <td>${safeString(d.PRODUCTO_NOMBRE)}</td> 
                    <td class="text-end">${d.CANTIDAD || 0}</td>
                    <td class="text-end">Q${(d.PRECIO_VENTA || 0).toFixed(2)}</td>
                </tr>
            `).join('');

            // 2. CONSTRUCCIÓN DE LA CADENA HTML COMPLETA (BLOQUE CRÍTICO PARA DEBUGGING)
            let contenidoHtml;
            try {
                contenidoHtml = `
                    <h5>Cliente: <strong>${safeString(cabecera.CLIENTE_NOMBRE)}</strong></h5>
                    <p>Fecha: ${fechaFormateada}</p> 
                    <hr/>
                    <table class="table table-bordered table-sm">
                        <thead>
                            <tr>
                                <th>Código</th>
                                <th>Producto</th>
                                <th class="text-end">Cant.</th>
                                <th>Precio</th>
                            </tr>
                        </thead>
                        <tbody>${detallesHtml}</tbody>
                    </table>
                    <hr/>
                    <div class="text-end">
                        <p>Neto: <strong>Q${(cabecera.TOTAL_NETO || 0).toFixed(2)}</strong></p>
                        <p>Impuesto: <strong>Q${(cabecera.IMPUESTOS_TOTAL || 0).toFixed(2)}</strong></p>
                        <h4>Total Bruto: <strong class="text-success">Q${(cabecera.TOTAL_BRUTO || 0).toFixed(2)}</strong></h4>
                    </div>
                `;

            } catch (e) {
                console.error("Error FATAL al construir el HTML de la factura:", e);
                throw new Error("ERROR_RENDERIZADO_FATAL_HTML");
            }


            // 3. Cierra el loading y muestra la alerta.
            swalLoading.close(); 

            Swal.fire({
                title: `🧾 Factura ID: ${ventaId} - ${cabecera.ESTADO_PAGO.toUpperCase()}`,
                html: contenidoHtml, // Usamos la variable construida
                width: 800,
                confirmButtonText: 'Cerrar / Imprimir'
            });

        } catch (error) {
            swalLoading.close(); 
            
            if (error.message === "ERROR_RENDERIZADO_FATAL_HTML") {
                Swal.fire('Error', 'Fallo de sintaxis al construir la factura (revisar logs de consola).', 'error');
            } else {
                Swal.fire('Error', error.response?.data?.error || 'No se pudo obtener la información de la factura.', 'error');
            }
        } 
    };
    

    if (loading) return <div className="text-center py-4">Cargando Historial de Ventas...</div>;

    return (
        <div className="mt-4">
            <h4 className="text-primary">3. 📄 Historial de Ventas (Contado y Crédito)</h4>
            <hr/>
            
            {/* --- CUADRO DE BÚSQUEDA POR FECHA --- */}
            <div className="card shadow-sm p-3 mb-4">
                <h6 className="card-title">Filtrar por Fecha de Transacción</h6>
                <div className="d-flex align-items-center">
                    <div className="me-3">
                        <label className="form-label">Desde:</label>
                        <input 
                            type="date" 
                            className="form-control" 
                            value={startDate} 
                            onChange={(e) => setStartDate(e.target.value)} 
                        />
                    </div>
                    <div className="me-3">
                        <label className="form-label">Hasta:</label>
                        <input 
                            type="date" 
                            className="form-control" 
                            value={endDate} 
                            onChange={(e) => setEndDate(e.target.value)} 
                        />
                    </div>
                    <button 
                        className="btn btn-primary mt-3" 
                        onClick={handleSearch}
                        disabled={loading}
                    >
                        Buscar
                    </button>
                    <button 
                        className="btn btn-secondary mt-3 ms-2" 
                        onClick={handleClearFilters}
                    >
                        Limpiar
                    </button>
                </div>
            </div>
            {/* -------------------------------------- */}

            {sales.length === 0 ? (
                <div className="alert alert-warning">No hay documentos finalizados en el historial que coincidan con el filtro.</div>
            ) : (
                <table className="table table-striped table-hover table-sm">
                    <thead className="table-dark">
                        <tr>
                            <th>ID Venta</th>
                            <th>Fecha</th>
                            <th>Cliente</th>
                            <th>Total Bruto</th>
                            <th>Tipo Pago</th>
                            <th>Estado Final</th>
                            <th>Acción</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sales.map(sale => (
                            <tr key={sale.ventaId}>
                                <td>{sale.ventaId}</td>
                                <td>{new Date(sale.fechaVenta).toLocaleDateString()}</td>
                                <td>{sale.clienteNombre}</td>
                                <td className="text-end">Q{sale.totalBruto ? sale.totalBruto.toFixed(2) : '0.00'}</td>
                                <td>{sale.tipoPago}</td>
                                <td>
                                    <span className={`badge bg-${sale.estadoPago === 'contado' ? 'success' : 'warning'}`}>
                                        {sale.estadoPago.toUpperCase()}
                                    </span>
                                </td>
                                <td>
                                    <button 
                                        className="btn btn-sm btn-primary"
                                        onClick={() => handleViewPdf(sale.ventaId)}
                                    >
                                        Ver PDF
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                    {/* --- FILA DE TOTALES ACUMULADOS --- */}
                    <tfoot>
                        <tr>
                            <td colSpan="3" className="text-end fw-bold bg-light">TOTAL ACUMULADO DEL PERIODO:</td>
                            <td className="text-end fw-bold bg-light text-success">Q{grandTotal}</td>
                            <td colSpan="3" className="bg-light"></td>
                        </tr>
                    </tfoot>
                    {/* ---------------------------------- */}
                </table>
            )}
        </div>
    );
};

export default VentaList;