// Archivo: punto-venta-frontend/src/features/Discount/DiscountAdminView.jsx

import React, { useState } from 'react';
// Importamos todos los componentes necesarios
import ReglasAplicadasList from './ReglasAplicadasList'; // Lista de reglas activas (GET /aplicadas)
import DiscountCatalogManager from './DiscountCatalogManager'; // CRUD de las tasas (%)
import ApplyDiscountForm from './ApplyDiscountForm'; // Formulario para aplicar la regla

const DiscountAdminView = () => {
    // Estado para controlar la vista actual: 'list', 'catalog', 'apply'
    const [view, setView] = useState('list'); 
    const [refreshKey, setRefreshKey] = useState(0); // Para forzar la recarga de la lista

    // Función de callback para forzar la recarga de la lista de reglas
    const handleActionCompleted = () => {
        setRefreshKey(prev => prev + 1);
        setView('list'); // Regresa a la lista después de crear/aplicar
    };

    // Función para renderizar el contenido central según el estado 'view'
    const renderContent = () => {
        switch (view) {
            case 'catalog':
                // Interfaz para gestionar las tasas de descuento (CRUD de CATALOGO_DESCUENTOS)
                return <DiscountCatalogManager />;
            
            case 'apply':
                // Interfaz para ASIGNAR la regla a un producto/categoría (POST /aplicar)
                return <ApplyDiscountForm onRuleApplied={handleActionCompleted} />;
            
            case 'list':
            default:
                // Interfaz para listar las reglas aplicadas (Tabla DESCUENTOS_APLICADOS)
                return <ReglasAplicadasList key={refreshKey} />; 
        }
    };

    return (
        <div className="p-4">
            <h3>Administración de Descuentos</h3>
            
            {/* --- Botones de Navegación --- */}
            <div className="btn-group mb-4" role="group">
                <button 
                    className={`btn ${view === 'list' ? 'btn-primary' : 'btn-outline-primary'}`}
                    onClick={() => setView('list')}
                >
                    Reglas Aplicadas (Lista)
                </button>
                <button 
                    className={`btn ${view === 'apply' ? 'btn-primary' : 'btn-outline-primary'}`}
                    onClick={() => setView('apply')}
                >
                    Aplicar Descuento (Individual/Lote)
                </button>
                <button 
                    className={`btn ${view === 'catalog' ? 'btn-primary' : 'btn-outline-primary'}`}
                    onClick={() => setView('catalog')}
                >
                    Catálogo de Tasas (%)
                </button>
            </div>

            {/* --- Contenido Dinámico --- */}
            <div className="card shadow-sm p-4">
                {renderContent()}
            </div>
        </div>
    );
};

export default DiscountAdminView;