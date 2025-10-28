// Archivo: punto-venta-frontend/src/App.jsx

import React, { useState } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap-icons/font/bootstrap-icons.css'; // Añadido para iconos
import Login from './components/Login';
import DashboardLayout from './components/DashboardLayout'; // Nuevo componente
import './App.css'; 

function App() {
    // user contendrá { dpi, nombre, rol } si está autenticado
    const [user, setUser] = useState(null); 

    const handleLoginSuccess = (userData) => {
        // Almacena los datos del usuario después de la autenticación exitosa
        setUser(userData); 
    };

    const handleLogout = () => {
        // Limpia el estado del usuario para volver a la pantalla de login
        setUser(null);
    };

    return (
        <div className="app">
            {!user ? (
                // PANTALLA DE LOGIN
                // Note: La API de login debe devolver { nombre: 'Admin', rol: 'Administrador' } o { nombre: 'Cajero', rol: 'Cajero' }
                <Login onLoginSuccess={handleLoginSuccess} />
            ) : (
                // PANTALLA DE DASHBOARD con Menú Dinámico
                <DashboardLayout 
                    user={user} 
                    handleLogout={handleLogout} 
                />
            )}
        </div>
    );
}

export default App;