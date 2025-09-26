import React from 'react';

const Header = ({ user, onLogout, onToggleSidebar }) => {
  return (
    <header style={{
      background: 'white',
      borderBottom: '1px solid #e9ecef',
      padding: '1rem 2rem',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button
          onClick={onToggleSidebar}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '1.5rem',
            cursor: 'pointer',
            padding: '0.5rem',
            borderRadius: '4px',
            color: '#6c757d'
          }}
        >
          ☰
        </button>
        <h1 style={{
          margin: 0,
          fontSize: '1.5rem',
          fontWeight: '600',
          color: '#2c3e50'
        }}>
          Panel de Administración
        </h1>
      </div>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '14px', fontWeight: '500', color: '#2c3e50' }}>
            {user?.full_name || user?.username}
          </div>
          <div style={{ fontSize: '12px', color: '#6c757d' }}>
            {user?.role}
          </div>
        </div>
        
        <button
          onClick={onLogout}
          className="btn btn-secondary"
          style={{ padding: '0.5rem 1rem', fontSize: '14px' }}
        >
          Cerrar Sesión
        </button>
      </div>
    </header>
  );
};

export default Header;
