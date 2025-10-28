// Archivo: src/features/Compra/CompraHeaderForm.jsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';

const API_URL = 'http://localhost:3001/api'; 
const PROVEEDORES_URL = `${API_URL}/proveedores`;
const HEADER_API_URL = `${API_URL}/compras/header`; 

const CompraHeaderForm = ({ onHeaderCreated }) => {
    const [proveedores, setProveedores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [compraData, setCompraData] = useState({
        proveedor_id: '',
        numero_documento: '',
        tipo_pago: 'contado', 
        total_neto: 0,
        impuestos_total: 0,
        total_bruto: 0,
        fecha_compra: new Date().toISOString().split('T')[0], // Formato YYYY-MM-DD
    });

    // --- Lógica de Carga de Proveedores ---
    useEffect(() => {
        const fetchProveedores = async () => {
            try {
                const res = await axios.get(PROVEEDORES_URL);
                setProveedores(res.data);
                setLoading(false);
                if (res.data.length > 0) {
                     setCompraData(prev => ({ ...prev, proveedor_id: res.data[0].id }));
                }
            } catch (err) {
                setError('No se pudieron cargar los proveedores. Revise el backend.');
                Swal.fire('Error de Carga', 'No se pudieron cargar los proveedores.', 'error');
                setLoading(false);
            }
        };
        fetchProveedores();
    }, []);

    const handleChange = (e) => {
        setCompraData({ ...compraData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!compraData.proveedor_id || !compraData.numero_documento) {
             Swal.fire('Atención', 'Complete el Proveedor y el Número de Documento.', 'warning');
             return;
        }
        
        // El backend espera el payload del header
        try {
            const res = await axios.post(HEADER_API_URL, compraData);

            // Llama al callback del padre con el ID de la nueva compra
            onHeaderCreated(res.data.compra_id);
            Swal.fire('Éxito', `Documento ID ${res.data.compra_id} creado.`, 'success');

        } catch (error) {
            Swal.fire('Error', `Fallo al crear Cabecera: ${error.response?.data?.error || 'Error de red.'}`, 'error');
        }
    };

    if (loading) return <div className="text-center py-4">Cargando proveedores...</div>;
    if (error) return <div className="alert alert-danger text-center">{error}</div>;

    return (
        <form onSubmit={handleSubmit} className="p-4 border rounded-md shadow bg-white">
            <h4 className="mb-4 text-primary">1. Crear Documento de Compra (Cabecera)</h4>
            
            <div className="row">
                {/* Proveedor */}
                <div className="col-md-6 mb-3">
                    <label className="form-label">Proveedor</label>
                    <select name="proveedor_id" value={compraData.proveedor_id} className="form-select" onChange={handleChange} required>
                        <option value="">Seleccione Proveedor</option>
                        {proveedores.map(p => (<option key={p.id} value={p.id}>{p.razonSocial} (ID: {p.id})</option>))}
                    </select>
                </div>

                {/* N° Documento */}
                <div className="col-md-6 mb-3">
                    <label className="form-label">N° Documento</label>
                    <input type="text" name="numero_documento" value={compraData.numero_documento} onChange={handleChange} className="form-control" required />
                </div>
            </div>
            
            <div className="row">
                {/* Fecha de Compra */}
                <div className="col-md-4 mb-3">
                    <label className="form-label">Fecha de Compra</label>
                    <input type="date" name="fecha_compra" value={compraData.fecha_compra} onChange={handleChange} className="form-control" required />
                </div>

                {/* Tipo de Pago */}
                <div className="col-md-4 mb-3">
                    <label className="form-label">Tipo de Pago</label>
                    <select name="tipo_pago" value={compraData.tipo_pago} className="form-select" onChange={handleChange}>
                        <option value="contado">Contado</option>
                        <option value="crédito">Crédito</option>
                    </select>
                </div>
                
                {/* Estado Inicial (ABIERTA) */}
                <div className="col-md-4 mb-3">
                    <label className="form-label">Estado Inicial</label>
                    <input type="text" value="ABIERTA" className="form-control bg-warning-subtle" readOnly />
                </div>
            </div>

            {/* CAMPOS OCULTOS PARA ENVIAR TOTALES CERO INICIALMENTE */}
            <input type="hidden" name="total_neto" value={compraData.total_neto} />
            <input type="hidden" name="impuestos_total" value={compraData.impuestos_total} />
            <input type="hidden" name="total_bruto" value={compraData.total_bruto} />
            
            <div className="mt-4 text-center">
                <button type="submit" className="btn btn-primary btn-lg">
                    GUARDAR DOCUMENTO (Paso 1/3)
                </button>
            </div>
        </form>
    );
};

export default CompraHeaderForm;