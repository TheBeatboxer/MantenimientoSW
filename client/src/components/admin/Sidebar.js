import React from 'react';
import { NavLink } from 'react-router-dom';

const Sidebar = ({ isOpen, onClose }) => {

  const menuItems = [
    { path: '/admin', label: 'Dashboard', icon: '📊' },
    { path: '/admin/claims', label: 'Reclamos', icon: '📋' },
    { path: '/admin/settings', label: 'Configuración', icon: '⚙️' }
  ];

  return (
    <>
      {/* Overlay para móvil */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            zIndex: 998
          }}
          onClick={onClose}
        />
      )}
      
      <aside style={{
        position: 'fixed',
        top: 0,
        left: 0,
        height: '100vh',
        width: '250px',
        backgroundColor: '#f8f9fa',
        color: '#333',
        transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform 0.3s ease',
        zIndex: 999,
        overflowY: 'auto'
      }}>
        <div style={{ padding: '2rem 1rem' }}>
          <div style={{
            fontSize: '1.25rem',
            fontWeight: '600',
            marginBottom: '2rem',
            textAlign: 'center'
          }}>
            Libro de Reclamaciones
          </div>
          
          <nav>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {menuItems.map((item) => (
                <li key={item.path} style={{ marginBottom: '0.5rem' }}>
                  <NavLink
                    to={item.path}
                    onClick={onClose}
                    style={({ isActive }) => ({
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.75rem 1rem',
                      color: '#2c3e50',
                      textDecoration: 'none',
                      borderRadius: '6px',
                      transition: 'background-color 0.3s ease',
                      backgroundColor: isActive ? '#e9ecef' : 'transparent'
                    })}
                  >
                    <span style={{ fontSize: '1.25rem' }}>{item.icon}</span>
                    <span>{item.label}</span>
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        </div>
        
        <div style={{
          position: 'absolute',
          bottom: '2rem',
          left: '1rem',
          right: '1rem',
          padding: '1rem',
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          borderRadius: '6px',
          fontSize: '12px',
          textAlign: 'center'
        }}>
          <div>Versión 1.0.0</div>
          <div style={{ marginTop: '0.25rem', opacity: 0.8 }}>
            Sistema de Reclamos
          </div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
