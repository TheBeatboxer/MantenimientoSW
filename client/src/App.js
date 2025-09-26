import React from 'react';
import { Routes, Route } from 'react-router-dom';
import ClaimForm from './components/ClaimForm';
import AdminPanel from './components/AdminPanel';
import AdminLogin from './components/AdminLogin';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import { CompanyProvider } from './context/CompanyContext';

function App() {
  return (
    <AuthProvider>
      <CompanyProvider>
        <div className="App">
          <Routes>
            <Route path="/" element={<ClaimForm />} />
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route 
              path="/admin/*" 
              element={
                <ProtectedRoute>
                  <AdminPanel />
                </ProtectedRoute>
              } 
            />
          </Routes>
        </div>
      </CompanyProvider>
    </AuthProvider>
  );
}

export default App;
