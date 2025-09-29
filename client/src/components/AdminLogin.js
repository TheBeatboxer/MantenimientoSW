import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const AdminLogin = () => {
  const [formData, setFormData] = useState({
    username: 'admin',
    password: 'admin123'
  });
  const [errors, setErrors] = useState({});

  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Limpiar error cuando el usuario empiece a escribir
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Direct navigation to dashboard without authentication
    navigate('/admin');
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#e9ecef',
      padding: '1rem'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 10px 30px rgba(0, 0, 0, 0.2)',
        padding: '2rem',
        width: '100%',
        maxWidth: '400px'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{
            color: '#2c3e50',
            fontSize: '1.5rem',
            fontWeight: '600',
            marginBottom: '0.5rem'
          }}>
            Panel de Administración
          </h1>
          <p style={{ color: '#7f8c8d', fontSize: '14px' }}>
            Libro de Reclamaciones
          </p>
        </div>
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label required">Usuario</label>
            <input
              type="text"
              name="username"
              className={`form-input ${errors.username ? 'error' : ''}`}
              value={formData.username}
              onChange={handleInputChange}
              placeholder="Ingresa tu usuario"
            />
            {errors.username && <span className="form-error">{errors.username}</span>}
          </div>

          <div className="form-group">
            <label className="form-label required">Contraseña</label>
            <input
              type="password"
              name="password"
              className={`form-input ${errors.password ? 'error' : ''}`}
              value={formData.password}
              onChange={handleInputChange}
              placeholder="Ingresa tu contraseña"
            />
            {errors.password && <span className="form-error">{errors.password}</span>}
          </div>

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '1rem' }}
          >
            Iniciar Sesión
          </button>
        </form>

      </div>
    </div>
  );
};

export default AdminLogin;
