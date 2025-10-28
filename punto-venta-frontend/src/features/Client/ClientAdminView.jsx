// Archivo: src/features/Client/ClientAdminView.jsx

import React, { useState } from 'react';
import ClientList from './ClientList';
import CreateClientForm from './CreateClientForm';

const ClientAdminView = () => {
    const [view, setView] = useState('list'); // 'list', 'create', 'modify'
    const [clientToModify, setClientToModify] = useState(null); 
    const [refreshKey, setRefreshKey] = useState(0); 

    const handleEdit = (client) => {
        setClientToModify(client);
        setView('modify');
    };

    const handleClientSaved = () => {
        setClientToModify(null);
        setRefreshKey(prev => prev + 1); // Forzar re-render de la lista
        setView('list');
    };

    const handleCreateClick = () => {
        setClientToModify(null);
        setView('create');
    };

    return (
        <div className="p-4">
            <h3>Administración de Clientes</h3>
            <div className="btn-group mb-4" role="group">
                <button 
                    className={`btn ${view === 'list' ? 'btn-secondary' : 'btn-outline-secondary'}`}
                    onClick={() => handleClientSaved()}
                >
                    Lista de Clientes
                </button>
                <button 
                    className={`btn ${view === 'create' ? 'btn-secondary' : 'btn-outline-secondary'}`}
                    onClick={handleCreateClick}
                >
                    Crear Cliente
                </button>
                {view === 'modify' && (
                    <button className="btn btn-warning">Modificando: {clientToModify?.nombre} {clientToModify?.apellidos}</button>
                )}
            </div>

            {/* Renderizado Condicional del Contenido */}
            {view === 'list' && <ClientList key={refreshKey} onEdit={handleEdit} />}
            
            {(view === 'create' || view === 'modify') && (
                <CreateClientForm 
                    onClientSaved={handleClientSaved} 
                    initialData={clientToModify} 
                />
            )}
        </div>
    );
};

export default ClientAdminView;