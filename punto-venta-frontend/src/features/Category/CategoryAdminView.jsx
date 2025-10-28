// Archivo: src/features/Category/CategoryAdminView.jsx

import React, { useState } from 'react';
import CategoryList from './CategoryList';
import CreateCategoryForm from './CreateCategoryForm';

const CategoryAdminView = () => {
    const [view, setView] = useState('list');
    const [categoryToModify, setCategoryToModify] = useState(null); // Estado para la categoría a modificar
    const [refreshKey, setRefreshKey] = useState(0);

    const handleEdit = (category) => {
        setCategoryToModify(category);
        setView('modify');
    };

    const handleCategorySaved = () => {
        setCategoryToModify(null);
        setRefreshKey(prev => prev + 1);
        setView('list');
    };

    // Esta función limpia el estado y activa la vista 'create'
    const handleCreateClick = () => {
        setCategoryToModify(null);
        setView('create');
    };

    return (
        <div className="p-4">
            <h3>Administración de Categorías</h3>
            <div className="btn-group mb-4" role="group">
                
                <button 
                    className={`btn ${view === 'list' ? 'btn-secondary' : 'btn-outline-secondary'}`}
                    onClick={() => handleCategorySaved()} 
                >
                    Lista de Categorías
                </button>
                
                <button 
                    className={`btn ${view === 'create' ? 'btn-secondary' : 'btn-outline-secondary'}`}
                    onClick={handleCreateClick} // Llama a la nueva función de click
                >
                    Crear Categoría
                </button>

                {view === 'modify' && (
                    <button className="btn btn-warning">Modificando: {categoryToModify?.nombre}</button>
                )}
            </div>

            {/* --- RENDERIZADO CORREGIDO --- */}
            {view === 'list' && <CategoryList key={refreshKey} onEdit={handleEdit} />}
            
            {(view === 'create' || view === 'modify') && (
                <CreateCategoryForm 
                    onCategorySaved={handleCategorySaved} 
                    // ¡CORRECCIÓN CLAVE AQUÍ! Usamos categoryToModify
                    initialData={categoryToModify} 
                />
            )}
        </div>
    );
};

export default CategoryAdminView;