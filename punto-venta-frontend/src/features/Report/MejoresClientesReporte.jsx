// Archivo: src/features/Report/MejoresClientesReporte.jsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';

// URL del reporte (Ya definida en el backend)
const REPORT_API_URL = 'http://localhost:3001/api/reportes/mejores-clientes'; 

const MejoresClientesReporte = () => {
    const [reporteClientes, setReporteClientes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchReporte = async () => {
            setLoading(true);
            try {
                // Llama al endpoint de mejores clientes
                const response = await axios.get(REPORT_API_URL);
                setReporteClientes(response.data); // Los datos ya vienen sumados y ordenados
                setError(null);
            } catch (err) {
                console.error("Error al obtener el reporte:", err);
                setError("No se pudo cargar el reporte. Verifique la conexión o el backend.");
                setReporteClientes([]);
            } finally {
                setLoading(false);
            }
        };

        fetchReporte();
    }, []);
    
    // Función para formatear el valor monetario
    const formatQuetzales = (amount) => {
        return new Intl.NumberFormat('es-GT', { 
            style: 'currency', 
            currency: 'GTQ',
            minimumFractionDigits: 2 
        }).format(amount).replace('GTQ', 'Q');
    };

    if (loading) return <div className="alert alert-info">Cargando ranking...</div>;
    if (error) return <div className="alert alert-danger">Error: {error}</div>;

    return (
        <div className="mt-4">
            <h5 className="mb-3 text-success">Ranking: Mejores 50 Clientes por Venta Total</h5>
            
            <div className="table-responsive" style={{ maxHeight: '600px', overflowY: 'auto' }}>
                <table className="table table-striped table-hover table-sm">
                    <thead className="table-dark sticky-top">
                        <tr>
                            <th>#</th>
                            <th>ID Cliente</th>
                            <th>Nombre del Cliente</th>
                            <th className="text-end">Total Venta</th>
                        </tr>
                    </thead>
                    <tbody>
                        {reporteClientes.length > 0 ? (
                            reporteClientes.map((cliente, index) => (
                                <tr key={cliente.CLIENTE_ID}>
                                    <td>{index + 1}</td>
                                    <td>{cliente.CLIENTE_ID}</td>
                                    <td>{cliente.NOMBRE_CLIENTE}</td>
                                    <td className="text-end fw-bold">{formatQuetzales(cliente.TOTAL_VENTA)}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="4" className="text-center">No se encontraron ventas finalizadas que contribuyan al ranking.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default MejoresClientesReporte;