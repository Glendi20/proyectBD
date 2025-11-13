// Archivo: src/features/Report/ReportAdminView.jsx (Fragmento a actualizar)

import React, { useState } from 'react';
import MejoresClientesReporte from './MejoresClientesReporte'; 
import TopProductosReporte from './TopProductosReporte'; 
import StockBajoReporte from './StockBajoReporte'; 
import CreditosPorVencerReporte from './CreditosPorVencerReporte';
import VentasPorCobrarReporte from './VentasPorCobrarReporte'; // <--- NUEVA IMPORTACIÓN

const ReportAdminView = ({ user }) => {
    const [activeReport, setActiveReport] = useState(null); 

    const renderReportContent = () => {
        if (activeReport === 'mejores_clientes') {
            return <MejoresClientesReporte />;
        }
        if (activeReport === 'top_productos') { 
            return <TopProductosReporte />;
        }
        if (activeReport === 'stock_bajo') { 
            return <StockBajoReporte />;
        }
        if (activeReport === 'creditos_vencer') { 
            return <CreditosPorVencerReporte />;
        }
        if (activeReport === 'ventas_por_cobrar') { // <--- NUEVA CONDICIÓN
            return <VentasPorCobrarReporte />;
        }
        
        return (
            <div className="alert alert-info mt-3">
                Seleccione un reporte del menú para comenzar el análisis.
            </div>
        );
    };

    return (
        <div className="p-4">
            <h3 className="mb-4 text-info">📊 Módulo de Reportes y Análisis</h3>
            
            <div className="btn-group mb-4" role="group">
                <button 
                    className={`btn ${activeReport === 'mejores_clientes' ? 'btn-success' : 'btn-outline-success'}`}
                    onClick={() => setActiveReport('mejores_clientes')}
                >
                    Mejores Clientes (Top 50)
                </button>
                
                <button 
                    className={`btn ${activeReport === 'top_productos' ? 'btn-success' : 'btn-outline-success'}`}
                    onClick={() => setActiveReport('top_productos')}
                >
                    Top 50 Productos Vendidos
                </button>

                <button 
                    className={`btn ${activeReport === 'stock_bajo' ? 'btn-danger' : 'btn-outline-danger'}`}
                    onClick={() => setActiveReport('stock_bajo')}
                >
                    ⚠️ Stock Mínimo
                </button>
                
                <button // <--- NUEVO BOTÓN DE VENTAS POR COBRAR
                    className={`btn ${activeReport === 'ventas_por_cobrar' ? 'btn-warning' : 'btn-outline-warning'}`}
                    onClick={() => setActiveReport('ventas_por_cobrar')}
                >
                    Cuentas por Cobrar
                </button>

                <button 
                    className={`btn ${activeReport === 'creditos_vencer' ? 'btn-danger' : 'btn-outline-danger'}`}
                    onClick={() => setActiveReport('creditos_vencer')}
                >
                    🚨 Créditos por Vencer (Proveedores)
                </button>
            </div>

            <div className="card p-3 shadow-sm">
                {renderReportContent()}
            </div>
        </div>
    );
};

export default ReportAdminView;