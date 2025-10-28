// Archivo: src/features/Product/ProductManagementForm.jsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:3001/api';
const PRODUCT_API_URL = `${API_BASE_URL}/productos`;

const ProductManagementForm = ({ onProductSaved, initialData = null }) => {
    const isEditing = initialData !== null;
    
    // Estados para catálogos dinámicos
    const [listData, setListData] = useState({ categories: [], providers: [], taxes: [] });
    const [loading, setLoading] = useState(true);
    const [message, setMessage] = useState('');
    const [error, setError] = useState(null);

    // Estado del Formulario
    const [formData, setFormData] = useState({
        producto_codigo: initialData?.producto_codigo || '',
        nombre: initialData?.nombre || '',
        marca: initialData?.marca || '',
        descripcion: initialData?.descripcion || '',
        precio_venta: initialData?.precioVenta || 0, 
        precio_costo: initialData?.precioCosto || 0,
        unidad_medida: initialData?.unidadMedida || 'UNIDAD',
        stock_minimo: initialData?.stockMinimo || 5,
        categoria_id: initialData?.categoriaId || '',
        
        // --- CORRECCIÓN FINAL: CONVERSIÓN A NÚMERO ---
        // Forzamos la conversión a Number() para que el select preseleccione el valor correcto.
        tasa_impuesto_id: initialData?.tasaImpuestoId ? Number(initialData.tasaImpuestoId) : '', 
        
        estado: initialData?.estado || 'activo',
    });

    // --- LÓGICA DE CÁLCULO DE IVA ---
    const selectedTax = listData.taxes.find(t => t.id === formData.tasa_impuesto_id);
    const taxRate = selectedTax ? selectedTax.porcentaje / 100 : 0;
    
    const finalPrice = formData.precio_venta * (1 + taxRate);
    const ivaMonto = finalPrice - formData.precio_venta;


    // --- EFECTO para cargar TRES catálogos al inicio ---
    useEffect(() => {
        const fetchData = async () => {
            try {
                const [categoriesRes, providersRes, taxesRes] = await Promise.all([
                    axios.get(`${API_BASE_URL}/categorias`),
                    axios.get(`${API_BASE_URL}/proveedores`),
                    axios.get(`${API_BASE_URL}/impuestos/tasas`),
                ]);

                setListData({
                    categories: categoriesRes.data,
                    providers: providersRes.data,
                    taxes: taxesRes.data,
                });
                setLoading(false);

                // Establecer valores por defecto/iniciales si es un producto nuevo
                if (!isEditing) {
                    setFormData(prev => ({
                        ...prev,
                        categoria_id: categoriesRes.data[0]?.categoriaId || '',
                        tasa_impuesto_id: taxesRes.data[0]?.id || '',
                    }));
                }
            } catch (err) {
                console.error("Error al cargar catálogos:", err);
                setError('Error al cargar datos esenciales. Verifique que los controladores de catálogos funcionen.');
                setLoading(false);
            }
        };
        fetchData();
    }, [isEditing]); 

    const handleChange = (e) => {
        const { name, value } = e.target;
        // Conversión a float para los campos numéricos
        const parsedValue = ['precio_venta', 'precio_costo', 'stock_minimo', 'categoria_id', 'tasa_impuesto_id'].includes(name) ? parseFloat(value) : value;
        setFormData(prev => ({ ...prev, [name]: parsedValue }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');

        try {
            const endpoint = isEditing ? `${PRODUCT_API_URL}/${formData.producto_codigo}` : PRODUCT_API_URL;
            const method = isEditing ? 'put' : 'post';
            
            await axios({
                method: method,
                url: endpoint,
                data: formData
            });

            setMessage(`✅ Producto ${isEditing ? 'modificado' : 'creado'} con éxito.`);
            if (!isEditing) setFormData(prev => ({ ...prev, producto_codigo: '', nombre: '' }));
            
            onProductSaved(); 

        } catch (err) {
            console.error("Error al guardar producto:", err);
            setMessage(`❌ Error al guardar: ${err.response?.data?.error || err.message}`);
        }
    };
    
    if (loading) return <p className="text-info p-4 text-center">Cargando catálogos...</p>;
    if (error) return <p className="alert alert-danger p-4 text-center">{error}</p>;

    return (
        <div className="container-fluid my-4">
            <div className="card shadow-sm">
                <div className="card-header bg-primary text-white">
                    <h5 className="mb-0">Agregar / Editar Producto</h5>
                </div>
                <div className="card-body">
                    <form onSubmit={handleSubmit}>
                        <div className="row">
                            
                            {/* Columna Izquierda: General e Inventario */}
                            <div className="col-md-6">
                                <h6 className="text-info mb-3">Información General e Inventario</h6>
                                
                                <div className="mb-3">
                                    <label className="form-label">Cód. Producto:</label>
                                    <input type="text" className="form-control" name="producto_codigo" value={formData.producto_codigo} onChange={handleChange} required disabled={isEditing} />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Nombre / Descripción:</label>
                                    <input type="text" className="form-control" name="nombre" value={formData.nombre} onChange={handleChange} required />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Marca:</label>
                                    <input type="text" className="form-control" name="marca" value={formData.marca} onChange={handleChange} />
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Descripción (Detalle):</label>
                                    <textarea className="form-control" name="descripcion" value={formData.descripcion} onChange={handleChange} rows="2"></textarea>
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Unidad de Medida:</label>
                                    <input type="text" className="form-control" name="unidad_medida" value={formData.unidad_medida} onChange={handleChange} />
                                </div>
                                
                                {/* Stock Mínimo y Existencia (READ-ONLY) */}
                                <div className="row">
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label">Stock Mínimo:</label>
                                        <input type="number" className="form-control" name="stock_minimo" value={formData.stock_minimo} onChange={handleChange} />
                                    </div>
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label">Stock Actual:</label>
                                        <input type="number" className="form-control" value={initialData?.stockActual || 0} readOnly />
                                        <small className="form-text text-muted">Se ajusta en módulo de Compras/Ventas.</small>
                                    </div>
                                </div>
                                <div className="mb-3">
                                    <label className="form-label">Estado:</label>
                                    <select className="form-select" name="estado" value={formData.estado} onChange={handleChange}>
                                        <option value="activo">Activo</option>
                                        <option value="inactivo">Inactivo</option>
                                    </select>
                                </div>
                            </div>

                            {/* Columna Derecha: Catálogos, Costos y Precios */}
                            <div className="col-md-6">
                                <h6 className="text-info mb-3">Catálogos, Costos y Precios</h6>

                                {/* Rubro (Categoría) - DINÁMICO */}
                                <div className="mb-3">
                                    <label className="form-label">Rubro (Categoría):</label>
                                    <select className="form-select" name="categoria_id" value={formData.categoria_id} onChange={handleChange} required>
                                        <option value="">Seleccione Categoría</option>
                                        {listData.categories.map(cat => (
                                            <option key={cat.categoriaId} value={cat.categoriaId}>{cat.nombre}</option>
                                        ))}
                                    </select>
                                </div>
                                
                                {/* Tasa IVA - DINÁMICO */}
                                <div className="mb-3">
                                    <label className="form-label">Tasa de Impuesto (IVA):</label>
                                    <select className="form-select" name="tasa_impuesto_id" value={formData.tasa_impuesto_id} onChange={handleChange} required>
                                        <option value="">Seleccione Tasa</option>
                                        {listData.taxes.map(tasa => (
                                            <option key={tasa.id} value={tasa.id}>
                                                {tasa.nombre} ({tasa.porcentaje}%)
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Costos y PRECIO BASE (sin IVA) */}
                                <div className="row">
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label">Costo sin IVA (Q):</label>
                                        <input type="number" step="0.01" className="form-control" name="precio_costo" value={formData.precio_costo} onChange={handleChange} />
                                    </div>
                                    
                                    <div className="col-md-6 mb-3">
                                        <label className="form-label">Precio Base (sin IVA, Q):</label>
                                        <input type="number" step="0.01" className="form-control" name="precio_venta" value={formData.precio_venta} onChange={handleChange} required />
                                    </div>
                                </div>
                                
                                {/* BLOQUE DE CÁLCULO DE IVA */}
                                <h6 className="text-secondary mt-4 mb-3">Cálculo de Precios</h6>
                                <div className="row bg-light p-3 rounded">
                                    <div className="col-md-6">
                                        <label className="form-label small">IVA ({taxRate * 100}%):</label>
                                        <p className="fw-bold">Q{ivaMonto.toFixed(2)}</p>
                                    </div>
                                    <div className="col-md-6">
                                        <label className="form-label small">Precio Final al Cliente:</label>
                                        <p className="fw-bold text-success display-6" style={{fontSize: '1.5rem'}}>
                                            Q{finalPrice.toFixed(2)}
                                        </p>
                                    </div>
                                </div>
                                {/* FIN BLOQUE DE CÁLCULO */}

                                {/* Notas sobre Proveedor (Se gestiona en Compras) */}
                                <div className="mt-3">
                                    <p className="text-muted small">Nota: El proveedor se gestiona en el módulo de Compras.</p>
                                </div>
                            </div>
                        </div>

                        {/* Mensaje y Botones de Acción */}
                        {message && <p className={`alert ${message.startsWith('✅') ? 'alert-success' : 'alert-danger'} mt-3`}>{message}</p>}
                        
                        <div className="d-flex justify-content-end mt-4">
                            <button type="submit" className="btn btn-success me-3">
                                Guardar / {isEditing ? 'Modificar' : 'Crear'}
                            </button>
                            <button type="button" className="btn btn-danger" onClick={onProductSaved}>
                                Esc - Cancelar
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ProductManagementForm;