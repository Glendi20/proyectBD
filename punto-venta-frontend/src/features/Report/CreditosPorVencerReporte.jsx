// Archivo: src/features/Report/CreditosPorVencerReporte.jsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';

const REPORT_API_URL = 'http://localhost:3001/api/reportes/creditos-por-vencer'; 

const CreditosPorVencerReporte = () => {
    const [compras, setCompras] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchReporte = async () => {
            setLoading(true);
            try {
                const response = await axios.get(REPORT_API_URL);
                setCompras(response.data);
                setError(null);
            } catch (err) {
                setError("No se pudo cargar el reporte de Créditos por Vencer.");
                setCompras([]);
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
        if (dias <= 7) return 'table-warning'; // Menos de 7 días
        return '';
    };

    // Función para calcular la Fecha de Vencimiento final
    const getFechaVencimiento = (fechaCompra, plazoDias) => {
        if (!fechaCompra || !plazoDias) return 'N/A';
        const fecha = new Date(fechaCompra);
        fecha.setDate(fecha.getDate() + plazoDias);
        return fecha.toLocaleDateString();
    };


    if (loading) return <div className="alert alert-info">Cargando alertas de cuentas por pagar...</div>;
    if (error) return <div className="alert alert-danger">Error: {error}</div>;

    return (
        <div className="mt-4">
            {/* CORRECCIÓN: Se reemplazó el símbolo <= por texto para evitar fallos de sintaxis JSX */}
            <h5 className="mb-3 text-danger">🚨 Cuentas por Pagar Próximas a Vencer (Plazo menor o igual a 15 días)</h5>
            
            <div className="table-responsive" style={{ maxHeight: '600px', overflowY: 'auto' }}>
                <table className="table table-striped table-hover table-sm">
                    <thead className="table-dark sticky-top">
                        <tr>
                            <th>ID Compra</th>
                            <th>Proveedor</th>
                            <th>Plazo Original (días)</th>
                            <th className="text-end">Monto Pendiente</th>
                            <th className="text-end">Días Restantes</th>
                            <th>Fecha Vencimiento</th>
                        </tr>
                    </thead>
                    <tbody>
                        {compras.length > 0 ? (
                            compras.map((compra) => (
                                <tr key={compra.compraId} className={getRowStyle(compra.DIAS_RESTANTES)}>
                                    <td>{compra.compraId}</td>
                                    <td>{compra.proveedorNombre}</td>
                                    <td>{compra.plazoDias}</td>
                                    <td className="text-end fw-bold">{formatQuetzales(compra.montoPendiente)}</td>
                                    <td className="text-end fw-bold">
                                        {compra.DIAS_RESTANTES <= 0 
                                            ? `VENCIDO (${Math.abs(Math.floor(compra.DIAS_RESTANTES))} días)` 
                                            : Math.floor(compra.DIAS_RESTANTES) + ' días'}
                                    </td>
                                    <td>{getFechaVencimiento(compra.fechaCompra, compra.plazoDias)}</td> 
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="6" className="text-center">No hay créditos de compra próximos a vencer en los próximos 15 días.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default CreditosPorVencerReporte;