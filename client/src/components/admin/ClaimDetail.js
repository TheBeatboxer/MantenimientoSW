import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useCompany } from '../../context/CompanyContext';

const ClaimDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { companyInfo } = useCompany();
  const [claim, setClaim] = useState(null);
  const [files, setFiles] = useState([]);
  const [auditLog, setAuditLog] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [statusForm, setStatusForm] = useState({
    status: '',
    notes: ''
  });
  const [responseForm, setResponseForm] = useState({
    message: '',
    notes: '',
    files: null
  });
  const [sendingResponse, setSendingResponse] = useState(false);

  const fetchClaimDetails = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/admin/claims/${id}`);
      const { claim: claimData, files: filesData, audit_log: auditData } = response.data.data;

      setClaim(claimData);
      setFiles(filesData);
      setAuditLog(auditData);
      setStatusForm({ status: claimData.status, notes: '' });
    } catch (error) {
      console.error('Error fetching claim details:', error);
      toast.error('Error al cargar los detalles del reclamo');
      navigate('/admin/claims');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchClaimDetails();
  }, [fetchClaimDetails]);

  const handleStatusUpdate = async (e) => {
    e.preventDefault();
    
    if (!statusForm.status) {
      toast.error('Selecciona un estado');
      return;
    }

    try {
      setUpdatingStatus(true);
      
      await axios.patch(`/api/admin/claims/${id}/status`, {
        status: statusForm.status,
        notes: statusForm.notes || ''
      }, {
        headers: { 'Content-Type': 'application/json' }
      });
      
      toast.success('Estado actualizado exitosamente');
      fetchClaimDetails(); // Recargar datos
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error(error?.response?.data?.error || 'Error al actualizar el estado');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const downloadFile = async (file) => {
    try {
      // Si el archivo tiene una URL de descarga directa de Google Drive (no localhost), usarla
      if (file.download_url && file.download_url.startsWith('http') && !file.download_url.includes('localhost')) {
        window.open(file.download_url, '_blank');
        return;
      }
      
      // Verificar si hay token
      const token = localStorage.getItem('admin_token');
      
      if (!token) {
        toast.error('No estás autenticado. Por favor, inicia sesión nuevamente.');
        return;
      }
      
      // Si no, usar el endpoint del servidor
      const response = await axios.get(`/api/admin/files/${file.id}/download`, {
        responseType: 'blob',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', file.original_name);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
      toast.error('Error al descargar el archivo');
    }
  };

  const handleSendResponse = async (e) => {
    e.preventDefault();
    
    if (!responseForm.message.trim()) {
      toast.error('El mensaje de respuesta es requerido');
      return;
    }

    try {
      setSendingResponse(true);
      
      const formData = new FormData();
      formData.append('message', responseForm.message);
      formData.append('notes', responseForm.notes || '');
      
      // Agregar archivos si los hay
      if (responseForm.files && responseForm.files.length > 0) {
        for (let i = 0; i < responseForm.files.length; i++) {
          formData.append('files', responseForm.files[i]);
        }
      }
      
      await axios.post(`/api/admin/claims/${id}/respond`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      
      toast.success('Respuesta enviada exitosamente por email');
      fetchClaimDetails(); // Recargar datos
      setResponseForm({ message: '', notes: '', files: null });
    } catch (error) {
      console.error('Error sending response:', error);
      toast.error(error?.response?.data?.error || 'Error al enviar la respuesta');
    } finally {
      setSendingResponse(false);
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

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <div className="spinner" style={{ width: '40px', height: '40px' }}></div>
      </div>
    );
  }

  if (!claim) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem' }}>
        <h2>Reclamo no encontrado</h2>
        <button onClick={() => navigate('/admin/claims')} className="btn btn-primary">
          Volver a la lista
        </button>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div>
          <button
            onClick={() => navigate('/admin/claims')}
            className="btn btn-secondary"
            style={{ marginRight: '1rem' }}
          >
            ← Volver
          </button>
          <h1 style={{ margin: 0, color: '#2c3e50', display: 'inline' }}>
            Reclamo {claim.claim_number}
          </h1>
        </div>
        
        <div style={{ display: 'flex', gap: '1rem' }}>
          <a
            href={`https://adminreclamo.biomacruz.com/api/claims/${id}/pdf`}
            className="btn btn-primary"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              pointerEvents: !claim.pdf_generated ? 'none' : 'auto',
              opacity: !claim.pdf_generated ? 0.5 : 1,
            }}
            onClick={(e) => !claim.pdf_generated && e.preventDefault()}
          >
            📄 Descargar PDF
          </a>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '2rem' }}>
        {/* Información principal */}
        <div>
          {/* Datos del consumidor */}
          <div style={{
            background: 'white',
            padding: '1.5rem',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            marginBottom: '1.5rem'
          }}>
            <h2 style={{ margin: '0 0 1rem 0', color: '#2c3e50' }}>Datos del Consumidor</h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ fontSize: '12px', color: '#7f8c8d', fontWeight: '500' }}>Nombres Completos</label>
                <p style={{ margin: '0.25rem 0 1rem 0', fontSize: '14px', color: '#2c3e50' }}>
                  {claim.consumer_name} {claim.consumer_lastname_p} {claim.consumer_lastname_m}
                </p>
              </div>
              
              <div>
                <label style={{ fontSize: '12px', color: '#7f8c8d', fontWeight: '500' }}>Documento</label>
                <p style={{ margin: '0.25rem 0 1rem 0', fontSize: '14px', color: '#2c3e50' }}>
                  {claim.document_type} {claim.document_number}
                </p>
              </div>
              
              <div>
                <label style={{ fontSize: '12px', color: '#7f8c8d', fontWeight: '500' }}>Teléfono</label>
                <p style={{ margin: '0.25rem 0 1rem 0', fontSize: '14px', color: '#2c3e50' }}>
                  {claim.phone}
                </p>
              </div>
              
              <div>
                <label style={{ fontSize: '12px', color: '#7f8c8d', fontWeight: '500' }}>Email</label>
                <p style={{ margin: '0.25rem 0 1rem 0', fontSize: '14px', color: '#2c3e50' }}>
                  {claim.email || 'No proporcionado'}
                </p>
              </div>
              
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ fontSize: '12px', color: '#7f8c8d', fontWeight: '500' }}>Dirección</label>
                <p style={{ margin: '0.25rem 0 0 0', fontSize: '14px', color: '#2c3e50' }}>
                  {claim.address}, {claim.district}, {claim.province}, {claim.department}
                </p>
              </div>
            </div>
          </div>

          {/* Detalles del reclamo */}
          <div style={{
            background: 'white',
            padding: '1.5rem',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            marginBottom: '1.5rem'
          }}>
            <h2 style={{ margin: '0 0 1rem 0', color: '#2c3e50' }}>Detalles del Reclamo</h2>
            
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ fontSize: '12px', color: '#7f8c8d', fontWeight: '500' }}>Tipo</label>
                <p style={{ margin: '0.25rem 0 1rem 0', fontSize: '14px', color: '#2c3e50' }}>
                  {claim.claim_type.toUpperCase()}
                </p>
              </div>
              
              <div>
                <label style={{ fontSize: '12px', color: '#7f8c8d', fontWeight: '500' }}>Producto/Servicio</label>
                <p style={{ margin: '0.25rem 0 1rem 0', fontSize: '14px', color: '#2c3e50' }}>
                  {claim.product_service_type}
                </p>
              </div>
              
              <div>
                <label style={{ fontSize: '12px', color: '#7f8c8d', fontWeight: '500' }}>Monto</label>
                <p style={{ margin: '0.25rem 0 1rem 0', fontSize: '14px', color: '#2c3e50' }}>
                  {claim.amount ? `${claim.currency} ${claim.amount}` : 'No especificado'}
                </p>
              </div>
              
              <div>
                <label style={{ fontSize: '12px', color: '#7f8c8d', fontWeight: '500' }}>Motivo</label>
                <p style={{ margin: '0.25rem 0 1rem 0', fontSize: '14px', color: '#2c3e50' }}>
                  {claim.reason}
                </p>
              </div>
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ fontSize: '12px', color: '#7f8c8d', fontWeight: '500' }}>Detalle</label>
              <div style={{
                margin: '0.25rem 0 0 0',
                padding: '1rem',
                background: '#f8f9fa',
                borderRadius: '6px',
                fontSize: '14px',
                color: '#2c3e50',
                whiteSpace: 'pre-wrap'
              }}>
                {claim.detail}
              </div>
            </div>
            
            {claim.request && (
              <div>
                <label style={{ fontSize: '12px', color: '#7f8c8d', fontWeight: '500' }}>Pedido del Consumidor</label>
                <div style={{
                  margin: '0.25rem 0 0 0',
                  padding: '1rem',
                  background: '#f8f9fa',
                  borderRadius: '6px',
                  fontSize: '14px',
                  color: '#2c3e50',
                  whiteSpace: 'pre-wrap'
                }}>
                  {claim.request}
                </div>
              </div>
            )}
          </div>

          {/* Archivos adjuntos */}
          {files.length > 0 && (
            <div style={{
              background: 'white',
              padding: '1.5rem',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              marginBottom: '1.5rem'
            }}>
              <h2 style={{ margin: '0 0 1rem 0', color: '#2c3e50' }}>Archivos Adjuntos</h2>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '1rem' }}>
                {files.map((file) => (
                  <div
                    key={file.id}
                    style={{
                      border: '1px solid #ddd',
                      borderRadius: '8px',
                      padding: '1rem',
                      background: 'white'
                    }}
                  >
                    {file.mime_type?.startsWith('image/') ? (
                      <div style={{ marginBottom: '0.5rem' }}>
                        <img 
                          src={file.view_url} 
                          alt={file.original_name}
                          style={{
                            width: '100%',
                            height: '150px',
                            objectFit: 'cover',
                            borderRadius: '4px',
                            border: '1px solid #eee'
                          }}
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'block';
                          }}
                        />
                        <div style={{ 
                          fontSize: '2rem', 
                          textAlign: 'center', 
                          padding: '2rem',
                          display: 'none',
                          background: '#f8f9fa',
                          borderRadius: '4px'
                        }}>
                          🖼️
                        </div>
                      </div>
                    ) : (
                      <div style={{ 
                        fontSize: '2rem', 
                        textAlign: 'center', 
                        marginBottom: '0.5rem',
                        padding: '1rem',
                        background: '#f8f9fa',
                        borderRadius: '4px'
                      }}>
                        📄
                      </div>
                    )}
                    
                    <div style={{ marginBottom: '0.5rem' }}>
                      <div style={{ fontSize: '14px', fontWeight: '500', color: '#2c3e50', marginBottom: '0.25rem' }}>
                        {file.original_name}
                      </div>
                      <div style={{ fontSize: '12px', color: '#7f8c8d' }}>
                        {formatFileSize(file.file_size)}
                      </div>
                    </div>
                    
                    <button
                      onClick={() => downloadFile(file)}
                      className="btn btn-primary"
                      style={{ width: '100%', padding: '0.5rem', fontSize: '12px' }}
                    >
                      Descargar
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Panel lateral */}
        <div>
          {/* Estado actual */}
          <div style={{
            background: 'white',
            padding: '1.5rem',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            marginBottom: '1.5rem'
          }}>
            <h3 style={{ margin: '0 0 1rem 0', color: '#2c3e50' }}>Estado Actual</h3>
            
            <div style={{ marginBottom: '1rem' }}>
              <span style={{
                padding: '0.5rem 1rem',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: '500',
                backgroundColor: getStatusColor(claim.status) + '20',
                color: getStatusColor(claim.status)
              }}>
                {getStatusLabel(claim.status)}
              </span>
            </div>
            
            <div style={{ fontSize: '12px', color: '#7f8c8d', marginBottom: '1rem' }}>
              <p><strong>Fecha de creación:</strong> {(() => {
                const date = new Date(claim.date_created + 'Z');
                date.setHours(date.getHours() - 5);
                return date.toLocaleString('es-PE');
              })()}</p>
              <p><strong>Última actualización:</strong> {(() => {
                const date = new Date(claim.updated_at + 'Z');
                date.setHours(date.getHours() - 5);
                return date.toLocaleString('es-PE');
              })()}</p>
            </div>
          </div>

          {/* Cambiar estado */}
          <div style={{
            background: 'white',
            padding: '1.5rem',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            marginBottom: '1.5rem'
          }}>
            <h3 style={{ margin: '0 0 1rem 0', color: '#2c3e50' }}>Cambiar Estado</h3>
            
            <form onSubmit={handleStatusUpdate}>
              <div className="form-group">
                <label className="form-label">Nuevo Estado</label>
                <select
                  className="form-select"
                  value={statusForm.status}
                  onChange={(e) => setStatusForm(prev => ({ ...prev, status: e.target.value }))}
                >
                  <option value="pendiente">Pendiente</option>
                  <option value="en_revision">En Revisión</option>
                  <option value="respondido">Respondido</option>
                  <option value="cerrado">Cerrado</option>
                </select>
              </div>
              
              <div className="form-group">
                <label className="form-label">Notas (opcional)</label>
                <textarea
                  className="form-textarea"
                  rows={3}
                  value={statusForm.notes}
                  onChange={(e) => setStatusForm(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Agregar notas sobre el cambio de estado..."
                />
              </div>

              
              <button
                type="submit"
                className="btn btn-primary"
                disabled={updatingStatus || statusForm.status === claim.status}
                style={{ width: '100%' }}
              >
                {updatingStatus ? (
                  <>
                    <div className="spinner" style={{ width: '16px', height: '16px' }}></div>
                    Actualizando...
                  </>
                ) : (
                  'Actualizar Estado'
                )}
              </button>
            </form>
          </div>

          {/* Enviar respuesta por email */}
          {claim?.email && claim?.status !== 'respondido' && (
            <div style={{
              background: 'white',
              padding: '1.5rem',
              borderRadius: '8px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              marginBottom: '1.5rem'
            }}>
              <h3 style={{ margin: '0 0 1rem 0', color: '#2c3e50' }}>Enviar Respuesta por Email</h3>
              
              <form onSubmit={handleSendResponse} encType="multipart/form-data">
                <div className="form-group">
                  <label className="form-label">Mensaje de respuesta *</label>
                  <textarea
                    className="form-textarea"
                    rows={4}
                    value={responseForm.message}
                    onChange={(e) => setResponseForm(prev => ({ ...prev, message: e.target.value }))}
                    placeholder="Escriba aquí la respuesta que se enviará al usuario..."
                    required
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Notas adicionales (opcional)</label>
                  <textarea
                    className="form-textarea"
                    rows={2}
                    value={responseForm.notes}
                    onChange={(e) => setResponseForm(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Notas internas que no se enviarán al usuario..."
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Archivos adjuntos (opcional)</label>
                  <input
                    type="file"
                    multiple
                    accept="image/*,.pdf,.doc,.docx"
                    onChange={(e) => setResponseForm(prev => ({ ...prev, files: e.target.files }))}
                    className="form-input"
                  />
                  <small className="form-help">
                    Puede adjuntar fotos, documentos PDF o Word (máximo 5 archivos)
                  </small>
                </div>
                
                <button
                  type="submit"
                  className="btn btn-success"
                  disabled={sendingResponse}
                  style={{ width: '100%' }}
                >
                  {sendingResponse ? (
                    <>
                      <div className="spinner" style={{ width: '16px', height: '16px' }}></div>
                      Enviando...
                    </>
                  ) : (
                    '📧 Enviar Respuesta por Email'
                  )}
                </button>
              </form>
            </div>
          )}

          {/* Bitácora */}
          <div style={{
            background: 'white',
            padding: '1.5rem',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ margin: '0 0 1rem 0', color: '#2c3e50' }}>Bitácora de Cambios</h3>
            
            <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
              {auditLog.length === 0 ? (
                <p style={{ color: '#7f8c8d', fontSize: '14px', textAlign: 'center' }}>
                  No hay registros de cambios
                </p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {auditLog.map((log) => (
                    <div
                      key={log.id}
                      style={{
                        padding: '1rem',
                        background: '#f8f9fa',
                        borderRadius: '6px',
                        borderLeft: '3px solid #3498db'
                      }}
                    >
                      <div style={{ fontSize: '12px', color: '#7f8c8d', marginBottom: '0.5rem' }}>
                        {(() => {
                          const date = new Date(log.created_at);
                          date.setHours(date.getHours() - 5);
                          return date.toLocaleString('es-PE');
                        })()}
                        {log.admin_username && ` • ${log.admin_username}`}
                      </div>
                      <div style={{ fontSize: '14px', color: '#2c3e50', fontWeight: '500' }}>
                        {log.description}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClaimDetail;
