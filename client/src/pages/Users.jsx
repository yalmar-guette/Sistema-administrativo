import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../api';
import { Plus, Trash2, Users as UsersIcon, Shield, Key, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Users() {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [newPassword, setNewPassword] = useState('');
    const { user: currentUser } = useAuth();
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        role: 'employee'
    });

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            const response = await api.get('/users');
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
            setFormData({ username: '', email: '', password: '', role: 'employee' });
            loadUsers();
        } catch (error) {
            alert(error.response?.data?.error || 'Error al crear usuario');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('¿Estás seguro de eliminar este usuario?')) return;
        try {
            await api.delete(`/users/${id}`);
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

    const openPasswordModal = (user) => {
        setSelectedUser(user);
        setNewPassword('');
        setShowPasswordModal(true);
    };

    const roleLabels = {
        superuser: 'Super Usuario',
        owner: 'Dueño',
        admin: 'Administrador',
        employee: 'Empleado'
    };

    const roleColors = {
        superuser: 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300',
        owner: 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300',
        admin: 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300',
        employee: 'bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300'
    };

    return (
        <Layout>
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Usuarios</h2>
                        <p className="text-gray-600 dark:text-gray-400">Gestión de usuarios del sistema</p>
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
                            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent"></div>
                        </div>
                    ) : users.length === 0 ? (
                        <div className="text-center py-12">
                            <UsersIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-600 dark:text-gray-400">No hay usuarios</p>
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
                                                    <span>{user.username}</span>
                                                </div>
                                            </td>
                                            <td className="text-gray-600 dark:text-gray-400">{user.email}</td>
                                            <td>
                                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${roleColors[user.role]}`}>
                                                    <Shield className="w-3 h-3 inline mr-1" />
                                                    {roleLabels[user.role]}
                                                </span>
                                            </td>
                                            <td className="text-gray-600 dark:text-gray-400">
                                                {new Date(user.created_at).toLocaleDateString('es-ES')}
                                            </td>
                                            <td>
                                                <div className="flex justify-center space-x-2">
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
                                                        title={user.id === currentUser.id ? 'No puedes eliminar tu propia cuenta' : 'Eliminar usuario'}
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
                            <button onClick={() => setShowModal(false)} className="text-gray-500 hover:text-gray-700">
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
                                    minLength="6"
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
                                    required
                                >
                                    <option value="employee">Empleado</option>
                                    <option value="admin">Administrador</option>
                                    <option value="owner">Dueño</option>
                                </select>
                            </div>

                            <div className="flex justify-end space-x-3 pt-4">
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
            {showPasswordModal && selectedUser && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full">
                        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 dark:text-white">Cambiar Contraseña</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                    Usuario: <span className="font-medium">{selectedUser.username}</span>
                                </p>
                            </div>
                            <button onClick={() => setShowPasswordModal(false)} className="text-gray-500 hover:text-gray-700">
                                <X className="w-6 h-6" />
                            </button>
                        </div>
                        <form onSubmit={handleChangePassword} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Nueva Contraseña *
                                </label>
                                <input
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    className="input"
                                    required
                                    minLength="6"
                                    placeholder="Mínimo 6 caracteres"
                                />
                            </div>

                            <div className="flex justify-end space-x-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowPasswordModal(false)}
                                    className="btn btn-secondary"
                                >
                                    Cancelar
                                </button>
                                <button type="submit" className="btn btn-primary flex items-center space-x-2">
                                    <Key className="w-4 h-4" />
                                    <span>Cambiar Contraseña</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </Layout>
    );
}
