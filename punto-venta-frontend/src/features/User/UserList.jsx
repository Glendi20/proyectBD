// Archivo: src/features/User/UserList.jsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:3001/api/usuarios';

const UserList = ({ onEdit, refreshKey }) => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchUsers = async () => {
        try {
            const response = await axios.get(API_URL);
            setUsers(response.data);
            setLoading(false);
        } catch (err) {
            console.error("Error al cargar usuarios:", err);
            setError('No se pudo conectar al servidor para obtener la lista de usuarios.');
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, [refreshKey]);

    if (loading) return <p className="text-info">Cargando lista de usuarios...</p>;
    if (error) return <p className="alert alert-danger">{error}</p>;

    return (
        <div className="mt-4">
            <h4>Lista de Empleados</h4>
            <table className="table table-striped table-sm">
                <thead className="table-dark">
                    <tr>
                        <th>DPI</th>
                        <th>Nombre Completo</th>
                        <th>Usuario</th>
                        <th>Rol</th>
                        <th>Acción</th>
                    </tr>
                </thead>
                <tbody>
                    {users.map(user => (
                        <tr key={user.dpi}>
                            <td>{user.dpi}</td>
                            <td>{user.nombre} {user.apellidos}</td>
                            <td>{user.nombreUsuario}</td>
                            <td>{user.rol}</td>
                            <td>
                                <button className="btn btn-sm btn-warning" onClick={() => onEdit(user)}>
                                    Modificar
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {users.length === 0 && <p className="text-muted">No hay empleados registrados (excepto el admin).</p>}
        </div>
    );
};

export default UserList;