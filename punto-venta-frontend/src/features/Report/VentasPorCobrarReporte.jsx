// Archivo: src/features/Report/VentasPorCobrarReporte.jsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';

const REPORT_API_URL = 'http://localhost:3001/api/reportes/ventas-por-cobrar'; 
const PLAZO_DEFAULT_DIAS = 15; // Usado solo para referencia en la UI

const VentasPorCobrarReporte = () => {
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchReporte = async () => {
            setLoading(true);
            try {
                const response = await axios.get(REPORT_API_URL);
                setSales(response.data);
                setError(null);
            } catch (err) {
                setError("No se pudo cargar el reporte de Cuentas por Cobrar.");
                setSales([]);
            } finally {
                setLoading(false);
            }
        };
        fetchReporte();
    }, []);

    const formatQuetzales = (amount) => {
        return new Intl.NumberFormat('es-GT', { 
            style: 'currency', 
            currency: 'GTQ',
            minimumFractionDigits: 2 
        }).format(amount).replace('GTQ', 'Q');
    };
    
    // Función para determinar el estilo de la fila
    const getRowStyle = (dias) => {
        if (dias <= 0) return 'table-danger'; // Vencido
        if (dias <= 5) return 'table-warning'; // Menos de 5 días
        return '';
    };

    // Función para calcular la Fecha de Vencimiento
    const getFechaVencimiento = (fechaCompra, plazoDias) => {
        if (!fechaCompra) return 'N/A'; 
        const fecha = new Date(fechaCompra);
        const plazo = plazoDias || PLAZO_DEFAULT_DIAS;
        fecha.setDate(fecha.getDate() + plazo); 
        return fecha.toLocaleDateString();
    };


    if (loading) return <div className="alert alert-info">Cargando alertas de cuentas por cobrar...</div>;
    if (error) return <div className="alert alert-danger">Error: {error}</div>;

    return (
        <div className="mt-4">
            {/* CORRECCIÓN: Reemplazamos el símbolo < por texto para evitar el fallo de JSX */}
            <h5 className="mb-3 text-warning">💰 Cuentas por Cobrar Próximas a Vencer (Alerta menor a 10 días)</h5>
            
            <div className="table-responsive" style={{ maxHeight: '600px', overflowY: 'auto' }}>
                <table className="table table-striped table-hover table-sm">
                    <thead className="table-dark sticky-top">
                        <tr>
                            <th>ID Venta</th>
                            <th>Cliente</th>
                            <th>Plazo Asumido</th>
                            <th className="text-end">Monto Pendiente</th>
                            <th className="text-end">Días Restantes</th>
                            <th>Fecha Vencimiento</th>
                        </tr>
                    </thead>
                    <tbody>
                        {sales.length > 0 ? (
                            sales.map((sale) => (
                                <tr key={sale.ventaId} className={getRowStyle(sale.DIAS_RESTANTES)}>
                                    <td>{sale.ventaId}</td>
                                    <td>{sale.clienteNombre}</td>
                                    <td>{PLAZO_DEFAULT_DIAS} días</td>
                                    <td className="text-end fw-bold">{formatQuetzales(sale.montoPendiente)}</td>
                                    <td className="text-end fw-bold">
                                        {sale.DIAS_RESTANTES <= 0 
                                            ? `VENCIDO (${Math.abs(Math.floor(sale.DIAS_RESTANTES))} días)` 
                                            : Math.floor(sale.DIAS_RESTANTES) + ' días'}
                                    </td>
                                    <td>{getFechaVencimiento(sale.fechaVenta, sale.plazoDias)}</td> 
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="6" className="text-center">No hay ventas a crédito próximas a vencer en los próximos 10 días.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default VentasPorCobrarReporte;