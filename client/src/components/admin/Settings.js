import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

const Settings = () => {
  const [form, setForm] = useState({
    name: '', ruc: '', address: '', phone: '', website: '', support_email: ''
  });
  const [logo, setLogo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const { data } = await axios.get('/api/company-info');
        setForm({
          name: data.name || '',
          ruc: data.ruc || '',
          address: data.address || '',
          phone: data.phone || '',
          website: data.website || '',
          support_email: data.support_email || ''
        });
      } catch (e) {
        toast.error('No se pudo cargar la configuración');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (logo) fd.append('logo', logo);
      const { data } = await axios.put('/api/company-info', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Configuración guardada');
      setForm({
        name: data.data.name || '',
        ruc: data.data.ruc || '',
        address: data.data.address || '',
        phone: data.data.phone || '',
        website: data.data.website || '',
        support_email: data.data.support_email || ''
      });
      setLogo(null);
    } catch (e) {
      toast.error('No se pudo guardar');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={{ padding: '2rem' }}>Cargando...</div>;
  }

  return (
    <div style={{ maxWidth: 720, margin: '0 auto' }}>
      <h2 style={{ marginBottom: '1rem' }}>Configuración de la empresa</h2>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Nombre</label>
          <input className="form-input" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
        </div>

        <div className="form-group">
          <label className="form-label">RUC (opcional)</label>
          <input className="form-input" value={form.ruc} onChange={e => setForm({ ...form, ruc: e.target.value })} />
        </div>

        <div className="form-group">
          <label className="form-label">Dirección (opcional)</label>
          <input className="form-input" value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} />
        </div>

        <div className="form-group">
          <label className="form-label">Teléfono (opcional)</label>
          <input className="form-input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
        </div>

        <div className="form-group">
          <label className="form-label">Sitio web (opcional)</label>
          <input className="form-input" value={form.website} onChange={e => setForm({ ...form, website: e.target.value })} />
        </div>

        <div className="form-group">
          <label className="form-label">Email de soporte (opcional)</label>
          <input className="form-input" value={form.support_email} onChange={e => setForm({ ...form, support_email: e.target.value })} />
        </div>

        <div className="form-group">
          <label className="form-label">Logo (opcional)</label>
          <input type="file" accept="image/*" onChange={e => setLogo(e.target.files?.[0] || null)} />
        </div>

        <button className="btn btn-primary" type="submit" disabled={saving}>
          {saving ? 'Guardando...' : 'Guardar'}
        </button>
      </form>
    </div>
  );
};

export default Settings;


