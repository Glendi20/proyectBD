// Archivo: punto-venta-frontend/src/components/Login.jsx

import React, { useState } from 'react';
// La URL de tu API de autenticación
const API_URL = 'http://localhost:3001/api/auth/login'; 

const Login = ({ onLoginSuccess }) => {
    // Estados para capturar el input del usuario
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleLogin = async (e) => {
        e.preventDefault(); // Evita el envío tradicional del formulario
        setError('');

        if (!username || !password) {
            setError('Por favor, ingrese usuario y contraseña.');
            return;
        }

        try {
            const response = await fetch(API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ nombre_usuario: username, contrasena: password })
            });

            const data = await response.json();

            if (response.ok) {
                // Autenticación exitosa
                alert(`Bienvenido, ${data.usuario.nombre}. Rol: ${data.usuario.rol}`);
                
                // Llama a una función superior para actualizar el estado de la aplicación
                if (onLoginSuccess) {
                    onLoginSuccess(data.usuario);
                }

            } else {
                // Credenciales inválidas o error de servidor (401 o 500)
                setError(data.error || 'Fallo en la autenticación.');
            }
        } catch (err) {
            // Error de conexión de red
            console.error('Error de conexión:', err);
            setError('No se pudo conectar al servidor API.');
        }
    };

    return (
        <div style={{ padding: '20px', maxWidth: '400px', margin: '50px auto', border: '1px solid #ccc' }}>
            <h2>Inicio de Sesión (PDV)</h2>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            <form onSubmit={handleLogin}>
                <div style={{ marginBottom: '15px' }}>
                    <label>Usuario (Ej. admin):</label>
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        style={{ width: '100%', padding: '8px' }}
                    />
                </div>
                <div style={{ marginBottom: '20px' }}>
                    <label>Contraseña (Ej. admin):</label>
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        style={{ width: '100%', padding: '8px' }}
                    />
                </div>
                <button type="submit" style={{ width: '100%', padding: '10px', background: '#007bff', color: 'white', border: 'none' }}>
                    Ingresar
                </button>
            </form>
        </div>
    );
};

export default Login;