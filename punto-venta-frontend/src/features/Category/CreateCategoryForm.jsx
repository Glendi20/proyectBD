// Archivo: punto-venta-frontend/src/features/Category/CreateCategoryForm.jsx

import React, { useState } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:3001/api/categorias';

const CreateCategoryForm = ({ onCategorySaved, initialData = null }) => {
    // 1. Estado: solo necesitamos el nombre
    const [name, setName] = useState(initialData?.nombre || '');
    const [message, setMessage] = useState('');
    const isEditing = initialData !== null; // Determina si es POST o PUT

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');

        if (!name.trim()) {
            setMessage('❌ El nombre de la categoría no puede estar vacío.');
            return;
        }

        try {
            // Determina el endpoint y el método
            const endpoint = isEditing ? `${API_URL}/${initialData.categoriaId}` : API_URL;
            const method = isEditing ? 'put' : 'post';
            
            await axios({
                method: method,
                url: endpoint,
                data: { nombre: name } // Enviamos solo el nombre
            });

            setMessage(`✅ Categoría ${isEditing ? 'modificada' : 'creada'} con éxito.`);
            
            // Si es un POST exitoso, limpia el campo.
            if (!isEditing) {
                setName('');
            }

            // Llama a la función de callback para actualizar la lista de categorías
            onCategorySaved();

        } catch (err) {
            console.error("Error al guardar la categoría:", err);
            setMessage(`❌ Error al guardar: ${err.response?.data?.error || err.message}`);
        }
    };

    return (
        <div className="mt-4 card p-4">
            <h4>{isEditing ? `Modificar Categoría: ${initialData.nombre}` : 'Crear Nueva Categoría'}</h4>
            <form onSubmit={handleSubmit}>
                <div className="mb-3">
                    <label className="form-label">Nombre de la Categoría:</label>
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
                    {isEditing ? 'Guardar Cambios' : 'Guardar Categoría'}
                </button>
            </form>
        </div>
    );
};

export default CreateCategoryForm;