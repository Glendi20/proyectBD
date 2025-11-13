// Archivo: src/features/Compra/CompraList.jsx

import React, { useState, useEffect, useCallback } from 'react'; // Importamos useCallback
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
    // *** NUEVOS ESTADOS PARA EL FILTRO DE FECHAS ***
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [filterKey, setFilterKey] = useState(0); 

    // --- Funciones de Formato ---
    const formatCurrency = (amount) => `${parseFloat(amount).toFixed(2)}`;
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        const date = new Date(dateString);
        return date.toLocaleDateString('es-GT', { year: 'numeric', month: 'short', day: 'numeric' });
    };
    
    // --- Lógica de Carga de Compras (Ahora con Filtro) ---
    const fetchCompras = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            // Prepara los parámetros de consulta (query strings)
            const params = {};
            if (startDate) params.startDate = startDate;
            if (endDate) params.endDate = endDate;
            
            // Llama al endpoint GET /api/compras/historial con los filtros
            const response = await axios.get(API_URL_HISTORIAL, { params });
            setCompras(response.data.closedDocuments || []); 
        } catch (err) {
            setError("No se pudo cargar el historial de compras. Verifique el servidor de Node.js.");
            console.error("Error al obtener compras:", err);
        } finally {
            setLoading(false);
        }
    }, [startDate, endDate]); // Dependencia para recargar al cambiar las fechas

    useEffect(() => {
        fetchCompras();
    }, [fetchCompras, refreshKey, filterKey]); // filterKey dispara la búsqueda

    // --- Lógica de Filtrado y Totales ---
    const handleSearch = () => {
        setFilterKey(prev => prev + 1); // Dispara fetchCompras con los nuevos filtros
    };

    const handleClearFilters = () => {
        setStartDate(''); 
        setEndDate('');
        setFilterKey(prev => prev + 1);
    };

    // FUNCIÓN: CALCULAR EL TOTAL ACUMULADO
    const calculateGrandTotal = () => {
        const total = compras.reduce((sum, compra) => {
            const bruto = parseFloat(compra.totalBruto) || 0;
            return sum + bruto;
        }, 0);
        return total.toFixed(2);
    };
    const grandTotal = calculateGrandTotal();


    // --- FUNCIÓN CRÍTICA: GENERAR REPORTE PDF/MODAL (Se mantiene intacta) ---
    const handleGenerarReporte = async (compraId) => {
        try {
            const response = await axios.get(`${API_URL_REPORTE}/${compraId}/reporte`);
            const data = response.data;

            const totalBruto = data.header.TOTAL_BRUTO || data.header.totalBruto || 0;
            const totalNeto = data.header.TOTAL_NETO || data.header.totalNeto || 0;
            const impuestosTotal = data.header.IMPUESTOS_TOTAL || data.header.impuestosTotal || 0;

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
            
            {/* --- CUADRO DE BÚSQUEDA POR FECHA --- */}
            <div className="card shadow-sm p-3 mb-4">
                <h6 className="card-title">Filtrar por Fecha de Compra</h6>
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
                        Limpiar Filtro
                    </button>
                </div>
            </div>
            {/* -------------------------------------- */}
            
            {compras.length === 0 ? (
                <div className="alert alert-info">No se encontraron compras registradas que coincidan con el filtro.</div>
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
                                <tr key={compra.compraId}>
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
                        {/* --- FILA DE TOTALES ACUMULADOS --- */}
                        <tfoot>
                            <tr>
                                <td colSpan="5" className="text-end fw-bold bg-light">TOTAL ACUMULADO DEL PERIODO:</td>
                                <td className="text-end fw-bold bg-light text-success">Q{grandTotal}</td>
                                <td colSpan="2" className="bg-light"></td>
                            </tr>
                        </tfoot>
                        {/* ---------------------------------- */}
                    </table>
                </div>
            )}
        </div>
    );
};

export default CompraList;