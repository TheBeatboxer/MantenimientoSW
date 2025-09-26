import React, { useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import Dashboard from './admin/Dashboard';
import ClaimsList from './admin/ClaimsList';
import ClaimDetail from './admin/ClaimDetail';
import Sidebar from './admin/Sidebar';
import Header from './admin/Header';
import Settings from './admin/Settings';

const AdminPanel = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Sesión cerrada exitosamente');
      navigate('/admin/login');
    } catch (error) {
      toast.error('Error al cerrar sesión');
    }
  };

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8f9fa' }}>
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Header 
          user={user} 
          onLogout={handleLogout}
          onToggleSidebar={toggleSidebar}
        />
        
        <main style={{ 
          flex: 1, 
          padding: '2rem',
          marginLeft: sidebarOpen ? '250px' : '0',
          transition: 'margin-left 0.3s ease'
        }}>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/claims" element={<ClaimsList />} />
            <Route path="/claims/:id" element={<ClaimDetail />} />
            <Route path="/settings" element={<Settings />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default AdminPanel;
