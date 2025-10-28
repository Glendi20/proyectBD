// Archivo: punto-venta-frontend/src/components/WelcomeScreen.jsx

import React from 'react';

const WelcomeScreen = ({ user }) => {
    return (
        <div className="p-4">
            <div className="alert alert-success" role="alert">
                <h1 className="alert-heading">Bienvenido, {user.nombre}</h1>
                <p className="lead">Has iniciado sesión con el rol de **{user.rol}**.</p>
                <hr />
                <p className="mb-0">
                    Utiliza el menú lateral para navegar a los módulos permitidos.
                </p>
            </div>
        </div>
    );
};

export default WelcomeScreen;