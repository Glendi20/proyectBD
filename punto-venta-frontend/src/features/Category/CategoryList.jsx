// Archivo: src/components/CategoryList.jsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:3001/api/categorias';

const CategoryList = ({ onEdit }) => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchCategories = async () => {
        try {
            const response = await axios.get(API_URL);
            setCategories(response.data);
            setLoading(false);
        } catch (err) {
            console.error("Error al cargar categorías:", err);
            setError('No se pudo conectar al servidor para obtener la lista de categorías.');
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    if (loading) return <p className="text-info">Cargando lista de categorías...</p>;
    if (error) return <p className="alert alert-danger">{error}</p>;

    return (
        <div className="mt-4">
            <h4>Lista de Categorías</h4>
            <table className="table table-striped table-sm">
                <thead className="table-dark">
                    <tr>
                        <th>ID</th>
                        <th>Nombre</th>
                        <th>Acción</th>
                    </tr>
                </thead>
                <tbody>
                    {categories.map(cat => (
                        <tr key={cat.categoriaId}>
                            <td>{cat.categoriaId}</td>
                            <td>{cat.nombre}</td>
                            <td>
                                <button className="btn btn-sm btn-warning" onClick={() => onEdit(cat)}>
                                    Modificar
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {categories.length === 0 && <p className="text-muted">No hay categorías registradas.</p>}
        </div>
    );
};

export default CategoryList;