// Archivo: src/features/Role/CreateRoleForm.jsx

import React, { useState } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:3001/api/roles';

const CreateRoleForm = ({ onRoleSaved, initialData = null }) => {
    const [name, setName] = useState(initialData?.nombreRol || '');
    const [message, setMessage] = useState('');
    const isEditing = initialData !== null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');

        if (!name.trim()) {
            setMessage('❌ El nombre del rol no puede estar vacío.');
            return;
        }

        try {
            // Determina el endpoint y el método
            const endpoint = isEditing ? `${API_URL}/${initialData.rolId}` : API_URL;
            const method = isEditing ? 'put' : 'post';
            
            await axios({
                method: method,
                url: endpoint,
                data: { nombre_rol: name }
            });

            setMessage(`✅ Rol ${isEditing ? 'modificado' : 'creado'} con éxito.`);
            
            if (!isEditing) {
                setName('');
            }
            
            onRoleSaved(); // Llama a la función de callback para actualizar la lista

        } catch (err) {
            console.error("Error al guardar el rol:", err);
            setMessage(`❌ Error al guardar: ${err.response?.data?.error || err.message}`);
        }
    };

    return (
        <div className="mt-4 card p-4">
            <h4>{isEditing ? `Modificar Rol ID: ${initialData.rolId}` : 'Crear Nuevo Rol'}</h4>
            <form onSubmit={handleSubmit}>
                <div className="mb-3">
                    <label className="form-label">Nombre del Rol (Ej: Cajero, Supervisor)</label>
                    <input 
                        type="text" 
                        className="form-control" 
                        value={name} 
                        onChange={(e) => setName(e.target.value)} 
                        required
                    />
                </div>
                
                {message && <p className={`alert ${message.startsWith('✅') ? 'alert-success' : 'alert-danger'}`}>{message}</p>}

                <button type="submit" className="btn btn-primary me-2">
                    {isEditing ? 'Guardar Cambios' : 'Crear Rol'}
                </button>
            </form>
        </div>
    );
};

export default CreateRoleForm;