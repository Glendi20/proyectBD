// Archivo: src/components/TaxList.jsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:3001/api/impuestos/tasas';

const TaxList = ({ onEdit }) => {
    const [taxes, setTaxes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchTaxes = async () => {
            try {
                const response = await axios.get(API_URL);
                setTaxes(response.data);
                setLoading(false);
            } catch (err) {
                console.error("Error al cargar las tasas:", err);
                setError('No se pudo conectar al servidor para obtener la lista de impuestos.');
                setLoading(false);
            }
        };
        fetchTaxes();
    }, []);

    if (loading) return <p className="text-info">Cargando lista de impuestos...</p>;
    if (error) return <p className="alert alert-danger">{error}</p>;

    return (
        <div className="mt-4">
            <h4>Lista de Tasas de Impuestos</h4>
            <table className="table table-striped table-sm">
                <thead className="table-dark">
                    <tr>
                        <th>ID</th>
                        <th>Nombre</th>
                        <th>Tasa (%)</th>
                        <th>Acción</th>
                    </tr>
                </thead>
                <tbody>
                    {taxes.map(tax => (
                        <tr key={tax.id}>
                            <td>{tax.id}</td>
                            <td>{tax.nombre}</td>
                            <td>{tax.porcentaje}</td>
                            <td>
                                <button className="btn btn-sm btn-warning" onClick={() => onEdit(tax)}>
                                    Modificar
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {taxes.length === 0 && <p className="text-muted">No hay tasas de impuestos registradas.</p>}
        </div>
    );
};

export default TaxList;