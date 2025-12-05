import {
  Moon, Sun, LogOut, Menu, X, Building2, Package, ChevronDown,
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Layout({ children }) {
  const {
    user,
    logout,
    darkMode,
    toggleDarkMode,
    currentOrganization,
    currentInventory,
    inventories,
    switchOrganization,
    switchInventory,
    getCurrentRole,
  } = useAuth();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [orgDropdown, setOrgDropdown] = useState(false);
  const [invDropdown, setInvDropdown] = useState(false);

  const currentRole = getCurrentRole();

  const navItems = [
    { path: '/dashboard', label: 'Dashboard', roles: ['admin', 'owner', 'superuser', 'employee'] },
    { path: '/inventory', label: 'Inventario', roles: ['admin', 'owner', 'superuser'] },
    { path: '/sales', label: 'Ventas', roles: ['admin', 'owner', 'superuser', 'employee'] },
    { path: '/cash-close', label: 'Cierre', roles: ['admin', 'owner', 'superuser'] },
    { path: '/accounting', label: 'Contabilidad', roles: ['admin', 'owner', 'superuser'] },
    { path: '/reports', label: 'Reportes', roles: ['admin', 'owner', 'superuser'] },
    { path: '/settings', label: 'Configuración', roles: ['admin', 'owner', 'superuser'] },
    { path: '/users', label: 'Usuarios', roles: ['owner', 'superuser'] },
    { path: '/organizations', label: 'Organizaciones', roles: ['superuser'] },
  ];

  const filteredNavItems = navItems.filter((item) => user?.is_superuser || item.roles.includes(currentRole));

  const roleLabels = {
    superuser: 'Super Usuario',
    owner: 'Dueño',
    admin: 'Administrador',
    employee: 'Empleado',
  };

  const roleColors = {
    superuser: 'from-purple-500 to-pink-500',
    owner: 'from-primary-600 to-red-600',
    admin: 'from-blue-500 to-cyan-500',
    employee: 'from-green-500 to-emerald-500',
  };

  const displayRole = user?.is_superuser ? 'superuser' : currentRole;

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-black transition-colors duration-500">
      {/* Premium Header with Gradient */}
      <header className="sticky top-0 z-50 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl border-b border-gray-200 dark:border-gray-700 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo with Gradient */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-600 to-red-600 flex items-center justify-center shadow-lg transform hover:rotate-6 transition-transform duration-300">
                <span className="text-white font-bold text-xl">I</span>
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-primary-600 to-red-600 bg-clip-text text-transparent">
                  Inventario y Contabilidad
                </h1>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-1">
              {filteredNavItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-4 py-2 rounded-lg font-medium transition-all duration-300 ${location.pathname === item.path
                    ? 'bg-gradient-to-r from-primary-600 to-red-600 text-white shadow-lg scale-105'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:scale-105'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            {/* Controls */}
            <div className="flex items-center space-x-3">
              {/* User Info - Desktop */}
              {(user?.is_superuser || getCurrentRole() === 'owner') ? (
                <Link
                  to="/profile"
                  className="hidden md:flex items-center space-x-3 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors cursor-pointer"
                  title="Ver mi perfil"
                >
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{user?.username}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400">{roleLabels[displayRole]}</p>
                  </div>
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${roleColors[displayRole]} flex items-center justify-center text-white font-bold shadow-md`}>
                    {user?.username?.charAt(0).toUpperCase()}
                  </div>
                </Link>
              ) : (
                <div className="hidden md:flex items-center space-x-3 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-xl">
                  <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">{user?.username}</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">{roleLabels[displayRole]}</p>
                      </div>
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${roleColors[displayRole]} flex items-center justify-center text-white font-bold shadow-md`}>
                        {user?.username?.charAt(0).toUpperCase()}
                      </div>
                </div>
              )}

              {/* Dark Mode Toggle */}
              <button
                onClick={toggleDarkMode}
                className="p-2.5 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all duration-300 group"
                title={darkMode ? 'Modo claro' : 'Modo oscuro'}
              >
                {darkMode ? (
                  <Sun className="w-5 h-5 text-yellow-500 group-hover:rotate-180 transition-transform duration-500" />
                ) : (
                  <Moon className="w-5 h-5 text-gray-600 group-hover:rotate-12 transition-transform duration-300" />
                )}
              </button>

              {/* Logout - Desktop */}
              <button
                onClick={logout}
                className="hidden md:flex items-center space-x-2 px-4 py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all duration-300 shadow-md hover:shadow-lg transform hover:scale-105"
              >
                <LogOut className="w-4 h-4" />
                <span className="font-medium">Salir</span>
              </button>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className="md:hidden p-2.5 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
              >
                {menuOpen ? (
                  <X className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                ) : (
                  <Menu className="w-6 h-6 text-gray-600 dark:text-gray-300" />
                )}
              </button>
            </div>
          </div>

          {/* Organization/Inventory Selectors */}
          {(currentOrganization || user?.is_superuser) && (
          <div className="hidden md:flex items-center space-x-4 pb-3 -mt-1">
            {/* Organization Selector */}
            <div className="relative">
              <button
                onClick={() => { setOrgDropdown(!orgDropdown); setInvDropdown(false); }}
                className="flex items-center space-x-2 px-3 py-1.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg text-sm font-medium hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors"
              >
                <Building2 className="w-4 h-4" />
                <span>{currentOrganization?.name || 'Sin organización'}</span>
                <ChevronDown className="w-4 h-4" />
              </button>
              {orgDropdown && user?.organizations?.length > 0 && (
              <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl py-1 min-w-[200px] z-50">
                {user.organizations.map((org) => (
                        <button
                          key={org.id}
                          onClick={() => { switchOrganization(org); setOrgDropdown(false); }}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${currentOrganization?.id === org.id ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300' : ''
                              }`}
                        >
                          {org.name}
                          <span className="ml-2 text-xs text-gray-400">{org.role}</span>
                        </button>
                      ))}
              </div>
              )}
            </div>

            {/* Inventory Selector */}
            {currentOrganization && (
            <div className="relative">
              <button
                onClick={() => { setInvDropdown(!invDropdown); setOrgDropdown(false); }}
                className="flex items-center space-x-2 px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg text-sm font-medium hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
              >
                <Package className="w-4 h-4" />
                <span>{currentInventory?.name || 'Sin inventario'}</span>
                <ChevronDown className="w-4 h-4" />
              </button>
              {invDropdown && inventories.length > 0 && (
              <div className="absolute top-full left-0 mt-1 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-xl py-1 min-w-[200px] z-50">
                      {inventories.map((inv) => (
                        <button
                          key={inv.id}
                          onClick={() => { switchInventory(inv); setInvDropdown(false); }}
                          className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${currentInventory?.id === inv.id ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' : ''
                              }`}
                        >
                              {inv.name}
                            </button>
                      ))}
                    </div>
              )}
            </div>
            )}
          </div>
          )}

          {/* Mobile Menu */}
          {menuOpen && (
          <div className="md:hidden py-4 border-t border-gray-200 dark:border-gray-700 animate-fade-in">
            {/* User Info - Mobile */}
            <div className="flex items-center space-x-3 px-4 py-3 mb-4 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-xl">
              <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${roleColors[displayRole]} flex items-center justify-center text-white font-bold text-lg shadow-md`}>
                {user?.username?.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">{user?.username}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">{roleLabels[displayRole]}</p>
              </div>
            </div>

            {/* Mobile Org/Inv Selectors */}
            {currentOrganization && (
            <div className="flex flex-col space-y-2 mb-4 px-4">
              <div className="flex items-center space-x-2 text-sm text-purple-600 dark:text-purple-400">
                <Building2 className="w-4 h-4" />
                <span className="font-medium">{currentOrganization.name}</span>
              </div>
              {currentInventory && (
              <div className="flex items-center space-x-2 text-sm text-blue-600 dark:text-blue-400">
                      <Package className="w-4 h-4" />
                      <span className="font-medium">{currentInventory.name}</span>
                    </div>
              )}
            </div>
            )}

            {/* Nav Items */}
            <div className="flex flex-col space-y-2 mb-4">
              {filteredNavItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMenuOpen(false)}
                  className={`px-4 py-3 rounded-lg font-medium transition-all ${location.pathname === item.path
                          ? 'bg-gradient-to-r from-primary-600 to-red-600 text-white shadow-md'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                        }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>

            {/* Logout - Mobile */}
            <button
              onClick={logout}
              className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:from-red-600 hover:to-red-700 transition-all shadow-md"
            >
              <LogOut className="w-4 h-4" />
              <span className="font-medium">Cerrar Sesión</span>
            </button>
          </div>
          )}
        </div>
      </header>

      {/* Main Content with padding */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Custom animations */}
      <style>
        {`
                @keyframes fade-in {
                    from {
                        opacity: 0;
                        transform: translateY(-10px);
                    }
                    to {
                        opacity: 1;
                        transform: translateY(0);
                    }
                }

                .animate-fade-in {
                    animation: fade-in 0.3s ease-out;
                }
            `}
      </style>
    </div>
  );
}
