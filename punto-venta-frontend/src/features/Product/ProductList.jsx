// Archivo: src/features/Product/ProductList.jsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:3001/api/productos';

const ProductList = ({ onEdit, refreshKey }) => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchProducts = async () => {
        try {
            const response = await axios.get(API_URL);
            setProducts(response.data);
            setLoading(false);
        } catch (err) {
            console.error("Error al cargar productos:", err);
            setError('No se pudo conectar al servidor para obtener la lista de productos.');
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, [refreshKey]);

    if (loading) return <p className="text-info">Cargando lista de productos...</p>;
    if (error) return <p className="alert alert-danger">{error}</p>;

    return (
        <div className="mt-4">
            <h4>Catálogo de Productos</h4>
            <table className="table table-striped table-hover table-sm">
                <thead className="table-dark">
                    <tr>
                        <th>Código</th>
                        <th>Nombre</th>
                        <th>Categoría</th>
                        <th>Precio Venta (Q)</th>
                        <th>Stock Actual</th>
                        <th>Estado</th>
                        <th>Acción</th>
                    </tr>
                </thead>
                <tbody>
                    {products.map(prod => (
                        <tr key={prod.producto_codigo}>
                            <td>{prod.producto_codigo}</td>
                            <td>{prod.nombre}</td>
                            <td>{prod.categoria}</td>
                            <td>Q{prod.precioVenta?.toFixed(2)}</td>
                            <td>{prod.stockActual}</td>
                            <td>
                                <span className={`badge bg-${prod.estado === 'activo' ? 'success' : 'danger'}`}>
                                    {prod.estado}
                                </span>
                            </td>
                            <td>
                                <button className="btn btn-sm btn-warning" onClick={() => onEdit(prod)}>
                                    Modificar
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {products.length === 0 && <p className="text-muted">No hay productos registrados.</p>}
        </div>
    );
};

export default ProductList;