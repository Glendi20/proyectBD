// Archivo: src/features/Product/ProductAdminView.jsx

import React, { useState } from 'react';
import ProductList from './ProductList'; // <-- Importa la lista
import ProductManagementForm from './ProductManagementForm'; // <-- Importa el formulario

const ProductAdminView = () => {
    // Estados para controlar la vista y los datos
    const [view, setView] = useState('list'); // 'list', 'create', 'modify'
    const [productToModify, setProductToModify] = useState(null); 
    const [refreshKey, setRefreshKey] = useState(0); // Para forzar la actualización de la lista

    // Maneja el clic en "Modificar" de la lista
    const handleEdit = (product) => {
        setProductToModify(product);
        setView('modify');
    };

    // Maneja la acción después de que se guarda un producto (POST o PUT)
    const handleProductSaved = () => {
        setProductToModify(null);
        setRefreshKey(prev => prev + 1); // Forzar re-render de la lista
        setView('list'); // Vuelve a la lista
    };

    // Maneja el clic en "Crear Producto"
    const handleCreateClick = () => {
        setProductToModify(null); // Asegura que el formulario esté vacío
        setView('create');
    };

    return (
        <div className="p-4">
            <h3>Administración de Productos</h3>
            
            {/* --- Botones de Navegación --- */}
            <div className="btn-group mb-4" role="group">
                <button 
                    className={`btn ${view === 'list' ? 'btn-secondary' : 'btn-outline-secondary'}`}
                    onClick={() => handleProductSaved()} // Vuelve a la lista y refresca
                >
                    Lista de Productos
                </button>
                <button 
                    className={`btn ${view === 'create' ? 'btn-secondary' : 'btn-outline-secondary'}`}
                    onClick={handleCreateClick}
                >
                    Crear Producto
                </button>
                {view === 'modify' && (
                    <button className="btn btn-warning">Modificando: {productToModify?.nombre}</button>
                )}
            </div>

            {/* --- Renderizado Condicional del Contenido --- */}
            {view === 'list' && (
                <ProductList 
                    key={refreshKey} 
                    onEdit={handleEdit} 
                />
            )}
            
            {(view === 'create' || view === 'modify') && (
                <ProductManagementForm 
                    onProductSaved={handleProductSaved} 
                    initialData={productToModify} 
                />
            )}
        </div>
    );
};

export default ProductAdminView;