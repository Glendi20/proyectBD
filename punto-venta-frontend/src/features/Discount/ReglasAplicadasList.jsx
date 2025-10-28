// Archivo: src/features/Discount/ReglasAplicadasList.jsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:3001/api/descuentos/aplicadas';

const ReglasAplicadasList = () => {
    const [rules, setRules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refreshKey, setRefreshKey] = useState(0); // Para forzar la recarga

    const formatDate = (dateString) => {
        if (!dateString) return 'Permanente';
        // Asume que la fecha viene en formato compatible con JavaScript (o ajusta si es necesario)
        const date = new Date(dateString);
        return date.toLocaleDateString();
    };

    // Función para obtener los datos
    const fetchRules = async () => {
        try {
            const response = await axios.get(API_URL);
            setRules(response.data);
            setLoading(false);
            setError(null);
        } catch (err) {
            console.error("Error al cargar reglas:", err);
            setError('No se pudo conectar al servidor para obtener la lista de reglas aplicadas.');
            setLoading(false);
        }
    };

    // --- FUNCIÓN PARA DESHABILITAR (ELIMINAR) ---
    const handleDelete = async (id) => {
        if (!window.confirm(`¿Está seguro de que desea DESHABILITAR (eliminar) la regla ID ${id}? Esta acción es irreversible.`)) {
            return;
        }

        try {
            // Llama al endpoint DELETE que creamos
            await axios.delete(`${API_URL}/${id}`);
            alert(`Regla ID ${id} deshabilitada con éxito.`);
            
            // Forzar la recarga de la lista
            setRefreshKey(prev => prev + 1); 
        } catch (err) {
            alert(`Error al deshabilitar: ${err.response?.data?.error || 'Error de conexión.'}`);
            console.error("Error al eliminar regla:", err);
        }
    };
    // ---------------------------------------------

    useEffect(() => {
        fetchRules();
    }, [refreshKey]); // Depende del refreshKey para recargar después de eliminar

    if (loading) return <p className="text-info mt-4">Cargando reglas aplicadas...</p>;
    if (error) return <p className="alert alert-danger mt-4">{error}</p>;

    return (
        <div className="mt-4">
            <h4>Historial y Reglas Aplicadas</h4>
            <table className="table table-striped table-sm table-bordered">
                <thead className="table-dark">
                    <tr>
                        <th>ID Regla</th>
                        <th>Descuento</th>
                        <th>Tasa (%)</th>
                        <th>Aplica a</th>
                        <th>Objetivo</th>
                        <th>Finaliza</th>
                        <th>Acción</th>
                    </tr>
                </thead>
                <tbody>
                    {rules.map(rule => (
                        <tr key={rule.reglaId}>
                            <td>{rule.reglaId}</td>
                            <td>{rule.nombreDescuento}</td>
                            <td>{rule.porcentaje?.toFixed(2)}%</td>
                            <td><span className={`badge ${rule.tipoAplicacion === 'GLOBAL' ? 'bg-success' : 'bg-secondary'}`}>{rule.tipoAplicacion}</span></td>
                            <td>{rule.aplicadoA}</td>
                            <td>{formatDate(rule.fechaFin)}</td>
                            <td>
                                <button 
                                    className="btn btn-sm btn-danger" 
                                    onClick={() => handleDelete(rule.reglaId)}
                                >
                                    Deshabilitar
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
            {rules.length === 0 && <p className="text-muted">No hay reglas de descuento aplicadas.</p>}
        </div>
    );
};

export default ReglasAplicadasList;