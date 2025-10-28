// Archivo: src/features/User/CreateUserForm.jsx

import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL_USERS = 'http://localhost:3001/api/usuarios';
const API_URL_ROLES = 'http://localhost:3001/api/roles';

const CreateUserForm = ({ onUserSaved, initialData = null }) => {
    const isEditing = initialData !== null;
    const [roles, setRoles] = useState([]);
    const [loadingRoles, setLoadingRoles] = useState(true);

    // --- ESTADO CORREGIDO: Mapeando TODAS las propiedades correctamente ---
    const [formData, setFormData] = useState({
        // IDs y Nombres (Aseguramos que todos usen initialData correctamente)
        usuario_id: initialData?.dpi || '', // Mapea de initialData.dpi
        nombre: initialData?.nombre || '', // <-- DEBE MAPEAR ESTE CAMPO
        apellidos: initialData?.apellidos || '', // <-- DEBE MAPEAR ESTE CAMPO
        
        // Credenciales y Rol
        nombre_usuario: initialData?.nombreUsuario || '', // <-- DEBE MAPEAR ESTE CAMPO
        contrasena: '',
        rol_id: initialData?.rolId || '', 
        
        // Contacto (Se asume que estos campos ya funcionan)
        telefono: initialData?.telefono || '',
        correo_electronico: initialData?.correo || '',
    });
    // --------------------------------------------------------------------
    const [message, setMessage] = useState('');

    // EFECTO: Cargar Roles al inicio
    useEffect(() => {
        const fetchRoles = async () => {
            try {
                const response = await axios.get(API_URL_ROLES);
                setRoles(response.data);
                setLoadingRoles(false);
                
                // Si está editando, establece el rol_id basado en el rol que trae el objeto de modificación
                if (isEditing && initialData?.rolId) {
                    setFormData(prev => ({ ...prev, rol_id: initialData.rolId }));
                }
                // Si es nuevo y no hay rol seleccionado, selecciona el primero
                else if (!isEditing && response.data.length > 0) {
                    setFormData(prev => ({ ...prev, rol_id: response.data[0].rolId }));
                }
            } catch (err) {
                console.error("Error al cargar roles:", err);
                setLoadingRoles(false);
            }
        };
        fetchRoles();
    }, [isEditing]); // Depende del modo edición

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setMessage('');

        try {
            const endpoint = isEditing ? `${API_URL_USERS}/${formData.usuario_id}` : API_URL_USERS;
            const method = isEditing ? 'put' : 'post';
            
            if (!isEditing && !formData.contrasena) {
                 throw new Error("Debe asignar una contraseña para el nuevo usuario.");
            }

            await axios({
                method: method,
                url: endpoint,
                data: { ...formData, rol_id: parseInt(formData.rol_id) }
            });

            setMessage(`✅ Usuario ${isEditing ? 'modificado' : 'creado'} con éxito.`);
            if (!isEditing) setFormData(prev => ({ ...prev, usuario_id: '', nombre: '', apellidos: '', contrasena: '' }));
            
            onUserSaved(); 

        } catch (err) {
            console.error("Error al guardar usuario:", err);
            setMessage(`❌ Error al guardar: ${err.response?.data?.error || err.message}`);
        }
    };
    
    if (loadingRoles) return <p className="text-info">Cargando roles disponibles...</p>;

    return (
        <div className="mt-4 card p-4">
            <h4>{isEditing ? `Modificar Empleado DPI: ${formData.usuario_id}` : 'Crear Nuevo Empleado'}</h4>
            <form onSubmit={handleSubmit}>
                <div className="row">
                    {/* DPI y Nombre de Usuario */}
                    <div className="col-md-6 mb-3">
                        <label className="form-label">DPI / ID:</label>
                        <input type="text" className="form-control" name="usuario_id" value={formData.usuario_id} onChange={handleChange} required disabled={isEditing} />
                    </div>
                    <div className="col-md-6 mb-3">
                        <label className="form-label">Nombre de Usuario (Login):</label>
                        <input type="text" className="form-control" name="nombre_usuario" value={formData.nombre_usuario} onChange={handleChange} required />
                    </div>

                    {/* Nombre y Apellido */}
                    <div className="col-md-6 mb-3">
                        <label className="form-label">Nombre:</label>
                        <input type="text" className="form-control" name="nombre" value={formData.nombre} onChange={handleChange} required />
                    </div>
                    <div className="col-md-6 mb-3">
                        <label className="form-label">Apellido:</label>
                        <input type="text" className="form-control" name="apellidos" value={formData.apellidos} onChange={handleChange} />
                    </div>

                    {/* Contraseña */}
                    <div className="col-md-6 mb-3">
                        <label className="form-label">Contraseña {isEditing && "(Dejar vacío para no cambiar)"}:</label>
                        <input type="password" className="form-control" name="contrasena" value={formData.contrasena} onChange={handleChange} required={!isEditing} />
                    </div>
                    
                    {/* Rol */}
                    <div className="col-md-6 mb-3">
                        <label className="form-label">Rol del Sistema:</label>
                        <select className="form-select" name="rol_id" value={formData.rol_id} onChange={handleChange} required>
                            {roles.map(rol => (
                                <option key={rol.rolId} value={rol.rolId}>
                                    {rol.nombreRol}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Teléfono y Correo Electrónico */}
                    <div className="col-md-6 mb-3">
                        <label className="form-label">Teléfono:</label>
                        <input type="text" className="form-control" name="telefono" value={formData.telefono} onChange={handleChange} />
                    </div>
                    <div className="col-md-6 mb-3">
                        <label className="form-label">Correo Electrónico:</label>
                        <input type="email" className="form-control" name="correo_electronico" value={formData.correo_electronico} onChange={handleChange} />
                    </div>
                </div>
                
                {message && <p className={`alert ${message.startsWith('✅') ? 'alert-success' : 'alert-danger'}`}>{message}</p>}

                <div className="d-flex justify-content-end mt-3">
                    <button type="submit" className="btn btn-primary me-2">
                        {isEditing ? 'Guardar Cambios' : 'Registrar Empleado'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default CreateUserForm;