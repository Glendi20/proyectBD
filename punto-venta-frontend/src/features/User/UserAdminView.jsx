// Archivo: src/features/User/UserAdminView.jsx

import React, { useState } from 'react';
import UserList from './UserList';
import CreateUserForm from './CreateUserForm';

const UserAdminView = () => {
    const [view, setView] = useState('list');
    const [userToModify, setUserToModify] = useState(null); 
    const [refreshKey, setRefreshKey] = useState(0); 

    const handleEdit = (user) => {
        setUserToModify(user);
        setView('modify');
    };

    const handleUserSaved = () => {
        setUserToModify(null);
        setRefreshKey(prev => prev + 1); 
        setView('list');
    };

    const handleCreateClick = () => {
        setUserToModify(null);
        setView('create');
    };

    return (
        <div className="p-4">
            <h3>Administración de Empleados</h3>
            <div className="btn-group mb-4" role="group">
                <button 
                    className={`btn ${view === 'list' ? 'btn-secondary' : 'btn-outline-secondary'}`}
                    onClick={() => handleUserSaved()}
                >
                    Lista de Empleados
                </button>
                <button 
                    className={`btn ${view === 'create' ? 'btn-secondary' : 'btn-outline-secondary'}`}
                    onClick={handleCreateClick}
                >
                    Crear Empleado
                </button>
                {view === 'modify' && (
                    <button className="btn btn-warning">Modificando: {userToModify?.nombre} {userToModify?.apellidos}</button>
                )}
            </div>

            {/* Renderizado Condicional del Contenido */}
            {view === 'list' && <UserList key={refreshKey} onEdit={handleEdit} />}
            
            {(view === 'create' || view === 'modify') && (
                <CreateUserForm 
                    onUserSaved={handleUserSaved} 
                    initialData={userToModify} 
                />
            )}
        </div>
    );
};

export default UserAdminView;