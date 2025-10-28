// Archivo: src/components/CreateTaxForm.jsx

import React, { useState } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:3001/api/impuestos/tasas';

const CreateTaxForm = ({ onTaxCreated, initialData = null }) => {
    const [name, setName] = useState(initialData?.nombre || '');
    const [percentage, setPercentage] = useState(initialData?.porcentaje || '');
    const [message, setMessage] = useState('');
    const isEditing = initialData !== null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');

        try {
            const endpoint = isEditing ? `${API_URL}/${initialData.id}` : API_URL;
            const method = isEditing ? 'put' : 'post';
            
            const response = await axios({
                method: method,
                url: endpoint,
                data: { nombre: name, tasa_porcentaje: parseFloat(percentage) }
            });

            setMessage(`✅ Tasa ${isEditing ? 'modificada' : 'creada'} con éxito.`);
            
            // Llama a la función de callback para actualizar la lista
            onTaxCreated();

        } catch (err) {
            console.error("Error al guardar la tasa:", err);
            setMessage(`❌ Error al guardar: ${err.response?.data?.error || err.message}`);
        }
    };

    return (
        <div className="mt-4 card p-4">
            <h4>{isEditing ? 'Modificar Tasa' : 'Crear Nueva Tasa de Impuesto'}</h4>
            <form onSubmit={handleSubmit}>
                <div className="mb-3">
                    <label className="form-label">Nombre (Ej: IVA)</label>
                    <input 
                        type="text" 
                        className="form-control" 
                        value={name} 
                        onChange={(e) => setName(e.target.value)} 
                        required
                    />
                </div>
                <div className="mb-3">
                    <label className="form-label">Porcentaje (Ej: 13.0)</label>
                    <input 
                        type="number" 
                        step="0.01" 
                        className="form-control" 
                        value={percentage} 
                        onChange={(e) => setPercentage(e.target.value)} 
                        required
                    />
                </div>
                
                {message && <p className={`alert ${message.startsWith('✅') ? 'alert-success' : 'alert-danger'}`}>{message}</p>}

                <button type="submit" className="btn btn-primary me-2">
                    {isEditing ? 'Guardar Cambios' : 'Crear Impuesto'}
                </button>
            </form>
        </div>
    );
};

export default CreateTaxForm;