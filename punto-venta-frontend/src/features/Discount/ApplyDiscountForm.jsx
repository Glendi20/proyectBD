// Archivo: src/features/Discount/ApplyDiscountForm.jsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';

const ApplyDiscountForm = ({ onRuleApplied }) => {
    
    // Estado para todas las listas que necesita el formulario
    const [catalogs, setCatalogs] = useState({ discounts: [], categories: [], products: [] });
    
    // Estado de carga y error
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Estado del formulario (para la lógica de aplicación)
    const [formData, setFormData] = useState({
        discountId: '',
        applicationType: 'product', 
        productId: '',
        categoryId: '', 
        endDate: '',
    });
    const [message, setMessage] = useState('');


    // --- FUNCIÓN CRÍTICA DE CARGA DE DATOS (useEffect) ---
    useEffect(() => {
        const fetchData = async () => {
            try {
                // Ejecuta las tres llamadas en paralelo
                const [discountRes, categoryRes, productRes] = await Promise.all([
                    axios.get(`${API_BASE_URL}/descuentos/catalogo`),
                    axios.get(`${API_BASE_URL}/categorias`),
                    axios.get(`${API_BASE_URL}/productos`),
                ]);

                const fetchedData = {
                    discounts: discountRes.data,
                    categories: categoryRes.data,
                    products: productRes.data,
                };
                
                setCatalogs(fetchedData);
                setLoading(false); // Salir del estado de carga si las 3 llamadas fueron exitosas

                // Establece el primer descuento como valor por defecto
                if (fetchedData.discounts.length > 0) {
                    setFormData(prev => ({ ...prev, discountId: fetchedData.discounts[0].id }));
                }

            } catch (err) {
                console.error("Error al cargar los catálogos:", err);
                setError('No se pudieron cargar los datos esenciales del catálogo. Revisa la consola del navegador.');
                setLoading(false); 
            }
        };

        fetchData();
    }, []); 
    

    // --- LÓGICA DE MANEJO DE ESTADO ---
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        
        if (name === 'applicationType') {
            // Limpiar campos específicos al cambiar el tipo de aplicación
            setFormData(prev => ({ ...prev, productId: '', categoryId: '' }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');

        // 1. Validaciones de existencia (simplificadas)
        if (!formData.discountId) { return setMessage("❌ Debe seleccionar una tasa de descuento."); }
        if (formData.applicationType === 'product' && !formData.productId) { return setMessage("❌ Debe seleccionar un producto."); }
        if (formData.applicationType === 'category' && !formData.categoryId) { return setMessage("❌ Debe seleccionar una categoría."); }


        // 2. CONSTRUCCIÓN INTELIGENTE DEL PAYLOAD (SOLUCIÓN ORA-02290)
        // Convierte a INT o asigna NULL para el backend
        const categoryIdToSend = (formData.applicationType === 'category' && formData.categoryId) 
            ? parseInt(formData.categoryId) 
            : null;
        
        const productIdToSend = formData.applicationType === 'product' ? formData.productId : null;

        const payload = {
            descuento_id: parseInt(formData.discountId),
            tipo_aplicacion: formData.applicationType.toUpperCase(), 
            
            // Enviamos solo un ID, el otro es NULL para cumplir la restricción CHECK
            categoria_id: categoryIdToSend, 
            producto_codigo: productIdToSend, 
            
            fecha_fin: formData.endDate || null,
        };
        // -------------------------------------------------------------

        // 3. Llamada API
        try {
            await axios.post(`${API_BASE_URL}/descuentos/aplicar`, payload);
            setMessage("✅ Regla de descuento aplicada con éxito.");
            // Llama a la función de callback para actualizar la lista de reglas aplicadas
            onRuleApplied(); 
        } catch (err) {
             setMessage(`❌ Error al aplicar regla: ${err.response?.data?.error || err.message}`);
        }
    };
    
    // --- Renderizado Condicional ---
    if (loading) return <p className="text-info p-4 text-center">Cargando catálogos de productos y tasas...</p>;
    if (error) return <div className="alert alert-danger p-4 text-center">{error}</div>;

    // --- RENDERIZADO FINAL (JSX) ---
    return (
        <form onSubmit={handleSubmit}>
            <h5 className="mb-4">Paso 1: Definir Regla y Tipo de Aplicación</h5>

            {/* Selector de Tasa de Descuento */}
            <div className="mb-3">
                <label className="form-label">Tasa de Descuento (%):</label>
                <select className="form-select" name="discountId" value={formData.discountId} onChange={handleChange} required>
                    <option value="">Seleccione Tasa</option>
                    {catalogs.discounts.map(d => (
                        <option key={d.id} value={d.id}>
                            {d.nombre} ({d.porcentaje}%)
                        </option>
                    ))}
                </select>
            </div>
            
            {/* Tipo de Aplicación (Individual o Lote) */}
            <div className="mb-3">
                <label className="form-label">Aplicar Regla a:</label>
                <select className="form-select" name="applicationType" value={formData.applicationType} onChange={handleChange} required>
                    <option value="product">Producto Individual</option>
                    <option value="category">Lote / Categoría</option>
                    <option value="global">Global (Toda la Tienda)</option>
                </select>
            </div>

            <h5 className="mt-4 mb-4">Paso 2: Especificar el Objetivo</h5>

            {/* Campo Condicional: Producto */}
            {formData.applicationType === 'product' && (
                <div className="mb-3">
                    <label className="form-label">Seleccionar Producto:</label>
                    <select className="form-select" name="productId" value={formData.productId} onChange={handleChange} required>
                        <option value="">Seleccione un producto</option>
                        {catalogs.products.map(p => (
                            <option key={p.producto_codigo} value={p.producto_codigo}>
                                {p.nombre} ({p.producto_codigo})
                            </option>
                        ))}
                    </select>
                </div>
            )}

            {/* Campo Condicional: Categoría */}
            {formData.applicationType === 'category' && (
                <div className="mb-3">
                    <label className="form-label">Seleccionar Categoría (Lote):</label>
                    <select className="form-select" name="categoryId" value={formData.categoryId} onChange={handleChange} required>
                        <option value="">Seleccione una categoría</option>
                        {catalogs.categories.map(c => (
                            <option key={c.categoriaId} value={c.categoriaId}>
                                {c.nombre}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            {/* Fecha de Finalización (Opcional) */}
             <div className="mb-4">
                <label className="form-label">Fecha de Finalización (Opcional):</label>
                <input type="date" className="form-control" name="endDate" value={formData.endDate} onChange={handleChange} />
            </div>

            {message && <p className={`alert ${message.startsWith('✅') ? 'alert-success' : 'alert-danger'}`}>{message}</p>}

            <button type="submit" className="btn btn-success">
                Aplicar Regla de Descuento
            </button>
        </form>
    );
};

export default ApplyDiscountForm;