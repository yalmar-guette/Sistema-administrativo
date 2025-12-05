import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../api';
import { Package, DollarSign, TrendingUp, ShoppingCart, Building2, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Link } from 'react-router-dom';

export default function Dashboard() {
    const { user, currentOrganization, currentInventory } = useAuth();
    const [stats, setStats] = useState({
        totalProducts: 0,
        totalValue: 0,
        lowStock: 0,
        totalSales: 0,
        totalSalesRevenue: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (currentInventory) {
            loadDashboardData();
        } else {
            setLoading(false);
        }
    }, [currentInventory]);

    const loadDashboardData = async () => {
        try {
            const [productsRes, salesRes] = await Promise.all([
                api.get('/inventory'),
                api.get('/sales')
            ]);

            const products = productsRes.data;
            const sales = salesRes.data;

            const totalValue = products.reduce((sum, p) => sum + (parseInt(p.quantity) * parseFloat(p.unit_price)), 0);
            const lowStockCount = products.filter(p => parseInt(p.quantity) < 10).length;
            const totalSalesRevenue = sales.reduce((sum, s) => sum + parseFloat(s.total_usd), 0);

            setStats({
                totalProducts: products.length,
                totalValue,
                lowStock: lowStockCount,
                totalSales: sales.length,
                totalSalesRevenue
            });
        } catch (error) {
            console.error('Error loading dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    // If user has no organizations
    if (!loading && (!user?.organizations || user.organizations.length === 0) && !user?.is_superuser) {
        return (
            <Layout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="text-center max-w-md">
                        <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                            Sin Acceso a Organizaciones
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                            Tu usuario no está asignado a ninguna organización. Por favor contacta al administrador para que te asigne a una organización.
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-500">
                            Usuario: <strong className="text-gray-900 dark:text-white">{user?.username}</strong>
                        </p>
                    </div>
                </div>
            </Layout>
        );
    }

    // If user has orgs but no inventory selected
    if (!loading && currentOrganization && !currentInventory) {
        return (
            <Layout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="text-center max-w-md">
                        <Building2 className="w-16 h-16 text-blue-500 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                            Selecciona un Inventario
                        </h2>
                        <p className="text-gray-600 dark:text-gray-400 mb-4">
                            La organización <strong>{currentOrganization.name}</strong> no tiene inventarios.
                        </p>
                        <Link to="/organizations" className="btn btn-primary inline-flex items-center">
                            Ir a Organizaciones
                        </Link>
                    </div>
                </div>
            </Layout>
        );
    }

    if (loading) {
        return (
            <Layout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-600 border-t-transparent"></div>
                </div>
            </Layout>
        );
    }

    const statCards = [
        {
            title: 'Total Productos',
            value: stats.totalProducts,
            icon: Package,
            color: 'from-blue-500 to-cyan-500',
            bgColor: 'bg-blue-50 dark:bg-blue-900/20',
            textColor: 'text-blue-600 dark:text-blue-400'
        },
        {
            title: 'Valor Inventario',
            value: `$${stats.totalValue.toFixed(2)}`,
            icon: DollarSign,
            color: 'from-green-500 to-emerald-500',
            bgColor: 'bg-green-50 dark:bg-green-900/20',
            textColor: 'text-green-600 dark:text-green-400'
        },
        {
            title: 'Stock Bajo',
            value: stats.lowStock,
            icon: AlertCircle,
            color: 'from-yellow-500 to-orange-500',
            bgColor: 'bg-yellow-50 dark:bg-yellow-900/20',
            textColor: 'text-yellow-600 dark:text-yellow-400'
        },
        {
            title: 'Total Ventas',
            value: stats.totalSales,
            icon: ShoppingCart,
            color: 'from-purple-500 to-pink-500',
            bgColor: 'bg-purple-50 dark:bg-purple-900/20',
            textColor: 'text-purple-600 dark:text-purple-400'
        },
        {
            title: 'Ingresos Ventas',
            value: `$${stats.totalSalesRevenue.toFixed(2)}`,
            icon: TrendingUp,
            color: 'from-primary-500 to-red-500',
            bgColor: 'bg-red-50 dark:bg-red-900/20',
            textColor: 'text-red-600 dark:text-red-400'
        }
    ];

    return (
        <Layout>
            <div className="space-y-6">
                {/* Welcome Section */}
                <div className="bg-gradient-to-r from-primary-600 to-red-600 rounded-2xl p-8 text-white shadow-xl">
                    <h1 className="text-4xl font-bold mb-2">Bienvenido, {user?.username}! 👋</h1>
                    <p className="text-white/90 text-lg">
                        {currentOrganization?.name} - {currentInventory?.name}
                    </p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
                    {statCards.map((stat, index) => {
                        const Icon = stat.icon;
                        return (
                            <div
                                key={index}
                                className={`${stat.bgColor} rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105`}
                            >
                                <div className="flex items-center justify-between mb-4">
                                    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-md`}>
                                        <Icon className="w-7 h-7 text-white" />
                                    </div>
                                </div>
                                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">
                                    {stat.title}
                                </h3>
                                <p className={`text-3xl font-bold ${stat.textColor}`}>
                                    {stat.value}
                                </p>
                            </div>
                        );
                    })}
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <Link
                        to="/inventory"
                        className="card hover:shadow-xl transition-all duration-300 transform hover:scale-105 cursor-pointer group"
                    >
                        <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Package className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900 dark:text-white">Inventario</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Gestionar productos</p>
                            </div>
                        </div>
                    </Link>

                    <Link
                        to="/sales"
                        className="card hover:shadow-xl transition-all duration-300 transform hover:scale-105 cursor-pointer group"
                    >
                        <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <ShoppingCart className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900 dark:text-white">Ventas</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Registrar ventas</p>
                            </div>
                        </div>
                    </Link>

                    <Link
                        to="/cash-close"
                        className="card hover:shadow-xl transition-all duration-300 transform hover:scale-105 cursor-pointer group"
                    >
                        <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <TrendingUp className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900 dark:text-white">Cierre</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Cierre de caja</p>
                            </div>
                        </div>
                    </Link>

                    <Link
                        to="/reports"
                        className="card hover:shadow-xl transition-all duration-300 transform hover:scale-105 cursor-pointer group"
                    >
                        <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary-500 to-red-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <TrendingUp className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <h3 className="font-semibold text-gray-900 dark:text-white">Reportes</h3>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Ver reportes</p>
                            </div>
                        </div>
                    </Link>
                </div>
            </div>
        </Layout>
    );
}
