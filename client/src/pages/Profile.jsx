import { useState } from 'react';
import Layout from '../components/Layout';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { User, Key, Mail, Save, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Profile() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [profileData, setProfileData] = useState({
        username: user?.username || '',
        email: user?.email || ''
    });
    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });

    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            await api.put(`/users/${user.id}`, profileData);
            alert('Perfil actualizado correctamente. Por favor inicia sesión nuevamente.');
            logout();
        } catch (error) {
            alert(error.response?.data?.error || 'Error al actualizar perfil');
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async (e) => {
        e.preventDefault();

        if (passwordData.newPassword !== passwordData.confirmPassword) {
            alert('Las contraseñas no coinciden');
            return;
        }

        if (passwordData.newPassword.length < 6) {
            alert('La contraseña debe tener al menos 6 caracteres');
            return;
        }

        setLoading(true);
        try {
            await api.put(`/users/${user.id}/password`, {
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword
            });
            alert('Contraseña actualizada correctamente. Por favor inicia sesión nuevamente.');
            logout();
        } catch (error) {
            alert(error.response?.data?.error || 'Error al cambiar contraseña');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Layout>
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Mi Perfil</h2>
                        <p className="text-gray-600 dark:text-gray-400">Actualiza tu información personal y contraseña</p>
                    </div>
                    <button
                        onClick={() => navigate(-1)}
                        className="btn btn-secondary flex items-center space-x-2"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Volver</span>
                    </button>
                </div>

                {/* Profile Info Card */}
                <div className="card">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                        <User className="w-5 h-5 mr-2" />
                        Información Personal
                    </h3>
                    <form onSubmit={handleUpdateProfile} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Nombre de Usuario *
                            </label>
                            <input
                                type="text"
                                value={profileData.username}
                                onChange={(e) => setProfileData({ ...profileData, username: e.target.value })}
                                className="input"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Email *
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                                <input
                                    type="email"
                                    value={profileData.email}
                                    onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                                    className="input pl-10"
                                    required
                                />
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={loading}
                                className="btn btn-primary flex items-center space-x-2"
                            >
                                <Save className="w-4 h-4" />
                                <span>{loading ? 'Guardando...' : 'Guardar Cambios'}</span>
                            </button>
                        </div>
                    </form>
                </div>

                {/* Change Password Card */}
                <div className="card">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                        <Key className="w-5 h-5 mr-2" />
                        Cambiar Contraseña
                    </h3>
                    <form onSubmit={handleChangePassword} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Contraseña Actual *
                            </label>
                            <input
                                type="password"
                                value={passwordData.currentPassword}
                                onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                                className="input"
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Nueva Contraseña * (mínimo 6 caracteres)
                            </label>
                            <input
                                type="password"
                                value={passwordData.newPassword}
                                onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                                className="input"
                                required
                                minLength={6}
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                Confirmar Nueva Contraseña *
                            </label>
                            <input
                                type="password"
                                value={passwordData.confirmPassword}
                                onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                                className="input"
                                required
                                minLength={6}
                            />
                        </div>

                        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                            <p className="text-sm text-yellow-800 dark:text-yellow-300">
                                ⚠️ Al cambiar tu contraseña, se cerrará tu sesión y tendrás que iniciar sesión nuevamente.
                            </p>
                        </div>

                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={loading}
                                className="btn btn-primary flex items-center space-x-2"
                            >
                                <Key className="w-4 h-4" />
                                <span>{loading ? 'Actualizando...' : 'Cambiar Contraseña'}</span>
                            </button>
                        </div>
                    </form>
                </div>

                {/* User Info Display */}
                <div className="card bg-gradient-to-r from-primary-50 to-red-50 dark:from-primary-900/20 dark:to-red-900/20">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">Información de Cuenta</h3>
                    <div className="space-y-2 text-sm">
                        <p className="text-gray-700 dark:text-gray-300">
                            <strong>Usuario:</strong> {user?.username}
                        </p>
                        <p className="text-gray-700 dark:text-gray-300">
                            <strong>Email:</strong> {user?.email}
                        </p>
                        {user?.is_superuser && (
                            <p className="text-gray-700 dark:text-gray-300">
                                <strong>Tipo:</strong> <span className="text-purple-600 dark:text-purple-400 font-semibold">Super Usuario</span>
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </Layout>
    );
}
