import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recentClaims, setRecentClaims] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsResponse, claimsResponse] = await Promise.all([
        axios.get('/api/admin/dashboard/stats'),
        axios.get('/api/admin/claims?limit=5')
      ]);

      setStats(statsResponse.data.data.overview);
      setRecentClaims(claimsResponse.data.data.claims);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast.error('Error al cargar los datos del dashboard');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      pendiente: '#f39c12',
      en_revision: '#3498db',
      respondido: '#27ae60',
      cerrado: '#95a5a6'
    };
    return colors[status] || '#95a5a6';
  };

  const getStatusLabel = (status) => {
    const labels = {
      pendiente: 'Pendiente',
      en_revision: 'En Revisión',
      respondido: 'Respondido',
      cerrado: 'Cerrado'
    };
    return labels[status] || status;
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <div className="spinner" style={{ width: '40px', height: '40px' }}></div>
      </div>
    );
  }

  return (
    <div>
      <h1 style={{ marginBottom: '2rem', color: '#2c3e50' }}>Dashboard</h1>
      
      {/* Estadísticas principales */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
        gap: '1.5rem',
        marginBottom: '2rem'
      }}>
        <div style={{
          background: 'white',
          padding: '1.5rem',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          borderLeft: '4px solid #3498db'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ margin: 0, color: '#7f8c8d', fontSize: '14px', fontWeight: '500' }}>
                Total de Reclamos
              </h3>
              <p style={{ margin: '0.5rem 0 0 0', fontSize: '2rem', fontWeight: '600', color: '#2c3e50' }}>
                {stats?.total_claims || 0}
              </p>
            </div>
            <div style={{ fontSize: '2rem' }}>📋</div>
          </div>
        </div>

        <div style={{
          background: 'white',
          padding: '1.5rem',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          borderLeft: '4px solid #f39c12'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ margin: 0, color: '#7f8c8d', fontSize: '14px', fontWeight: '500' }}>
                Pendientes
              </h3>
              <p style={{ margin: '0.5rem 0 0 0', fontSize: '2rem', fontWeight: '600', color: '#2c3e50' }}>
                {stats?.pending_claims || 0}
              </p>
            </div>
            <div style={{ fontSize: '2rem' }}>⏳</div>
          </div>
        </div>

        <div style={{
          background: 'white',
          padding: '1.5rem',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          borderLeft: '4px solid #27ae60'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ margin: 0, color: '#7f8c8d', fontSize: '14px', fontWeight: '500' }}>
                Respondidos
              </h3>
              <p style={{ margin: '0.5rem 0 0 0', fontSize: '2rem', fontWeight: '600', color: '#2c3e50' }}>
                {stats?.responded_claims || 0}
              </p>
            </div>
            <div style={{ fontSize: '2rem' }}>✅</div>
          </div>
        </div>

        <div style={{
          background: 'white',
          padding: '1.5rem',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          borderLeft: '4px solid #e74c3c'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h3 style={{ margin: 0, color: '#7f8c8d', fontSize: '14px', fontWeight: '500' }}>
                Hoy
              </h3>
              <p style={{ margin: '0.5rem 0 0 0', fontSize: '2rem', fontWeight: '600', color: '#2c3e50' }}>
                {stats?.today_claims || 0}
              </p>
            </div>
            <div style={{ fontSize: '2rem' }}>📅</div>
          </div>
        </div>
      </div>

      {/* Estadísticas por tipo */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '1rem',
        marginBottom: '2rem'
      }}>
        <div style={{
          background: 'white',
          padding: '1rem',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <h4 style={{ margin: '0 0 0.5rem 0', color: '#2c3e50' }}>Reclamos</h4>
          <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: '600', color: '#3498db' }}>
            {stats?.claims_count || 0}
          </p>
        </div>

        <div style={{
          background: 'white',
          padding: '1rem',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <h4 style={{ margin: '0 0 0.5rem 0', color: '#2c3e50' }}>Quejas</h4>
          <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: '600', color: '#e74c3c' }}>
            {stats?.complaints_count || 0}
          </p>
        </div>

        <div style={{
          background: 'white',
          padding: '1rem',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <h4 style={{ margin: '0 0 0.5rem 0', color: '#2c3e50' }}>Esta Semana</h4>
          <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: '600', color: '#9b59b6' }}>
            {stats?.week_claims || 0}
          </p>
        </div>

        <div style={{
          background: 'white',
          padding: '1rem',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <h4 style={{ margin: '0 0 0.5rem 0', color: '#2c3e50' }}>Este Mes</h4>
          <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: '600', color: '#1abc9c' }}>
            {stats?.month_claims || 0}
          </p>
        </div>
      </div>

      {/* Reclamos recientes */}
      <div style={{
        background: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        overflow: 'hidden'
      }}>
        <div style={{
          padding: '1.5rem',
          borderBottom: '1px solid #e9ecef',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <h2 style={{ margin: 0, color: '#2c3e50' }}>Reclamos Recientes</h2>
          <button
            onClick={() => navigate('/admin/claims')}
            className="btn btn-primary"
            style={{ padding: '0.5rem 1rem', fontSize: '14px' }}
          >
            Ver Todos
          </button>
        </div>

        <div style={{ padding: '0' }}>
          {recentClaims.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: '#7f8c8d' }}>
              No hay reclamos recientes
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#f8f9fa' }}>
                    <th style={{ padding: '1rem', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#2c3e50' }}>
                      Número
                    </th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#2c3e50' }}>
                      Consumidor
                    </th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#2c3e50' }}>
                      Tipo
                    </th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#2c3e50' }}>
                      Estado
                    </th>
                    <th style={{ padding: '1rem', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#2c3e50' }}>
                      Fecha
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {recentClaims.map((claim) => (
                    <tr
                      key={claim.id}
                      style={{
                        borderBottom: '1px solid #e9ecef',
                        cursor: 'pointer'
                      }}
                      onClick={() => navigate(`/admin/claims/${claim.id}`)}
                    >
                      <td style={{ padding: '1rem', fontSize: '14px', fontWeight: '500', color: '#2c3e50' }}>
                        {claim.claim_number}
                      </td>
                      <td style={{ padding: '1rem', fontSize: '14px' }}>
                        {claim.consumer_name} {claim.consumer_lastname_p}
                      </td>
                      <td style={{ padding: '1rem', fontSize: '14px' }}>
                        <span style={{
                          padding: '0.25rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '500',
                          backgroundColor: claim.claim_type === 'reclamo' ? '#e3f2fd' : '#fff3e0',
                          color: claim.claim_type === 'reclamo' ? '#1976d2' : '#f57c00'
                        }}>
                          {claim.claim_type.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: '1rem', fontSize: '14px' }}>
                        <span style={{
                          padding: '0.25rem 0.5rem',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontWeight: '500',
                          backgroundColor: getStatusColor(claim.status) + '20',
                          color: getStatusColor(claim.status)
                        }}>
                          {getStatusLabel(claim.status)}
                        </span>
                      </td>
                      <td style={{ padding: '1rem', fontSize: '14px', color: '#7f8c8d' }}>
                        {new Date(claim.date_created).toLocaleDateString('es-PE')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
