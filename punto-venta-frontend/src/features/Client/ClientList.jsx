// Archivo: src/features/Client/ClientList.jsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:3001/api/clientes';

const ClientList = ({ onEdit, refreshKey }) => {
    const [clients, setClients] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchClients = async () => {
        try {
            const response = await axios.get(API_URL);
            setClients(response.data);
            setLoading(false);
        } catch (err) {
            console.error("Error al cargar clientes:", err);
            setError('No se pudo conectar al servidor para obtener la lista de clientes.');
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchClients();
    }, [refreshKey]);

    if (loading) return <p className="text-info">Cargando lista de clientes...</p>;
    if (error) return <p className="alert alert-danger">{error}</p>;

    return (
        <div className="mt-4">
            <h4>Lista de Clientes</h4>
            <table className="table table-striped table-sm">
                <thead className="table-dark">
                    <tr>
                        <th>ID (NIT)</th>
                        <th>Nombre Completo</th>
                        <th>Teléfono</th>
                        <th>Tipo</th>
                        <th>Límite Crédito</th>
                        <th>Acción</th>
                    </tr>
                </thead>
                <tbody>
                    {clients.map(client => (
                        <tr key={client.id}>
                            <td>{client.id}</td>
                            <td>{client.nombre} {client.apellidos}</td>
                            <td>{client.telefono}</td>
                            <td>{client.tipoCliente}</td>
                            <td>Q{client.limiteCredito?.toFixed(2) || '0.00'}</td>
                            <td>
                                <button className="btn btn-sm btn-warning" onClick={() => onEdit(client)}>
                                    Modificar
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {clients.length === 0 && <p className="text-muted">No hay clientes registrados.</p>}
        </div>
    );
};

export default ClientList;