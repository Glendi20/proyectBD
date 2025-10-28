// Archivo: src/features/Compra/CompraAdminView.jsx

import React, { useState } from 'react';
// Importamos solo lo necesario para la cabecera
import CompraHeaderForm from './CompraHeaderForm'; 
// No importamos CompraList ni CompraRegistro

const CompraAdminView = ({ user }) => {
    // Estado de control para la Compra ID
    const [compraId, setCompraId] = useState(null); 
    
    // Función de callback llamada por el formulario al guardar la cabecera
    const handleHeaderCreated = (newCompraId) => {
        setCompraId(newCompraId);
        // Aquí NO CAMBIAMOS DE VISTA, solo notificamos el éxito
    };

    return (
        <div className="p-4">
            <h3 className="mb-4 text-center">Módulo de Compras (Gestión de Stock)</h3>
            
            {/* Si la cabecera ya se guardó, mostramos un mensaje de éxito y el ID */}
            {compraId ? (
                <div className="alert alert-success text-center">
                    Documento ID **{compraId}** creado con éxito. Continúe con el detalle.
                </div>
            ) : (
                // --- RENDERIZADO PRINCIPAL: SOLO EL FORMULARIO DE CABECERA ---
                <CompraHeaderForm 
                    onHeaderCreated={handleHeaderCreated} 
                    user={user} 
                />
            )}
            
            {/* NOTA: Los botones de navegación se eliminan para cumplir la instrucción de simplicidad. */}
        </div>
    );
};

export default CompraAdminView;