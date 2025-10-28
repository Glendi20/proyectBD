// Archivo: src/features/Discount/DiscountCatalogManager.jsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:3001/api/descuentos/catalogo';

const DiscountCatalogManager = () => {
    const [discounts, setDiscounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [refreshKey, setRefreshKey] = useState(0);

    // Estado del formulario (para POST y PUT)
    const [formData, setFormData] = useState({
        id: null,
        nombre: '',
        porcentaje: '',
    });
    const [message, setMessage] = useState('');
    const isEditing = formData.id !== null;

    // --- LÓGICA DE CARGA DE DATOS ---
    useEffect(() => {
        const fetchDiscounts = async () => {
            try {
                const response = await axios.get(API_URL);
                setDiscounts(response.data);
                setLoading(false);
            } catch (err) {
                console.error("Error al cargar el catálogo de descuentos:", err);
                setError('No se pudo conectar al servidor para obtener las tasas.');
                setLoading(false);
            }
        };
        fetchDiscounts();
    }, [refreshKey]); // Se recarga cuando se crea/modifica una tasa

    // --- LÓGICA DEL FORMULARIO ---
    const handleChange = (e) => {
        const { name, value } = e.target;
        // La tasa debe ser numérica
        setFormData(prev => ({ 
            ...prev, 
            [name]: name === 'porcentaje' ? parseFloat(value) : value 
        }));
    };

    const handleEdit = (discount) => {
        // Carga los datos de la tasa seleccionada para edición
        setFormData({
            id: discount.id,
            nombre: discount.nombre,
            porcentaje: discount.porcentaje,
        });
        setMessage('');
    };

    const handleCancel = () => {
        // Limpia el formulario y sale del modo edición
        setFormData({ id: null, nombre: '', porcentaje: '' });
        setMessage('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');

        try {
            const endpoint = isEditing ? `${API_URL}/${formData.id}` : API_URL;
            const method = isEditing ? 'put' : 'post';
            
            await axios({
                method: method,
                url: endpoint,
                data: { 
                    nombre_descuento: formData.nombre,
                    tasa_porcentaje: formData.porcentaje
                }
            });

            setMessage(`✅ Tasa ${isEditing ? 'modificada' : 'creada'} con éxito.`);
            handleCancel(); // Limpiar el formulario
            setRefreshKey(prev => prev + 1); // Forzar recarga de la lista

        } catch (err) {
            console.error("Error al guardar la tasa:", err);
            setMessage(`❌ Error al guardar: ${err.response?.data?.error || err.message}`);
        }
    };

    if (loading) return <p className="text-info p-4">Cargando catálogo de descuentos...</p>;
    if (error) return <p className="alert alert-danger p-4">{error}</p>;

    return (
        <div className="row">
            {/* Columna Izquierda: Lista de Tasas */}
            <div className="col-md-7">
                <h4>Catálogo de Tasas (%)</h4>
                <table className="table table-striped table-hover table-sm mt-3">
                    <thead className="table-dark">
                        <tr>
                            <th>ID</th>
                            <th>Nombre</th>
                            <th>Tasa (%)</th>
                            <th>Acción</th>
                        </tr>
                    </thead>
                    <tbody>
                        {discounts.map(discount => (
                            <tr key={discount.id}>
                                <td>{discount.id}</td>
                                <td>{discount.nombre}</td>
                                <td>{discount.porcentaje.toFixed(2)}</td>
                                <td>
                                    <button className="btn btn-sm btn-warning" onClick={() => handleEdit(discount)}>
                                        Modificar
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                {discounts.length === 0 && <p className="text-muted">No hay tasas de descuento registradas.</p>}
            </div>

            {/* Columna Derecha: Formulario de Creación/Edición */}
            <div className="col-md-5">
                <div className="card p-4 bg-light">
                    <h5>{isEditing ? `Modificar Tasa ID: ${formData.id}` : 'Crear Nueva Tasa'}</h5>
                    
                    {message && <p className={`alert mt-3 ${message.startsWith('✅') ? 'alert-success' : 'alert-danger'}`}>{message}</p>}
                    
                    <form onSubmit={handleSubmit}>
                        <div className="mb-3">
                            <label className="form-label">Nombre del Descuento</label>
                            <input 
                                type="text" 
                                className="form-control" 
                                name="nombre" 
                                value={formData.nombre} 
                                onChange={handleChange} 
                                required
                            />
                        </div>
                        <div className="mb-3">
                            <label className="form-label">Porcentaje (%)</label>
                            <input 
                                type="number" 
                                step="0.01" 
                                className="form-control" 
                                name="porcentaje" 
                                value={formData.porcentaje} 
                                onChange={handleChange} 
                                required
                            />
                        </div>
                        
                        <button type="submit" className={`btn ${isEditing ? 'btn-success' : 'btn-primary'} me-2`}>
                            {isEditing ? 'Guardar Cambios' : 'Crear Tasa'}
                        </button>
                        {isEditing && (
                            <button type="button" className="btn btn-danger" onClick={handleCancel}>
                                Cancelar
                            </button>
                        )}
                    </form>
                </div>
            </div>
        </div>
    );
};

export default DiscountCatalogManager;