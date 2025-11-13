// Archivo: src/features/Report/StockBajoReporte.jsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';

const REPORT_API_URL = 'http://localhost:3001/api/reportes/stock-bajo'; 

const StockBajoReporte = () => {
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
                setError("No se pudo cargar el reporte de Stock Bajo.");
                setProductos([]);
            } finally {
                setLoading(false);
            }
        };
        fetchReporte();
    }, []);

    if (loading) return <div className="alert alert-info">Cargando reporte de Stock Mínimo...</div>;
    if (error) return <div className="alert alert-danger">Error: {error}</div>;

    return (
        <div className="mt-4">
            <h5 className="mb-3 text-danger">⚠️ Productos con Stock Mínimo o Inferior</h5>
            
            <div className="table-responsive" style={{ maxHeight: '600px', overflowY: 'auto' }}>
                <table className="table table-striped table-hover table-sm">
                    <thead className="table-dark sticky-top">
                        <tr>
                            <th>Código</th>
                            <th>Nombre del Producto</th>
                            <th className="text-end">Stock Mínimo Requerido</th>
                            <th className="text-end">Stock Actual</th>
                            <th>Acción Sugerida</th>
                        </tr>
                    </thead>
                    <tbody>
                        {productos.length > 0 ? (
                            productos.map((producto) => (
                                <tr key={producto.codigo} className={producto.stockActual === 0 ? 'table-danger' : 'table-warning'}>
                                    <td>{producto.codigo}</td>
                                    <td>{producto.nombre}</td>
                                    <td className="text-end fw-bold">{producto.stockMinimo}</td>
                                    <td className="text-end fw-bold">{producto.stockActual}</td>
                                    <td>**GENERAR COMPRA**</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="5" className="text-center">Todos los productos tienen stock suficiente.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default StockBajoReporte;