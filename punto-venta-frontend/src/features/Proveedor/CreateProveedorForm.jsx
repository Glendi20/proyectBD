// Archivo: src/features/Proveedor/CreateProveedorForm.jsx

import React, { useState } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:3001/api/proveedores';

const CreateProveedorForm = ({ onProveedorSaved, initialData = null }) => {
    const isEditing = initialData !== null;
    
    // Estado para manejar los 7 campos requeridos
    const [formData, setFormData] = useState({
        id: initialData?.id || '',
        razonSocial: initialData?.razonSocial || '',
        direccion: initialData?.direccion || '',
        telefono: initialData?.telefono || '',
        correoElectronico: initialData?.correoElectronico || '',
        condicionesPago: initialData?.condicionesPago || 'contado',
        plazoCreditoDias: initialData?.plazoCreditoDias || 0,
        representante: initialData?.representante || '',
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
            const endpoint = isEditing ? `${API_URL}/${formData.id}` : API_URL;
            const method = isEditing ? 'put' : 'post';
            
            await axios({
                method: method,
                url: endpoint,
                data: { 
                    proveedor_id: formData.id, // Solo necesario para POST
                    razon_social: formData.razonSocial,
                    direccion: formData.direccion,
                    telefono: formData.telefono,
                    correo_electronico: formData.correoElectronico,
                    condiciones_pago: formData.condicionesPago,
                    plazo_credito_dias: parseInt(formData.plazoCreditoDias),
                    representante: formData.representante
                }
            });

            setMessage(`✅ Proveedor ${isEditing ? 'modificado' : 'creado'} con éxito.`);
            if (!isEditing) setFormData(prev => ({ ...prev, id: '', razonSocial: '' })); // Limpiar ID/RazonSocial
            
            onProveedorSaved(); // Forzar actualización de la lista

        } catch (err) {
            console.error("Error al guardar el proveedor:", err);
            setMessage(`❌ Error al guardar: ${err.response?.data?.error || err.message}`);
        }
    };

    return (
        <div className="mt-4 card p-4">
            <h4>{isEditing ? `Modificar: ${initialData.razonSocial}` : 'Crear Nuevo Proveedor'}</h4>
            <form onSubmit={handleSubmit}>
                <div className="row">
                    {/* Fila 1: ID y Razón Social */}
                    <div className="col-md-4 mb-3">
                        <label className="form-label">ID / NIT:</label>
                        <input type="text" className="form-control" name="id" value={formData.id} onChange={handleChange} required disabled={isEditing} />
                    </div>
                    <div className="col-md-8 mb-3">
                        <label className="form-label">Razón Social:</label>
                        <input type="text" className="form-control" name="razonSocial" value={formData.razonSocial} onChange={handleChange} required />
                    </div>
                    
                    {/* Fila 2: Contacto */}
                    <div className="col-md-6 mb-3">
                        <label className="form-label">Teléfono:</label>
                        <input type="text" className="form-control" name="telefono" value={formData.telefono} onChange={handleChange} />
                    </div>
                    <div className="col-md-6 mb-3">
                        <label className="form-label">Correo Electrónico:</label>
                        <input type="email" className="form-control" name="correoElectronico" value={formData.correoElectronico} onChange={handleChange} />
                    </div>

                    {/* Fila 3: Condiciones de Pago */}
                    <div className="col-md-4 mb-3">
                        <label className="form-label">Condiciones de Pago:</label>
                        <select className="form-select" name="condicionesPago" value={formData.condicionesPago} onChange={handleChange} required>
                            <option value="contado">Contado</option>
                            <option value="crédito">Crédito</option>
                        </select>
                    </div>
                    <div className="col-md-4 mb-3">
                        <label className="form-label">Plazo Crédito (Días):</label>
                        <input type="number" className="form-control" name="plazoCreditoDias" value={formData.plazoCreditoDias} onChange={handleChange} required={formData.condicionesPago === 'crédito'} disabled={formData.condicionesPago !== 'crédito'}/>
                    </div>
                    <div className="col-md-4 mb-3">
                        <label className="form-label">Representante:</label>
                        <input type="text" className="form-control" name="representante" value={formData.representante} onChange={handleChange} />
                    </div>

                    {/* Fila 4: Dirección */}
                    <div className="col-12 mb-3">
                        <label className="form-label">Dirección:</label>
                        <input type="text" className="form-control" name="direccion" value={formData.direccion} onChange={handleChange} />
                    </div>
                </div>
                
                {message && <p className={`alert ${message.startsWith('✅') ? 'alert-success' : 'alert-danger'}`}>{message}</p>}

                <button type="submit" className="btn btn-primary me-2">
                    {isEditing ? 'Guardar Cambios' : 'Registrar Proveedor'}
                </button>
            </form>
        </div>
    );
};

export default CreateProveedorForm;