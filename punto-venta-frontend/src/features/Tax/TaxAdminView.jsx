// Archivo: src/components/TaxAdminView.jsx

import React, { useState } from 'react';
import TaxList from './TaxList';
import CreateTaxForm from './CreateTaxForm';

const TaxAdminView = () => {
    // Estado para controlar la vista actual
    const [view, setView] = useState('list'); // 'list', 'create', 'modify'
    const [taxToModify, setTaxToModify] = useState(null); // Datos del impuesto a editar

    // Función para manejar la edición
    const handleEdit = (tax) => {
        setTaxToModify(tax);
        setView('modify');
    };

    // Función para resetear a la vista de lista después de una acción exitosa
    const resetView = () => {
        setTaxToModify(null);
        setView('list');
    };

    return (
        <div className="p-4">
            <h3>Administración de Tasas de Impuestos</h3>
            <div className="btn-group mb-4" role="group">
                <button 
                    className={`btn ${view === 'list' ? 'btn-secondary' : 'btn-outline-secondary'}`}
                    onClick={() => resetView()}
                >
                    Lista de Impuestos
                </button>
                <button 
                    className={`btn ${view === 'create' ? 'btn-secondary' : 'btn-outline-secondary'}`}
                    onClick={() => { setTaxToModify(null); setView('create'); }}
                >
                    Crear Impuesto
                </button>
                {/* El botón de modificar aparece solo si estamos en modo modificación */}
                {view === 'modify' && (
                    <button className="btn btn-warning">Modificando: {taxToModify?.nombre}</button>
                )}
            </div>

            {/* Renderizado Condicional del Contenido */}
            {view === 'list' && <TaxList onEdit={handleEdit} />}
            
            {view === 'create' && <CreateTaxForm onTaxCreated={resetView} />}
            
            {view === 'modify' && (
                <CreateTaxForm 
                    onTaxCreated={resetView} 
                    initialData={taxToModify} 
                    // Nota: El método PUT/Modificar no está implementado en el backend, solo el UI lo simula
                />
            )}
            
            {/* Mensaje de Nota (Para el usuario) */}
            {(view === 'modify' || view === 'create') && (
                <p className="mt-3 text-muted small">
                    *La función de Modificar (PUT) en el backend no está implementada en el controlador actual, solo la interfaz.
                </p>
            )}
        </div>
    );
};

export default TaxAdminView;