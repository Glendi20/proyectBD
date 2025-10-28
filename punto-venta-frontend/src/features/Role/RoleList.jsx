// Archivo: src/features/Role/RoleList.jsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:3001/api/roles';

const RoleList = ({ onEdit, refreshKey }) => {
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchRoles = async () => {
        try {
            const response = await axios.get(API_URL);
            setRoles(response.data);
            setLoading(false);
        } catch (err) {
            console.error("Error al cargar roles:", err);
            setError('No se pudo conectar al servidor para obtener la lista de roles.');
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRoles();
    }, [refreshKey]);

    if (loading) return <p className="text-info">Cargando lista de roles...</p>;
    if (error) return <p className="alert alert-danger">{error}</p>;

    return (
        <div className="mt-4">
            <h4>Lista de Roles del Sistema</h4>
            <table className="table table-striped table-sm">
                <thead className="table-dark">
                    <tr>
                        <th>ID</th>
                        <th>Nombre del Rol</th>
                        <th>Acción</th>
                    </tr>
                </thead>
                <tbody>
                    {roles.map(role => (
                        <tr key={role.rolId}>
                            <td>{role.rolId}</td>
                            <td>{role.nombreRol}</td>
                            <td>
                                <button className="btn btn-sm btn-warning" onClick={() => onEdit(role)}>
                                    Modificar
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {roles.length === 0 && <p className="text-muted">No hay roles registrados.</p>}
        </div>
    );
};

export default RoleList;