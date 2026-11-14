import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api.js';

export default function UserForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [file, setFile] = useState(null);
  const [currentImage, setCurrentImage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isEdit) return;
    api.get(`/users/${id}`).then(({ data }) => {
      setFullName(data.full_name);
      setEmail(data.email);
      setPhone(data.phone || '');
      setCurrentImage(data.profile_image_url || '');
    });
  }, [id, isEdit]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const formData = new FormData();
    formData.append('full_name', fullName);
    formData.append('email', email);
    formData.append('phone', phone);
    if (file) formData.append('profile_image', file);

    try {
      if (isEdit) {
        await api.put(`/users/${id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      } else {
        await api.post('/users', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.error || 'Error al guardar el usuario');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="center-page">
      <form className="card" onSubmit={handleSubmit}>
        <h1>{isEdit ? 'Editar usuario' : 'Nuevo usuario'}</h1>

        <label>Nombre completo</label>
        <input value={fullName} onChange={(e) => setFullName(e.target.value)} required />

        <label>Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <label>Teléfono</label>
        <input value={phone} onChange={(e) => setPhone(e.target.value)} />

        <label>Foto de perfil</label>
        {currentImage && <img className="avatar" src={currentImage} alt="actual" />}
        <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files[0])} />

        {error && <p className="error">{error}</p>}

        <button type="submit" disabled={loading}>
          {loading ? 'Guardando...' : 'Guardar'}
        </button>
        <button type="button" className="btn secondary" onClick={() => navigate('/')}>
          Cancelar
        </button>
      </form>
    </div>
  );
}
