// Archivo: src/features/Proveedor/ProveedorList.jsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:3001/api/proveedores';

const ProveedorList = ({ onEdit, refreshKey }) => {
    const [suppliers, setSuppliers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchSuppliers = async () => {
        try {
            const response = await axios.get(API_URL);
            setSuppliers(response.data);
            setLoading(false);
        } catch (err) {
            console.error("Error al cargar proveedores:", err);
            setError('No se pudo conectar al servidor para obtener la lista de proveedores.');
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSuppliers();
    }, [refreshKey]); // Se ejecuta al inicio y cada vez que se guarda/crea uno nuevo

    if (loading) return <p className="text-info">Cargando lista de proveedores...</p>;
    if (error) return <p className="alert alert-danger">{error}</p>;

    return (
        <div className="mt-4">
            <h4>Lista de Proveedores</h4>
            <table className="table table-striped table-sm">
                <thead className="table-dark">
                    <tr>
                        <th>ID (NIT)</th>
                        <th>Razón Social</th>
                        <th>Teléfono</th>
                        <th>Cond. Pago</th>
                        <th>Acción</th>
                    </tr>
                </thead>
                <tbody>
                    {suppliers.map(sup => (
                        <tr key={sup.id}>
                            <td>{sup.id}</td>
                            <td>{sup.razonSocial}</td>
                            <td>{sup.telefono}</td>
                            <td>{sup.condicionesPago}</td>
                            <td>
                                <button className="btn btn-sm btn-warning" onClick={() => onEdit(sup)}>
                                    Modificar
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {suppliers.length === 0 && <p className="text-muted">No hay proveedores registrados.</p>}
        </div>
    );
};

export default ProveedorList;