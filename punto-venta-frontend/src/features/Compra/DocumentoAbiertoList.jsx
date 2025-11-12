// Archivo: src/features/Compra/DocumentoAbiertoList.jsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Swal from 'sweetalert2';

const API_URL = 'http://localhost:3001/api/compras/abiertas';
const STATUS_API_URL = 'http://localhost:3001/api/compras/status'; // Nuevo endpoint para PUT Status

const DocumentoAbiertoList = ({ onSelectDocument }) => {
    const [documents, setDocuments] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchDocuments = async () => {
        // ... (código para cargar documentos se mantiene) ...
        try {
            const response = await axios.get(API_URL);
            setDocuments(response.data.openDocuments || []); 
        } catch (err) {
            Swal.fire('Error', 'No se pudo cargar la lista de documentos abiertos.', 'error');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDocuments();
    }, []);
    
    // --- FUNCIÓN PARA CERRAR LA FACTURA ---
    const handleCerrarFactura = async (compraId) => {
        if (!window.confirm(`¿Está seguro de cerrar la factura ID ${compraId}? Ya no podrá añadir productos.`)) {
            return;
        }

        try {
            // Llama al PUT /api/compras/status/:compraId
            await axios.put(`${STATUS_API_URL}/${compraId}`, {
                nuevo_estado: 'CERRADA' // Valor que queremos asignar en la DB
            });

            Swal.fire('Factura Cerrada', `La compra ID ${compraId} ha sido cerrada.`, 'success');
            
            // Recargar la lista para que el documento cerrado desaparezca
            fetchDocuments(); 

        } catch (err) {
            Swal.fire('Error', `Fallo al cerrar factura: ${err.response?.data?.error || 'Error de red.'}`, 'error');
        }
    };


    if (loading) return <div className="text-center py-4">Cargando documentos...</div>;

    return (
        <div className="mt-4">
            <h4>Documentos de Compra en Edición (Estado: ABIERTA)</h4>
            {documents.length === 0 ? (
                <div className="alert alert-info">No hay documentos de compra pendientes de finalizar.</div>
            ) : (
                <table className="table table-striped table-hover table-sm">
                    <thead className="table-dark">
                        <tr>
                            <th>ID Compra</th>
                            <th>Documento No.</th>
                            <th>Proveedor</th>
                            <th>Acciones</th> {/* <-- Se combinan las acciones */}
                        </tr>
                    </thead>
                    <tbody>
                        {documents.map(doc => (
                            <tr key={doc.compraId}>
                                <td>{doc.compraId}</td>
                                <td>{doc.numeroDocumento}</td>
                                <td>{doc.proveedorNombre}</td>
                                <td>
                                    <button 
                                        className="btn btn-sm btn-success me-2" 
                                        onClick={() => onSelectDocument(doc)}
                                    >
                                        Continuar Edición
                                    </button>
                                    <button 
                                        className="btn btn-sm btn-danger" 
                                        onClick={() => handleCerrarFactura(doc.compraId)}
                                    >
                                        Cerrar Factura
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