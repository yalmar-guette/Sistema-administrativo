import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { LogIn, Moon, Sun, Package } from 'lucide-react';

export default function Login() {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login, darkMode, toggleDarkMode } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await login(username, password);
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.error || 'Error al iniciar sesión');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen relative overflow-hidden flex items-center justify-center p-4">
            {/* Animated Background with Gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-red-500 via-primary-600 to-red-700 dark:from-gray-900 dark:via-gray-800 dark:to-black transition-colors duration-500">
                {/* Animated floating shapes */}
                <div className="absolute top-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-0 right-0 w-96 h-96 bg-red-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
            </div>

            {/* Dark Mode Toggle */}
            <button
                onClick={toggleDarkMode}
                className="absolute top-6 right-6 p-3 rounded-xl bg-white/10 backdrop-blur-md hover:bg-white/20 transition-all duration-300 shadow-xl border border-white/20 z-10 group"
                title={darkMode ? 'Modo claro' : 'Modo oscuro'}
            >
                {darkMode ? (
                    <Sun className="w-6 h-6 text-yellow-300 group-hover:rotate-180 transition-transform duration-500" />
                ) : (
                    <Moon className="w-6 h-6 text-white group-hover:rotate-12 transition-transform duration-300" />
                )}
            </button>

            {/* Login Card with Glass morphism */}
            <div className="relative z-10 w-full max-w-md transform transition-all duration-500 hover:scale-[1.01]">
                <div className="bg-white/95 dark:bg-gray-800/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 dark:border-gray-700/50 overflow-hidden">
                    {/* Premium Header */}
                    <div className="relative bg-gradient-to-r from-primary-600 to-red-600 p-8 text-center overflow-hidden">
                        {/* Subtle pattern overlay */}
                        <div className="absolute inset-0 bg-white/5 bg-[radial-gradient(circle_at_50%_120%,rgba(255,255,255,0.1),transparent)]"></div>

                        <div className="relative">
                            {/* Icon with glow effect */}
                            <div className="inline-flex items-center justify-center w-20 h-20 bg-white/20 backdrop-blur-md rounded-2xl mb-4 shadow-2xl border border-white/30 transform hover:rotate-6 transition-transform duration-300">
                                <Package className="w-10 h-10 text-white drop-shadow-lg" />
                            </div>
                            <h1 className="text-3xl font-bold text-white mb-2 drop-shadow-md">Bienvenido</h1>
                            <p className="text-white/90 text-sm font-medium">Sistema de Inventario y Contabilidad</p>
                        </div>
                    </div>

                    {/* Form Section */}
                    <form onSubmit={handleSubmit} className="p-8 space-y-6">
                        {/* Error Alert with animation */}
                        {error && (
                            <div className="bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500 p-4 rounded-lg animate-shake">
                                <p className="text-red-700 dark:text-red-400 text-sm font-medium flex items-center">
                                    <span className="w-2 h-2 bg-red-500 rounded-full mr-2 animate-ping"></span>
                                    {error}
                                </p>
                            </div>
                        )}

                        {/* Username Input */}
                        <div className="space-y-2 group">
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 transition-colors">
                                Usuario
                            </label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-300 text-gray-900 dark:text-white placeholder-gray-400 group-hover:border-gray-300 dark:group-hover:border-gray-600"
                                placeholder="Ingresa tu usuario"
                                required
                                autoFocus
                            />
                        </div>

                        {/* Password Input */}
                        <div className="space-y-2 group">
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 transition-colors">
                                Contraseña
                            </label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-900/50 border-2 border-gray-200 dark:border-gray-700 rounded-xl focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 transition-all duration-300 text-gray-900 dark:text-white placeholder-gray-400 group-hover:border-gray-300 dark:group-hover:border-gray-600"
                                placeholder="Ingresa tu contraseña"
                                required
                            />
                        </div>

                        {/* Submit Button with Loading State */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-primary-600 to-red-600 hover:from-primary-700 hover:to-red-700 text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-2xl transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none relative overflow-hidden group"
                        >
                            {/* Button glow effect */}
                            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>

                            {loading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    <span className="relative">Iniciando sesión...</span>
                                </>
                            ) : (
                                <>
                                    <LogIn className="w-5 h-5 relative" />
                                    <span className="relative">Iniciar Sesión</span>
                                </>
                            )}
                        </button>

                        {/* Default Credentials Display */}
                        <div className="mt-6 p-4 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800/50 dark:to-gray-900/50 rounded-xl border border-gray-200 dark:border-gray-700 backdrop-blur-sm">
                            <p className="text-xs text-gray-500 dark:text-gray-400 text-center mb-3 font-semibold uppercase tracking-wide">
                                Credenciales por defecto
                            </p>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between px-3 py-2 bg-white dark:bg-gray-800 rounded-lg">
                                    <span className="text-sm text-gray-600 dark:text-gray-400">Usuario:</span>
                                    <code className="px-3 py-1 bg-primary-50 dark:bg-primary-900/30 rounded-lg font-mono text-sm text-primary-600 dark:text-primary-400 font-bold border border-primary-200 dark:border-primary-800">superuser</code>
                                </div>
                                <div className="flex items-center justify-between px-3 py-2 bg-white dark:bg-gray-800 rounded-lg">
                                    <span className="text-sm text-gray-600 dark:text-gray-400">Contraseña:</span>
                                    <code className="px-3 py-1 bg-primary-50 dark:bg-primary-900/30 rounded-lg font-mono text-sm text-primary-600 dark:text-primary-400 font-bold border border-primary-200 dark:border-primary-800">admin123</code>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>

                {/* Footer Text */}
                <p className="text-center mt-6 text-white/90 text-sm font-medium drop-shadow-md">
                    🔒 Sistema seguro y confiable
                </p>
            </div>

            {/* Custom Animations */}
            <style>{`
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-8px); }
                    50% { transform: translateX(8px); }
                    75% { transform: translateX(-4px); }
                }

                .animate-shake {
                    animation: shake 0.4s ease-in-out;
                }

                @keyframes float {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-10px); }
                }
            `}</style>
        </div>
    );
}
