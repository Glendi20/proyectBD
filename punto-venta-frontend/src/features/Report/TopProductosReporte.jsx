// Archivo: src/features/Report/TopProductosReporte.jsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';

const REPORT_API_URL = 'http://localhost:3001/api/reportes/top-productos'; 

const TopProductosReporte = () => {
    const [productos, setProductos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchReporte = async () => {
            setLoading(true);
            try {
                const response = await axios.get(REPORT_API_URL);
                setProductos(response.data);
                setError(null);
            } catch (err) {
                setError("No se pudo cargar el reporte de Top Productos Vendidos.");
                setProductos([]);
            } finally {
                setLoading(false);
            }
        };
        fetchReporte();
    }, []);

    if (loading) return <div className="alert alert-info">Cargando reporte de Top 50 Productos...</div>;
    if (error) return <div className="alert alert-danger">Error: {error}</div>;

    return (
        <div className="mt-4">
            <h5 className="mb-3 text-success">🏆 Ranking: Top 50 Productos Más Vendidos</h5>
            
            <div className="table-responsive" style={{ maxHeight: '600px', overflowY: 'auto' }}>
                <table className="table table-striped table-hover table-sm">
                    <thead className="table-dark sticky-top">
                        <tr>
                            <th>#</th>
                            <th>Código</th>
                            <th>Nombre del Producto</th>
                            <th className="text-end">Cantidad Total Vendida</th>
                        </tr>
                    </thead>
                    <tbody>
                        {productos.length > 0 ? (
                            productos.map((producto, index) => (
                                <tr key={producto.PRODUCTO_CODIGO}>
                                    <td>{index + 1}</td>
                                    <td>{producto.PRODUCTO_CODIGO}</td>
                                    <td>{producto.PRODUCTO_NOMBRE}</td>
                                    <td className="text-end fw-bold">{producto.CANTIDAD_TOTAL_VENDIDA}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="4" className="text-center">No se encontraron productos vendidos.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default TopProductosReporte;