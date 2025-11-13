// Archivo: src/features/Report/FlujoInventarioReporte.jsx

import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';

const REPORT_API_URL = 'http://localhost:3001/api/reportes/flujo-inventario';
const SEARCH_PRODUCTO_URL = 'http://localhost:3001/api/ventas/search'; // Reutilizamos el endpoint de búsqueda

const FlujoInventarioReporte = () => {
    const [movimientos, setMovimientos] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    
    // Filtros
    const [productCode, setProductCode] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    
    // Búsqueda de producto (para autocompletar o confirmar nombre)
    const [searchTerm, setSearchTerm] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState(null);

    // --- BÚSQUEDA DE PRODUCTO ---
    const handleSearchProducto = useCallback(async (term) => {
        if (term.length < 2) {
            setSearchResults([]);
            return;
        }
        try {
            const response = await axios.get(SEARCH_PRODUCTO_URL, { params: { q: term } });
            setSearchResults(response.data);
        } catch (e) {
            setSearchResults([]);
        }
    }, []);

    // --- LÓGICA DE REPORTE ---
    const handleGenerateReport = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setMovimientos([]);

        if (!selectedProduct) {
            setError("Debe seleccionar un producto de la lista.");
            setLoading(false);
            return;
        }

        try {
            const params = {
                codigo: selectedProduct.codigo,
                startDate: startDate,
                endDate: endDate
            };
            const response = await axios.get(REPORT_API_URL, { params });
            setMovimientos(response.data);
        } catch (err) {
            setError(err.response?.data?.error || "Error al obtener el reporte de flujo de inventario.");
        } finally {
            setLoading(false);
        }
    };

    // Al seleccionar un producto de la búsqueda
    const selectProduct = (product) => {
        setSelectedProduct(product);
        setProductCode(product.codigo);
        setSearchTerm(product.nombre);
        setSearchResults([]);
    };
    
    // Efecto para disparar la búsqueda de productos mientras el usuario escribe
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            handleSearchProducto(searchTerm);
        }, 300);
        return () => clearTimeout(timeoutId);
    }, [searchTerm, handleSearchProducto]);


    return (
        <div className="mt-4">
            <h5 className="mb-3 text-info">🔄 Reporte: Flujo de Inventario (Kardex)</h5>
            
            <form onSubmit={handleGenerateReport} className="card shadow-sm p-3 mb-4">
                <h6>Filtros de Análisis</h6>
                <div className="row g-3">
                    {/* Input de Búsqueda de Producto */}
                    <div className="col-md-5 position-relative">
                        <label className="form-label">Producto *</label>
                        <input 
                            type="text" 
                            className="form-control" 
                            placeholder="Buscar producto por nombre o código..."
                            value={searchTerm}
                            onChange={(e) => { setSearchTerm(e.target.value); setSelectedProduct(null); }}
                        />
                        {searchResults.length > 0 && (
                            <ul className="list-group position-absolute w-100 z-1000" style={{ zIndex: 10, backgroundColor: 'white', border: '1px solid #ccc' }}>
                                {searchResults.map((p) => (
                                    <li key={p.codigo} className="list-group-item list-group-item-action" onClick={() => selectProduct(p)}>
                                        {p.nombre} ({p.codigo})
                                    </li>
                                ))}
                            </ul>
                        )}
                        {selectedProduct && <small className="text-success">Seleccionado: {selectedProduct.nombre}</small>}
                    </div>

                    {/* Filtros de Fecha */}
                    <div className="col-md-3">
                        <label className="form-label">Desde:</label>
                        <input type="date" className="form-control" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                    </div>
                    <div className="col-md-3">
                        <label className="form-label">Hasta:</label>
                        <input type="date" className="form-control" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                    </div>
                    
                    {/* Botón de Generar */}
                    <div className="col-md-1 d-flex align-items-end">
                        <button type="submit" className="btn btn-primary" disabled={loading || !selectedProduct}>
                            {loading ? 'Generando...' : 'Ver'}
                        </button>
                    </div>
                </div>
            </form>

            {error && <div className="alert alert-danger">{error}</div>}
            
            {/* --- TABLA DE RESULTADOS --- */}
            {movimientos.length > 0 && (
                <div className="table-responsive mt-4">
                    <table className="table table-striped table-sm">
                        <thead className="table-dark">
                            <tr>
                                <th>Fecha</th>
                                <th>Movimiento</th>
                                <th>Cantidad</th>
                                <th>Doc. Referencia</th>
                            </tr>
                        </thead>
                        <tbody>
                            {movimientos.map((mov, index) => (
                                <tr key={index} className={mov.tipoMovimiento === 'SALIDA' ? 'table-danger' : 'table-success'}>
                                    <td>{new Date(mov.fecha).toLocaleDateString()}</td>
                                    <td>{mov.tipoMovimiento}</td>
                                    <td>{mov.cantidad}</td>
                                    <td>{mov.documentoId}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
            
            {movimientos.length === 0 && !loading && !error && selectedProduct && (
                <div className="alert alert-warning mt-3">
                    No se encontraron movimientos (entradas/salidas) para este producto en el rango de fechas seleccionado.
                </div>
            )}
        </div>
    );
};

export default FlujoInventarioReporte;