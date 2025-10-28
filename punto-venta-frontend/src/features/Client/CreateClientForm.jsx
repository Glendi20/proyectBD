// Archivo: punto-venta-frontend/src/features/Client/CreateClientForm.jsx

import React, { useState } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:3001/api/clientes';

const CreateClientForm = ({ onClientSaved, initialData = null }) => {
    const isEditing = initialData !== null;
    
    // Estado inicial: Mapeo de los alias del backend (camelCase) a las claves del estado (snake_case)
    const [formData, setFormData] = useState({
        // ID y Nombres
        cliente_id: initialData?.id || '',
        nombre: initialData?.nombre || '',
        apellidos: initialData?.apellidos || '',
        
        // Contacto (CORRECCIÓN INTEGRADA: Mapea camelCase a snake_case)
        direccion: initialData?.direccion || '',
        telefono: initialData?.telefono || '',
        correo_electronico: initialData?.correoElectronico || '', // Mapea de initialData.correoElectronico
        
        // Tipo y Crédito
        tipo_cliente: initialData?.tipoCliente || 'normal',
        limite_credito: initialData?.limiteCredito || 0,
    });
    const [message, setMessage] = useState('');

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');

        try {
            // Determina el endpoint: POST para crear, PUT para modificar (usando el ID)
            const endpoint = isEditing ? `${API_URL}/${formData.cliente_id}` : API_URL;
            const method = isEditing ? 'put' : 'post';
            
            await axios({
                method: method,
                url: endpoint,
                data: formData
            });

            setMessage(`✅ Cliente ${isEditing ? 'modificado' : 'registrado'} con éxito.`);
            
            // Limpiar campos después de una creación exitosa
            if (!isEditing) {
                setFormData(prev => ({...prev, cliente_id: '', nombre: '', apellidos: '', telefono: ''}));
            }
            
            // Llama a la función padre para refrescar la lista
            onClientSaved(); 

        } catch (err) {
            console.error("Error al guardar cliente:", err);
            setMessage(`❌ Error al guardar: ${err.response?.data?.error || err.message}`);
        }
    };

    return (
        <div className="mt-4 card p-4">
            <h4>{isEditing ? `Modificar Cliente ID: ${formData.cliente_id}` : 'Crear Nuevo Cliente'}</h4>
            <form onSubmit={handleSubmit}>
                <div className="row">
                    {/* ID / NIT */}
                    <div className="col-md-6 mb-3">
                        <label className="form-label">ID / NIT:</label>
                        <input type="text" className="form-control" name="cliente_id" value={formData.cliente_id} onChange={handleChange} required disabled={isEditing} />
                    </div>
                    {/* Tipo de Cliente */}
                    <div className="col-md-6 mb-3">
                        <label className="form-label">Tipo de Cliente:</label>
                        <select className="form-select" name="tipo_cliente" value={formData.tipo_cliente} onChange={handleChange} required>
                            <option value="normal">Normal</option>
                            <option value="mayorista">Mayorista</option>
                        </select>
                    </div>

                    {/* Nombre y Apellido */}
                    <div className="col-md-6 mb-3">
                        <label className="form-label">Nombre:</label>
                        <input type="text" className="form-control" name="nombre" value={formData.nombre} onChange={handleChange} required />
                    </div>
                    <div className="col-md-6 mb-3">
                        <label className="form-label">Apellido:</label>
                        <input type="text" className="form-control" name="apellidos" value={formData.apellidos} onChange={handleChange} />
                    </div>

                    {/* Teléfono y Correo */}
                    <div className="col-md-6 mb-3">
                        <label className="form-label">Teléfono:</label>
                        <input type="text" className="form-control" name="telefono" value={formData.telefono} onChange={handleChange} />
                    </div>
                    <div className="col-md-6 mb-3">
                        <label className="form-label">Correo Electrónico:</label>
                        <input type="email" className="form-control" name="correo_electronico" value={formData.correo_electronico} onChange={handleChange} />
                    </div>
                    
                    {/* Límite de Crédito y Dirección */}
                    <div className="col-md-6 mb-3">
                        <label className="form-label">Límite de Crédito:</label>
                        <input type="number" step="0.01" className="form-control" name="limite_credito" value={formData.limite_credito} onChange={handleChange} required={formData.tipo_cliente === 'mayorista'} />
                    </div>
                    <div className="col-md-6 mb-3">
                        <label className="form-label">Dirección:</label>
                        <input type="text" className="form-control" name="direccion" value={formData.direccion} onChange={handleChange} />
                    </div>
                </div>
                
                {message && <p className={`alert ${message.startsWith('✅') ? 'alert-success' : 'alert-danger'}`}>{message}</p>}

                <div className="d-flex justify-content-end mt-3">
                    <button type="submit" className="btn btn-primary me-2">
                        {isEditing ? 'Guardar Cambios' : 'Registrar Cliente'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CreateClientForm;