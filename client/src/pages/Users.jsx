import { useState, useEffect } from 'react';
import {
  Plus, Trash2, Users as UsersIcon, Shield, Key, X, Edit2,
} from 'lucide-react';
import Layout from '../components/Layout';
import api from '../api';
import { useAuth } from '../context/AuthContext';

export default function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('');
  const { user: currentUser, currentOrganization } = useAuth();
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'employee',
  });

  useEffect(() => {
    if (currentOrganization) {
      loadUsers();
    }
  }, [currentOrganization]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get('/users', {
        headers: {
          'x-organization-id': currentOrganization?.id,
        },
      });
      setUsers(response.data);
    } catch (error) {
      console.error('Error loading users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      await api.post('/auth/register', { ...formData, token });
      setShowModal(false);
      setFormData({
        username: '', email: '', password: '', role: 'employee',
      });
      loadUsers();
    } catch (error) {
      alert(error.response?.data?.error || 'Error al crear usuario');
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('¿Remover este usuario de la organización?')) return;
    try {
      await api.delete(`/users/${id}`, {
        headers: {
          'x-organization-id': currentOrganization?.id,
        },
      });
      loadUsers();
    } catch (error) {
      alert(error.response?.data?.error || 'Error al eliminar usuario');
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/users/${selectedUser.id}/password`, { newPassword });
      alert('Contraseña actualizada correctamente');
      setShowPasswordModal(false);
      setNewPassword('');
      setSelectedUser(null);
    } catch (error) {
      alert(error.response?.data?.error || 'Error al cambiar contraseña');
    }
  };

  const handleChangeRole = async (e) => {
    e.preventDefault();
    try {
      await api.put(`/users/${selectedUser.id}/role`, { role: newRole }, {
        headers: {
          'x-organization-id': currentOrganization?.id,
        },
      });
      alert('Rol actualizado correctamente');
      setShowRoleModal(false);
      setNewRole('');
      setSelectedUser(null);
      loadUsers();
    } catch (error) {
      alert(error.response?.data?.error || 'Error al cambiar rol');
    }
  };

  const openPasswordModal = (user) => {
    setSelectedUser(user);
    setNewPassword('');
    setShowPasswordModal(true);
  };

  const openRoleModal = (user) => {
    setSelectedUser(user);
    setNewRole(user.role);
    setShowRoleModal(true);
  };

  const roleLabels = {
    owner: 'Dueño',
    admin: 'Administrador',
    employee: 'Empleado',
  };

  const roleColors = {
    owner: 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300',
    admin: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300',
    employee: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300',
  };

  if (!currentOrganization) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <UsersIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600 dark:text-gray-400">Selecciona una organización para ver usuarios</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Usuarios</h2>
            <p className="text-gray-600 dark:text-gray-400">
              Usuarios de
              {currentOrganization.name}
            </p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="btn btn-primary flex items-center space-x-2 shadow-lg"
          >
            <Plus className="w-5 h-5" />
            <span>Nuevo Usuario</span>
          </button>
        </div>

        <div className="card">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12">
              <UsersIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 dark:text-gray-400">No hay usuarios en esta organización</p>
            </div>
          ) : (
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                        <th>Usuario</th>
                        <th>Email</th>
                        <th>Rol</th>
                        <th>Fecha Creación</th>
                        <th className="text-center">Acciones</th>
                      </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                        <tr key={user.id}>
                            <td className="font-medium">
                              <div className="flex items-center space-x-2">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary-500 to-red-600 flex items-center justify-center text-white font-bold text-sm">
                                      {user.username.charAt(0).toUpperCase()}
                                    </div>
                                    <span className="text-gray-900 dark:text-white">{user.username}</span>
                                  </div>
                            </td>
                            <td className="text-gray-600 dark:text-gray-400">{user.email}</td>
                            <td>
                              <div className="flex items-center space-x-2">
                                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${roleColors[user.role]}`}>
                                      <Shield className="w-3 h-3 inline mr-1" />
                                      {roleLabels[user.role]}
                                    </span>
                                  </div>
                            </td>
                            <td className="text-gray-600 dark:text-gray-400">
                              {new Date(user.created_at).toLocaleDateString('es-ES')}
                            </td>
                            <td>
                              <div className="flex justify-center space-x-2">
                                    {/* Change Role Button */}
                                    <button
                                      onClick={() => openRoleModal(user)}
                                      className="p-2 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
                                      title="Cambiar rol"
                                    >
                                      <Edit2 className="w-4 h-4" />
                                    </button>
                                    {/* Change Password Button */}
                                    <button
                                      onClick={() => openPasswordModal(user)}
                                      className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                      title="Cambiar contraseña"
                                    >
                                      <Key className="w-4 h-4" />
                                    </button>
                                    {/* Delete Button */}
                                    <button
                                      onClick={() => handleDelete(user.id)}
                                      disabled={user.id === currentUser.id}
                                      className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                      title={user.id === currentUser.id ? 'No puedes eliminarte' : 'Remover de organización'}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </div>
                            </td>
                          </tr>
                      ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Modal Nuevo Usuario */}
      {showModal && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Nuevo Usuario</h3>
            <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
              <X className="w-6 h-6" />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Usuario *
              </label>
              <input
                type="text"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                className="input"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Email *
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="input"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Contraseña *
              </label>
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="input"
                required
                minLength={6}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Rol *
              </label>
              <select
                value={formData.role}
                onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                className="input"
              >
                <option value="employee">Empleado</option>
                <option value="admin">Administrador</option>
                <option value="owner">Dueño</option>
              </select>
            </div>
            <div className="flex justify-end space-x-2 pt-4">
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="btn btn-secondary"
              >
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary">
                Crear Usuario
              </button>
            </div>
          </form>
        </div>
      </div>
      )}

      {/* Modal Cambiar Contraseña */}
      {showPasswordModal && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Cambiar Contraseña</h3>
            <button onClick={() => setShowPasswordModal(false)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
              <X className="w-6 h-6" />
            </button>
          </div>
          <form onSubmit={handleChangePassword} className="p-6 space-y-4">
            <p className="text-gray-700 dark:text-gray-300">
              Usuario:
              {' '}
              <strong>{selectedUser?.username}</strong>
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nueva Contraseña * (mínimo 6 caracteres)
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="input"
                required
                minLength={6}
              />
            </div>
            <div className="flex justify-end space-x-2 pt-4">
              <button
                type="button"
                onClick={() => setShowPasswordModal(false)}
                className="btn btn-secondary"
              >
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary">
                Actualizar
              </button>
            </div>
          </form>
        </div>
      </div>
      )}

      {/* Modal Cambiar Rol */}
      {showRoleModal && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Cambiar Rol</h3>
            <button onClick={() => setShowRoleModal(false)} className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
              <X className="w-6 h-6" />
            </button>
          </div>
          <form onSubmit={handleChangeRole} className="p-6 space-y-4">
            <p className="text-gray-700 dark:text-gray-300">
              Usuario:
              {' '}
              <strong>{selectedUser?.username}</strong>
            </p>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Rol en
                {' '}
                {currentOrganization.name}
                {' '}
                *
              </label>
              <select
                value={newRole}
                onChange={(e) => setNewRole(e.target.value)}
                className="input"
              >
                <option value="employee">Empleado</option>
                <option value="admin">Administrador</option>
                <option value="owner">Dueño</option>
              </select>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
              <p className="text-sm text-blue-800 dark:text-blue-300">
                💡 El rol solo aplica para esta organización
              </p>
            </div>
            <div className="flex justify-end space-x-2 pt-4">
              <button
                type="button"
                onClick={() => setShowRoleModal(false)}
                className="btn btn-secondary"
              >
                Cancelar
              </button>
              <button type="submit" className="btn btn-primary">
                Actualizar Rol
              </button>
            </div>
          </form>
        </div>
      </div>
      )}
    </Layout>
  );
}
