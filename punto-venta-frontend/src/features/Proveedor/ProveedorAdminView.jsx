// Archivo: src/features/Proveedor/ProveedorAdminView.jsx

import React, { useState } from 'react';
import ProveedorList from './ProveedorList';
import CreateProveedorForm from './CreateProveedorForm';

const ProveedorAdminView = () => {
    const [view, setView] = useState('list'); // 'list', 'create', 'modify'
    const [supplierToModify, setSupplierToModify] = useState(null); 
    const [refreshKey, setRefreshKey] = useState(0); 

    const handleEdit = (supplier) => {
        // Mapear los nombres de alias a los nombres de estado si es necesario (ej: razonSocial -> razonSocial)
        setSupplierToModify(supplier);
        setView('modify');
    };

    // Función para resetear a la vista de lista y forzar la recarga
    const handleProveedorSaved = () => {
        setSupplierToModify(null);
        setRefreshKey(prev => prev + 1); // Forzar re-render de la lista
        setView('list');
    };

    const handleCreateClick = () => {
        setSupplierToModify(null);
        setView('create');
    };

    return (
        <div className="p-4">
            <h3>Administración de Proveedores</h3>
            <div className="btn-group mb-4" role="group">
                <button 
                    className={`btn ${view === 'list' ? 'btn-secondary' : 'btn-outline-secondary'}`}
                    onClick={() => handleProveedorSaved()}
                >
                    Lista de Proveedores
                </button>
                <button 
                    className={`btn ${view === 'create' ? 'btn-secondary' : 'btn-outline-secondary'}`}
                    onClick={handleCreateClick}
                >
                    Crear Proveedor
                </button>
                {view === 'modify' && (
                    <button className="btn btn-warning">Modificando: {supplierToModify?.razonSocial}</button>
                )}
            </div>

            {/* Renderizado Condicional del Contenido */}
            {view === 'list' && <ProveedorList key={refreshKey} onEdit={handleEdit} />}
            
            {(view === 'create' || view === 'modify') && (
                <CreateProveedorForm 
                    onProveedorSaved={handleProveedorSaved} 
                    initialData={supplierToModify} 
                />
            )}
        </div>
    );
};

export default ProveedorAdminView;