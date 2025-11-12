// Archivo: src/features/Compra/CompraList.jsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';

// Endpoint general para listado y base para el reporte
const API_URL = 'http://localhost:3001/api/compras'; 
const API_URL_HISTORIAL = `${API_URL}/historial`; 
const API_URL_REPORTE = `${API_URL}`; 


const CompraList = ({ refreshKey }) => {
    const [compras, setCompras] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // --- Funciones de Formato ---
    const formatCurrency = (amount) => `${parseFloat(amount).toFixed(2)}`;
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('es-GT', { year: 'numeric', month: 'short', day: 'numeric' });
    };
    
    // --- Lógica de Carga de Compras ---
    useEffect(() => {
        const fetchCompras = async () => {
            setLoading(true);
            setError(null);
            try {
                // Llama al endpoint GET /api/compras/historial
                const response = await axios.get(API_URL_HISTORIAL);
                // CRÍTICO: Asumimos que el backend devuelve { closedDocuments: [...] }
                setCompras(response.data.closedDocuments || []); 
            } catch (err) {
                setError("No se pudo cargar el historial de compras. Verifique el servidor de Node.js.");
                console.error("Error al obtener compras:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchCompras();
    }, [refreshKey]);


    // --- FUNCIÓN CRÍTICA: GENERAR REPORTE PDF/MODAL (Ahora funciona correctamente) ---
    const handleGenerarReporte = async (compraId) => {
        try {
            // Llama al endpoint GET /api/compras/:compraId/reporte para obtener el detalle
            const response = await axios.get(`${API_URL_REPORTE}/${compraId}/reporte`);
            const data = response.data; // Contiene { header: {}, detalle: [] }

            // CRÍTICO: Usamos los nombres de columna del backend (mayúsculas) para el header
            const totalBruto = data.header.TOTAL_BRUTO || data.header.totalBruto || 0;
            const totalNeto = data.header.TOTAL_NETO || data.header.totalNeto || 0;
            const impuestosTotal = data.header.IMPUESTOS_TOTAL || data.header.impuestosTotal || 0;

            // Construir el HTML del detalle de productos
            let detalleHTML = data.detalle.map(item => `
                <tr>
                    <td>${item.codigo}</td>
                    <td class="text-end">Q${item.costoUnitario.toFixed(2)}</td>
                    <td class="text-end">${item.cantidad}</td>
                    <td class="text-end">Q${item.subtotalLinea.toFixed(2)}</td>
                </tr>
            `).join('');

            Swal.fire({
                title: `Reporte de Compra ID: ${compraId}`,
                html: `
                    <div class="text-start">
                        <p><strong>Proveedor:</strong> ${data.header.proveedorNombre || 'N/A'}</p>
                        <p><strong>Documento:</strong> ${data.header.NUMERO_DOCUMENTO || 'N/A'}</p>
                        <hr>
                        <table class="table table-sm mt-3">
                            <thead>
                                <tr><th>Código</th><th>Costo Unit.</th><th>Cant.</th><th>Subtotal</th></tr>
                            </thead>
                            <tbody>${detalleHTML}</tbody>
                        </table>
                        <hr>
                        <p class="fw-bold">Neto: Q${totalNeto.toFixed(2)}</p>
                        <p class="fw-bold text-danger">Impuestos: Q${impuestosTotal.toFixed(2)}</p>
                        <h5 class="text-success">TOTAL BRUTO: Q${totalBruto.toFixed(2)}</h5>
                    </div>
                `,
                width: 800,
                icon: 'success',
                confirmButtonText: 'Cerrar'
            });

        } catch (err) {
            Swal.fire('Error', `Fallo al generar el reporte: ${err.response?.data?.error || 'Error de red.'}. Verifique el backend.`, 'error');
        }
    };
    // ------------------------------------------------------------------


    if (loading) {
        return <div className="text-center p-5">Cargando historial de compras...</div>;
    }

    if (error) {
        return <div className="alert alert-danger p-5">{error}</div>;
    }

    return (
        <div className="p-4">
            <h4 className="mb-4">3. Historial de Compras</h4>
            
            {compras.length === 0 ? (
                <div className="alert alert-info">No se encontraron compras registradas.</div>
            ) : (
                <div className="table-responsive">
                    <table className="table table-hover table-striped">
                        <thead className="table-dark">
                            <tr>
                                <th>ID Compra</th>
                                <th>Documento No.</th>
                                <th>Proveedor</th>
                                <th>Fecha</th> 
                                <th>Tipo Pago</th>
                                <th className="text-end">Total Final</th>
                                <th>Estado</th> 
                                <th>Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {compras.map((compra) => (
                                <tr key={compra.compraId}> {/* CRÍTICO: Usamos el alias 'compraId' del backend */}
                                    <td>{compra.compraId}</td>
                                    <td>{compra.numeroDocumento}</td>
                                    <td>{compra.proveedorNombre}</td> 
                                    <td>{formatDate(compra.fechaCompra)}</td> 
                                    <td>{compra.TIPO_PAGO}</td> 
                                    <td className="text-end fw-bold">Q{formatCurrency(compra.totalBruto)}</td>
                                    <td>
                                        <span className={`badge bg-${compra.estado === 'pagada' || compra.estado === 'CERRADA' ? 'success' : 'warning'}`}>
                                            {compra.estado}
                                        </span>
                                    </td>
                                    <td>
                                        <button 
                                            className="btn btn-sm btn-info text-white" 
                                            onClick={() => handleGenerarReporte(compra.compraId)}
                                        >
                                            Ver PDF
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default CompraList;