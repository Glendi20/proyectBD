// Archivo: src/features/Ventas/DocumentoAbiertoList.jsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';

// URLs de API
const API_URL = 'http://localhost:3001/api/ventas/abiertas'; 
const STATUS_API_URL = 'http://localhost:3001/api/ventas/status'; 
const CHECKOUT_API_URL = 'http://localhost:3001/api/ventas/checkout'; 


const DocumentoAbiertoList = ({ onSelectDocument }) => {
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchDocuments = async () => {
        try {
            const response = await axios.get(API_URL);
            setDocuments(response.data.openDocuments || []); 
        } catch (err) {
            Swal.fire('Error', 'No se pudo cargar la lista de documentos de venta abiertos.', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDocuments();
    }, []);
    
    // --- FUNCIÓN PARA CANCELAR LA VENTA ---
    const handleCerrarVenta = async (ventaId) => {
        if (!window.confirm(`¿Está seguro de CANCELAR la venta ID ${ventaId}? Esta acción es irreversible.`)) {
            return;
        }

        try {
            await axios.put(`${STATUS_API_URL}/${ventaId}`, {
                nuevo_estado: 'CANCELADA' 
            });

            Swal.fire('Venta Cancelada', `La venta ID ${ventaId} ha sido cancelada.`, 'success');
            fetchDocuments(); 

        } catch (err) {
            Swal.fire('Error', `Fallo al cancelar venta: ${err.response?.data?.error || 'Error de red.'}`, 'error');
        }
    };

    // --- FUNCIÓN PRINCIPAL DE PAGO (CORREGIDA) ---
    const handlePagarVenta = async (doc) => {
        const { ventaId, totalBruto, clienteNombre } = doc;
        
        // 1. Preguntar si es Contado o Crédito
        const { value: tipoPago } = await Swal.fire({
            title: `Confirmar Pago para ${clienteNombre}`,
            text: `Total: Q${totalBruto.toFixed(2)}`,
            input: 'radio',
            inputOptions: {
                Contado: 'Pagar Contado (Efectivo)',
                // CRÍTICO: La clave es 'Crédito' (con acento) para coincidir con el Backend/DB
                'Crédito': 'Pagar a Crédito' 
            },
            inputValue: 'Contado', 
            showCancelButton: true,
            confirmButtonText: 'Seleccionar'
        });

        if (!tipoPago) return;
        
        let montoRecibido = 0;
        
        // 2. Si es Contado, pedimos el monto
        if (tipoPago === 'Contado') {
            const { value: recibido } = await Swal.fire({
                title: 'Pago en Efectivo',
                html: `Total a pagar: **Q${totalBruto.toFixed(2)}**<br><br>Ingrese el efectivo recibido:`,
                input: 'number',
                inputValue: totalBruto.toFixed(2),
                showCancelButton: true,
                confirmButtonText: 'Procesar',
                inputValidator: (value) => {
                    if (!value || parseFloat(value) < totalBruto) {
                        return 'El monto recibido debe ser igual o mayor al total.';
                    }
                }
            });
            if (!recibido) return;
            montoRecibido = parseFloat(recibido);
        }

        // 3. LLAMADA AL NUEVO ENDPOINT DE CHECKOUT
        try {
            const payload = {
                tipo_pago: tipoPago, // Será 'Contado' o 'Crédito'
                monto_recibido: montoRecibido 
            };
            
            const response = await axios.put(`${CHECKOUT_API_URL}/${ventaId}`, payload);
            
            const { mensaje, vuelto } = response.data; 

            // 4. MUESTRA DE RESULTADOS
            if (vuelto > 0) {
                 Swal.fire('Venta Finalizada', `${mensaje}. Vuelto: **Q${vuelto.toFixed(2)}**.`, 'success');
            } else {
                 Swal.fire('Venta Finalizada', `${mensaje}`, 'success');
            }
            
            // La venta se cerró correctamente, ahora actualizamos la lista
            fetchDocuments();

        } catch (error) {
            Swal.fire({
                title: 'Error de Pago',
                text: error.response?.data?.error || 'Fallo al procesar el pago o validar límites.',
                icon: 'error'
            });
        }
    };


    if (loading) return <div className="text-center py-4">Cargando documentos pendientes...</div>;

    return (
        <div className="mt-4">
            <h4 className="text-success">2. Ventas Pendientes (Estado: ABIERTA)</h4>
            {documents.length === 0 ? (
                <div className="alert alert-info">No hay ventas pendientes de finalizar. Inicie una nueva venta.</div>
            ) : (
                <table className="table table-striped table-hover table-sm">
                    <thead className="table-dark">
                        <tr>
                            <th>ID Venta</th>
                            <th>Fecha</th>
                            <th>Cliente</th>
                            <th>Total Bruto</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {documents.map(doc => (
                            <tr key={doc.ventaId}>
                                <td>{doc.ventaId}</td>
                                <td>{new Date(doc.fechaVenta).toLocaleDateString()}</td>
                                <td>{doc.clienteNombre}</td>
                                <td className="text-end">Q{doc.totalBruto.toFixed(2)}</td>
                                <td>
                                    {/* Botón Seguir Venta */}
                                    <button 
                                        className="btn btn-sm btn-info me-2" 
                                        onClick={() => onSelectDocument(doc)}
                                    >
                                        Seguir Venta
                                    </button>
                                    
                                    {/* Botón Pagar (Llama al flujo de checkout) */}
                                    <button 
                                        className="btn btn-sm btn-primary me-2" 
                                        onClick={() => handlePagarVenta(doc)}
                                    >
                                        **Pagar**
                                    </button>

                                    {/* Botón Cancelar Venta */}
                                    <button 
                                        className="btn btn-sm btn-danger" 
                                        onClick={() => handleCerrarVenta(doc.ventaId)}
                                    >
                                        Cancelar Venta
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default DocumentoAbiertoList;