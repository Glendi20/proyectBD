// Archivo: src/features/Role/RoleAdminView.jsx

import React, { useState } from 'react';
import RoleList from './RoleList';
import CreateRoleForm from './CreateRoleForm';

const RoleAdminView = () => {
    const [view, setView] = useState('list'); // 'list', 'create', 'modify'
    const [roleToModify, setRoleToModify] = useState(null); 
    const [refreshKey, setRefreshKey] = useState(0); 

    const handleEdit = (role) => {
        setRoleToModify(role);
        setView('modify');
    };

    const handleRoleSaved = () => {
        setRoleToModify(null);
        setRefreshKey(prev => prev + 1); // Forzar re-render de la lista
        setView('list');
    };

    const handleCreateClick = () => {
        setRoleToModify(null);
        setView('create');
    };

    return (
        <div className="p-4">
            <h3>Administración de Roles de Usuario</h3>
            <div className="btn-group mb-4" role="group">
                <button 
                    className={`btn ${view === 'list' ? 'btn-secondary' : 'btn-outline-secondary'}`}
                    onClick={() => handleRoleSaved()}
                >
                    Lista de Roles
                </button>
                <button 
                    className={`btn ${view === 'create' ? 'btn-secondary' : 'btn-outline-secondary'}`}
                    onClick={handleCreateClick}
                >
                    Crear Rol
                </button>
                {view === 'modify' && (
                    <button className="btn btn-warning">Modificando: {roleToModify?.nombreRol}</button>
                )}
            </div>

            {/* Renderizado Condicional del Contenido */}
            {view === 'list' && <RoleList key={refreshKey} onEdit={handleEdit} />}
            
            {(view === 'create' || view === 'modify') && (
                <CreateRoleForm 
                    onRoleSaved={handleRoleSaved} 
                    initialData={roleToModify} 
                />
            )}
        </div>
    );
};

export default RoleAdminView;