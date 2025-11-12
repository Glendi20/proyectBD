// Archivo: src/features/Ventas/VentaAdminView.jsx

import React, { useState } from 'react';
// Importamos los componentes esenciales
import VentaHeaderForm from './VentaHeaderForm'; 
import DocumentoAbiertoList from './DocumentoAbiertoList'; 
import VentaDetailForm from './VentaDetailForm'; 
import VentaList from './VentaList'; // <--- AÑADIDO: Componente de Historial de Ventas

const VentaAdminView = ({ user }) => {
    // Estado de control de flujo
    const [view, setView] = useState('new_header'); // Iniciamos mostrando el formulario de cabecera
    const [ventaId, setVentaId] = useState(null); 
    const [refreshKey, setRefreshKey] = useState(0); 

    // Callback llamado por VentaHeaderForm al guardar
    const handleHeaderCreated = (newVentaId) => {
        setVentaId(newVentaId);
        setView('detail'); // Pasar al detalle (Paso 2)
    };

    // Callback llamado por DocumentoAbiertoList al seleccionar un documento para editar
    const handleSelectDocument = (documento) => {
        setVentaId(documento.ventaId);
        setView('detail'); // Pasar a la vista de detalle
    };
    
    // Función de callback para completar el flujo de detalle
    const handleDetailCompleted = () => {
        setVentaId(null);
        setView('list_open'); // Volver a ver si hay más documentos abiertos
        setRefreshKey(prev => prev + 1); // Recarga la lista
    };

    const renderContent = () => {
        // PASO 1: CREAR CABECERA (La vista inicial)
        if (view === 'new_header') {
            return (
                <VentaHeaderForm 
                    onHeaderCreated={handleHeaderCreated} 
                    user={user} 
                />
            );
        }
        
        // PASO 2: LISTA DE DOCUMENTOS ABIERTOS / CONTINUAR EDICIÓN
        if (view === 'list_open') {
            return <DocumentoAbiertoList key={refreshKey} onSelectDocument={handleSelectDocument} />;
        }
        
        // PASO 3: AGREGAR DETALLES / EDITAR
        if (view === 'detail' && ventaId) {
            // Renderizamos el formulario de detalle
            return (
                <VentaDetailForm
                    ventaId={ventaId}
                    onDetailCompleted={handleDetailCompleted} 
                />
            );
        }
        
        // PASO 4: VER HISTORIAL (Nueva vista)
        if (view === 'list') {
            // VentaList mostrará las ventas con estado 'contado' o 'crédito'
            return <VentaList key={refreshKey} />; 
        }
        
        return null;
    };

    return (
        <div className="p-4">
            <h3 className="mb-4">Módulo de Ventas (CAJA)</h3>
            
            {/* BOTONES DE NAVEGACIÓN */}
            <div className="btn-group mb-4" role="group">
                <button 
                    className={`btn ${view === 'new_header' ? 'btn-danger' : 'btn-outline-danger'}`}
                    onClick={() => setView('new_header')}
                >
                    1. Crear Nuevo Documento
                </button>
                <button 
                    className={`btn ${view === 'list_open' ? 'btn-success' : 'btn-outline-success'}`}
                    onClick={() => setView('list_open')}
                >
                    2. Continuar Edición
                </button>
                <button 
                    className={`btn ${view === 'list' ? 'btn-primary' : 'btn-outline-primary'}`}
                    onClick={() => setView('list')}
                >
                    3. Ver Historial
                </button>
            </div>

            {/* --- Contenido Dinámico --- */}
            <div className="card shadow-sm p-3">
                {renderContent()}
            </div>
        </div>
    );
};

export default VentaAdminView;