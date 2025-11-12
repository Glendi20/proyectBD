// Archivo: src/features/Ventas/VentaList.jsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';

// URLs
const API_URL = 'http://localhost:3001/api/ventas/historial'; 
const FACTURA_API_URL = 'http://localhost:3001/api/ventas/factura'; 

// --- FUNCIÓN AUXILIAR CRÍTICA ---
// Limpia cadenas de texto: elimina comillas dobles y asegura que el valor no sea null.
const safeString = (s) => (s || '').toString().replace(/"/g, "'").trim();
// ---------------------------------


const VentaList = () => {
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchSales = async () => {
        setLoading(true);
        try {
            const response = await axios.get(API_URL);
            setSales(response.data.closedDocuments || []); 
        } catch (err) {
            Swal.fire('Error', 'No se pudo cargar la lista de documentos de venta abiertos.', 'error');
            setSales([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSales();
    }, []);

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
            
            // *** CRÍTICO: Aseguramos que detalles sea siempre un array para evitar el fallo .map is not a function ***
            const detallesArray = detalles || []; 

            // Manejo seguro de la fecha.
            let fechaFormateada = 'N/A';
            try {
                fechaFormateada = new Date(cabecera.FECHA_VENTA).toLocaleDateString();
            } catch (e) {
                /* Si falla el parseo, se mantiene 'N/A' */
            }

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
                // Si falla la construcción del string, lanzamos un error que el catch maneja.
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
            {sales.length === 0 ? (
                <div className="alert alert-warning">No hay documentos finalizados en el historial.</div>
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
                </table>
            )}
        </div>
    );
};

export default VentaList;