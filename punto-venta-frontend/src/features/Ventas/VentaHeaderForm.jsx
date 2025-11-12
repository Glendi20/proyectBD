// Archivo: src/features/Ventas/VentaHeaderForm.jsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';

const API_URL = 'http://localhost:3001/api'; 
const CLIENTES_URL = `${API_URL}/clientes`; // Endpoint de clientes para validación
const HEADER_API_URL = `${API_URL}/ventas/header`; 

const VentaHeaderForm = ({ onHeaderCreated, user }) => {
    const [clientes, setClientes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [clienteIdInput, setClienteIdInput] = useState(''); // Campo de texto para ID/NIT
    const [validationError, setValidationError] = useState('');

    const [ventaData, setVentaData] = useState({
        cliente_id: null,
        tipo_pago: 'contado', 
        // CRÍTICO: Aseguramos que 'user.id' exista antes de asignarlo
        vendedor_id: user?.id || null, 
        tipo_factura: 'E-FACT', // Default
    });

    // --- Lógica de Carga Inicial de Clientes ---
    useEffect(() => {
        const fetchClientes = async () => {
            try {
                const res = await axios.get(CLIENTES_URL);
                setClientes(res.data); // Carga la lista completa para validación
            } catch (err) {
                Swal.fire('Error de Carga', 'No se pudieron cargar los clientes para la validación.', 'error');
            } finally {
                setLoading(false);
            }
        };
        fetchClientes();
    }, []);

    const handleChange = (e) => {
        setVentaData({ ...ventaData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // 1. VALIDACIÓN CRÍTICA: Buscar si el ID/NIT tecleado existe en la lista de clientes cargada
        // NOTA: Convertimos a string porque los IDs pueden venir como strings de la DB.
        const clienteEncontrado = clientes.find(c => String(c.id) === String(clienteIdInput));

        if (!clienteIdInput || !clienteEncontrado) {
             setValidationError('Debe ingresar un ID/NIT de cliente válido y existente.');
             return;
        }

        try {
            const payload = {
                ...ventaData,
                cliente_id: clienteEncontrado.id, // Usamos el ID validado
            };

            const res = await axios.post(HEADER_API_URL, payload);

            onHeaderCreated(res.data.venta_id); // Devuelve el ID generado
            Swal.fire('Éxito', `Cabecera registrada. ID: ${res.data.venta_id}.`, 'success');

        } catch (error) {
            Swal.fire('Error', `Fallo al crear Cabecera: ${error.response?.data?.error || 'Error de red.'}`, 'error');
        }
    };

    if (loading) return <div className="text-center py-4">Cargando clientes para validación...</div>;

    return (
        <form onSubmit={handleSubmit} className="p-4 border rounded-md shadow bg-white">
            <h4 className="mb-4 text-primary">1. Crear Documento de Venta (Cabecera)</h4>
            
            <div className="row">
                {/* Campo ID/NIT del Cliente (Entrada Manual) */}
                <div className="col-md-6 mb-3">
                    <label className="form-label">ID/NIT del Cliente</label>
                    <input type="text" value={clienteIdInput} onChange={(e) => { setClienteIdInput(e.target.value); setValidationError(''); }} className="form-control" required placeholder="Ingrese ID del cliente" />
                    {validationError && <div className="text-danger small mt-1">{validationError}</div>}
                </div>
                
                {/* Campo Vendedor y Fecha (Solo Lectura) */}
                <div className="col-md-6 mb-3">
                    <label className="form-label">Vendedor / Fecha</label>
                    <input type="text" value={`${user?.nombre || 'Admin'} (${new Date().toLocaleDateString('es-ES')})`} className="form-control" readOnly />
                </div>
            </div>
            
            <div className="row">
                {/* Tipo de Pago */}
                <div className="col-md-6 mb-3">
                    <label className="form-label">Tipo de Pago</label>
                    <select name="tipo_pago" value={ventaData.tipo_pago} className="form-select" onChange={handleChange}>
                        <option value="contado">Contado</option>
                        <option value="crédito">Crédito</option>
                    </select>
                </div>
                
                {/* Estado Inicial (ABIERTA) */}
                <div className="col-md-6 mb-3">
                    <label className="form-label">Estado Inicial</label>
                    <input type="text" value="ABIERTA" className="form-control bg-warning-subtle" readOnly />
                </div>
            </div>


            <div className="mt-4 text-center">
                <button type="submit" className="btn btn-primary btn-lg">
                    GUARDAR VENTA Y CONTINUAR (Paso 1/3)
                </button>
            </div>
        </form>
    );
};

export default VentaHeaderForm;