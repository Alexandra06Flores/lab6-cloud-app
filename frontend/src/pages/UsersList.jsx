import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api.js';

export default function UsersList() {
  const [users, setUsers] = useState([]);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  async function loadUsers() {
    try {
      const { data } = await api.get('/users');
      setUsers(data);
    } catch (err) {
      setError('No se pudo cargar la lista de usuarios');
    }
  }

  useEffect(() => {
    loadUsers();
  }, []);

  async function handleDelete(id) {
    if (!window.confirm('¿Eliminar este usuario?')) return;
    try {
      await api.delete(`/users/${id}`);
      loadUsers();
    } catch (err) {
      alert('No se pudo eliminar el usuario');
    }
  }

  function logout() {
    localStorage.removeItem('token');
    navigate('/login');
  }

  return (
    <div className="page">
      <div className="topbar">
        <h1>Usuarios</h1>
        <div>
          <Link className="btn" to="/users/new">+ Nuevo usuario</Link>
          <button className="btn secondary" onClick={logout}>Cerrar sesión</button>
        </div>
      </div>

      {error && <p className="error">{error}</p>}

      <table>
        <thead>
          <tr>
            <th>Foto</th>
            <th>Nombre</th>
            <th>Email</th>
            <th>Teléfono</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u.id}>
              <td>
                {u.profile_image_url ? (
                  <img className="avatar" src={u.profile_image_url} alt={u.full_name} />
                ) : (
                  <div className="avatar placeholder" />
                )}
              </td>
              <td>{u.full_name}</td>
              <td>{u.email}</td>
              <td>{u.phone || '-'}</td>
              <td>
                <Link className="link" to={`/users/${u.id}/edit`}>Editar</Link>
                <button className="link danger" onClick={() => handleDelete(u.id)}>
                  Eliminar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
