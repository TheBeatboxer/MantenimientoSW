import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';

const ClaimsList = () => {
  const [claims, setClaims] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    current_page: 1,
    total_pages: 1,
    total_items: 0,
    items_per_page: 20
  });
  
  const [filters, setFilters] = useState({
    status: '',
    claim_type: '',
    date_from: '',
    date_to: '',
    search: ''
  });
  
  const navigate = useNavigate();

  const fetchClaims = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: pagination.current_page,
        limit: pagination.items_per_page,
        ...filters
      });

      const response = await axios.get(`/api/admin/claims?${params}`);
      setClaims(response.data.data.claims);
      setPagination(response.data.data.pagination);
    } catch (error) {
      console.error('Error fetching claims:', error);
      toast.error('Error al cargar los reclamos');
    } finally {
      setLoading(false);
    }
  }, [pagination.current_page, pagination.items_per_page, filters]);

  useEffect(() => {
    fetchClaims();
  }, [fetchClaims]);

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
    setPagination(prev => ({ ...prev, current_page: 1 }));
  };

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, current_page: newPage }));
  };

  const exportToCSV = async () => {
    try {
      const params = new URLSearchParams(filters);
      const response = await axios.get(`/api/admin/claims/export/csv?${params}`, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `reclamos_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success('Archivo CSV exportado exitosamente');
    } catch (error) {
      console.error('Error exporting CSV:', error);
      toast.error('Error al exportar el archivo CSV');
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

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ margin: 0, color: '#2c3e50' }}>Gestión de Reclamos</h1>
        <button
          onClick={exportToCSV}
          className="btn btn-success"
          style={{ padding: '0.5rem 1rem', fontSize: '14px' }}
        >
          📊 Exportar CSV
        </button>
      </div>

      {/* Filtros */}
      <div style={{
        background: 'white',
        padding: '1.5rem',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        marginBottom: '2rem'
      }}>
        <h3 style={{ margin: '0 0 1rem 0', color: '#2c3e50' }}>Filtros</h3>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '1rem'
        }}>
          <div className="form-group">
            <label className="form-label">Estado</label>
            <select
              className="form-select"
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
            >
              <option value="">Todos los estados</option>
              <option value="pendiente">Pendiente</option>
              <option value="en_revision">En Revisión</option>
              <option value="respondido">Respondido</option>
              <option value="cerrado">Cerrado</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Tipo</label>
            <select
              className="form-select"
              value={filters.claim_type}
              onChange={(e) => handleFilterChange('claim_type', e.target.value)}
            >
              <option value="">Todos los tipos</option>
              <option value="reclamo">Reclamo</option>
              <option value="queja">Queja</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Desde</label>
            <input
              type="date"
              className="form-input"
              value={filters.date_from}
              onChange={(e) => handleFilterChange('date_from', e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Hasta</label>
            <input
              type="date"
              className="form-input"
              value={filters.date_to}
              onChange={(e) => handleFilterChange('date_to', e.target.value)}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Buscar</label>
            <input
              type="text"
              className="form-input"
              placeholder="Nombre, documento, número..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* Lista de reclamos */}
      <div style={{
        background: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        overflow: 'hidden'
      }}>
        {loading ? (
          <div style={{ padding: '2rem', textAlign: 'center' }}>
            <div className="spinner" style={{ width: '40px', height: '40px', margin: '0 auto' }}></div>
            <p style={{ marginTop: '1rem', color: '#7f8c8d' }}>Cargando reclamos...</p>
          </div>
        ) : (
          <>
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
                    <th style={{ padding: '1rem', textAlign: 'left', fontSize: '14px', fontWeight: '600', color: '#2c3e50' }}>
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {claims.length === 0 ? (
                    <tr>
                      <td colSpan="6" style={{ padding: '2rem', textAlign: 'center', color: '#7f8c8d' }}>
                        No se encontraron reclamos
                      </td>
                    </tr>
                  ) : (
                    claims.map((claim) => (
                      <tr
                        key={claim.id}
                        style={{
                          borderBottom: '1px solid #e9ecef'
                        }}
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
                        <td style={{ padding: '1rem', fontSize: '14px' }}>
                          <button
                            onClick={() => navigate(`/admin/claims/${claim.id}`)}
                            className="btn btn-primary"
                            style={{ padding: '0.25rem 0.5rem', fontSize: '12px' }}
                          >
                            Ver Detalles
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Paginación */}
            {pagination.total_pages > 1 && (
              <div style={{
                padding: '1rem',
                borderTop: '1px solid #e9ecef',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div style={{ fontSize: '14px', color: '#7f8c8d' }}>
                  Mostrando {((pagination.current_page - 1) * pagination.items_per_page) + 1} a{' '}
                  {Math.min(pagination.current_page * pagination.items_per_page, pagination.total_items)} de{' '}
                  {pagination.total_items} reclamos
                </div>
                
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    onClick={() => handlePageChange(pagination.current_page - 1)}
                    disabled={!pagination.has_prev}
                    className="btn btn-secondary"
                    style={{ padding: '0.5rem', fontSize: '14px' }}
                  >
                    Anterior
                  </button>
                  
                  <span style={{
                    padding: '0.5rem 1rem',
                    background: '#f8f9fa',
                    borderRadius: '4px',
                    fontSize: '14px',
                    color: '#2c3e50'
                  }}>
                    {pagination.current_page} de {pagination.total_pages}
                  </span>
                  
                  <button
                    onClick={() => handlePageChange(pagination.current_page + 1)}
                    disabled={!pagination.has_next}
                    className="btn btn-secondary"
                    style={{ padding: '0.5rem', fontSize: '14px' }}
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default ClaimsList;
