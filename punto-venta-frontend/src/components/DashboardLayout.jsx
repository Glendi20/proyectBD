// Archivo: punto-venta-frontend/src/components/DashboardLayout.jsx

import React, { useState } from 'react';
import WelcomeScreen from './WelcomeScreen';
import CajaModule from '../features/Ventas/VentaAdminView';
import ProductAdminView from '../features/Product/ProductAdminView'; 
import TaxAdminView from '../features/Tax/TaxAdminView'; 
import CategoryAdminView from '../features/Category/CategoryAdminView'; 
import ProveedorAdminView from '../features/Proveedor/ProveedorAdminView'; 
import ClientAdminView from '../features/Client/ClientAdminView'; 
import RoleAdminView from '../features/Role/RoleAdminView'; 
import UserAdminView from '../features/User/UserAdminView'; 
import DiscountAdminView from '../features/Discount/DiscountAdminView'; 
import CompraAdminView from '../features/Compra/CompraAdminView'; 
import ReportAdminView from '../features/Report/ReportAdminView'; // Importación necesaria

// Define el mapa de todas las rutas y sus permisos de acceso
const menuItems = [
    // ROL: Administrador, Gerente, Cajero, Bodega
    { id: 'welcome', label: 'Inicio', icon: 'bi-house-door-fill', allowedRoles: ['Administrador', 'Gerente', 'Cajero', 'Bodega'] },

    // Módulos de Operación de Venta
    { id: 'caja', label: 'Caja / Venta', icon: 'bi-cash-coin', allowedRoles: ['Administrador', 'Gerente', 'Cajero'], component: CajaModule },
    
    // Módulos de Inventario y Compras (Bodega)
    { id: 'productos', label: 'Productos', icon: 'bi-box-seam', allowedRoles: ['Administrador', 'Gerente', 'Bodega'], component: ProductAdminView }, 
    { id: 'categorias', label: 'Categorías', icon: 'bi-tags-fill', allowedRoles: ['Administrador', 'Gerente', 'Bodega'], component: CategoryAdminView }, 
    { id: 'compras', label: 'Compras', icon: 'bi-box-arrow-in-left', allowedRoles: ['Administrador', 'Gerente', 'Bodega'], component: CompraAdminView }, 
    { id: 'proveedores', label: 'Proveedores', icon: 'bi-truck', allowedRoles: ['Administrador', 'Gerente', 'Bodega'], component: ProveedorAdminView }, 
    
    // RUTA DE CLIENTES 
    { id: 'clientes', label: 'Clientes', icon: 'bi-people-fill', allowedRoles: ['Administrador', 'Gerente', 'Cajero'], component: ClientAdminView }, 
    
    // Módulos de Administración/Configuración (Solo Admin/Gerente)
    { id: 'tasas_impuestos', label: 'Tasas Impuestos', icon: 'bi-percent', allowedRoles: ['Administrador', 'Gerente'], component: TaxAdminView },
    { id: 'descuentos', label: 'Descuentos', icon: 'bi-scissors', allowedRoles: ['Administrador', 'Gerente'], component: DiscountAdminView }, 
    
    // Módulos de Seguridad/Roles (Solo Admin/Gerente)
    { id: 'roles', label: 'Roles', icon: 'bi-person-rolodex', allowedRoles: ['Administrador', 'Gerente'], component: RoleAdminView }, 
    { id: 'usuarios', label: 'Usuarios', icon: 'bi-person-badge-fill', allowedRoles: ['Administrador', 'Gerente'], component: UserAdminView },
    
    // *** MÓDULO DE REPORTES (SOLUCIÓN: ASIGNAR EL COMPONENTE) ***
    { 
        id: 'reportes', 
        label: 'Reportes', 
        icon: 'bi-graph-up', 
        allowedRoles: ['Administrador', 'Gerente'], // Permisos de Gerente/Admin
        component: ReportAdminView // <--- ¡AÑADIDO! Esto hace que el ícono aparezca.
    },
];

const DashboardLayout = ({ user, handleLogout }) => {
    const [activeModule, setActiveModule] = useState('welcome'); 

    const filteredMenuItems = menuItems.filter(item => 
        item.allowedRoles.includes(user.rol)
    );

    const renderContent = () => {
        const activeMenuItem = menuItems.find(item => item.id === activeModule);
        
        const ComponentToRender = activeMenuItem?.component || WelcomeScreen;

        return <ComponentToRender user={user} />;
    };

    return (
        <div className="d-flex" style={{ minHeight: '100vh' }}>
            
            {/* Sidebar (Menú Lateral) */}
            <div className="bg-dark text-white p-3 d-flex flex-column" style={{ width: '250px' }}>
                <h5 className="text-center mb-4 text-warning">PDV - {user.rol.toUpperCase()}</h5>
                <ul className="nav nav-pills flex-column mb-auto">
                    {filteredMenuItems.map(item => (
                        <li className="nav-item" key={item.id}>
                            <a 
                                href="#" 
                                className={`nav-link text-white ${activeModule === item.id ? 'active bg-primary' : ''}`}
                                onClick={(e) => { e.preventDefault(); setActiveModule(item.id); }}
                            >
                                <i className={`bi ${item.icon} me-2`}></i> {item.label}
                            </a>
                        </li>
                    ))}
                </ul>
            </div>

            {/* Main Content (Header y Contenido) */}
            <div className="flex-grow-1 overflow-auto">
                
                {/* Header (Barra Superior) */}
                <header className="bg-light shadow-sm p-3 d-flex justify-content-between align-items-center">
                    <div>
                        <span className="me-3">Bienvenido, **{user.nombre}**</span>
                        <span className="badge bg-primary">{user.rol}</span>
                    </div>
                    <button onClick={handleLogout} className="btn btn-danger btn-sm">
                        <i className="bi bi-box-arrow-right me-1"></i> Cerrar Sesión
                    </button>
                </header>

                {/* Contenido Dinámico */}
                <main className="p-3">
                    {renderContent()}
                </main>
            </div>
        </div>
    );
};

export default DashboardLayout;