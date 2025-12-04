import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../api';
import { Package, DollarSign, TrendingUp, ShoppingCart, Users, BarChart3, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export default function Dashboard() {
    const [stats, setStats] = useState({
        totalProducts: 0,
        totalValue: 0,
        lowStock: 0,
        totalTransactions: 0,
        totalRevenue: 0,
        totalExpenses: 0,
        totalSales: 0,
        totalSalesRevenue: 0
    });
    const [loading, setLoading] = useState(true);
    const [recentActivity, setRecentActivity] = useState([]);

    useEffect(() => {
        loadDashboardData();
    }, []);

    const loadDashboardData = async () => {
        try {
            const [productsRes, accountingRes, salesRes] = await Promise.all([
                api.get('/inventory'),
                api.get('/accounting'),
                api.get('/sales')
            ]);

            const products = productsRes.data;
            const transactions = accountingRes.data;
            const sales = salesRes.data;

            const totalValue = products.reduce((sum, p) => sum + (parseInt(p.quantity) * parseFloat(p.unit_price)), 0);
            const lowStockCount = products.filter(p => parseInt(p.quantity) < 10).length;

            const revenue = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + parseFloat(t.amount), 0);
            const expenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + parseFloat(t.amount), 0);

            const totalSalesRevenue = sales.reduce((sum, s) => sum + parseFloat(s.total_usd), 0);

            setStats({
                totalProducts: products.length,
                totalValue,
                lowStock: lowStockCount,
                totalTransactions: transactions.length,
                totalRevenue: revenue,
                totalExpenses: expenses,
                totalSales: sales.length,
                totalSalesRevenue
            });

            // Get recent activity (last 5 items)
            const recentSales = sales.slice(0, 3).map(s => ({
                type: 'sale',
                description: `Venta ${s.sale_number} - ${s.customer_name || 'Cliente'}`,
                amount: parseFloat(s.total_usd) || 0,
                date: s.date
            }));
            setRecentActivity(recentSales);

        } catch (error) {
            console.error('Error loading dashboard:', error);
        } finally {
            setLoading(false);
        }
    };

    const statCards = [
        {
            title: 'Total Productos',
            value: stats.totalProducts,
            icon: Package,
            gradient: 'from-blue-500 to-cyan-500',
            bgLight: 'bg-blue-50 dark:bg-blue-900/20',
            textColor: 'text-blue-600 dark:text-blue-400',
            change: null
        },
        {
            title: 'Valor Inventario',
            value: `$${stats.totalValue.toFixed(2)}`,
            icon: DollarSign,
            gradient: 'from-green-500 to-emerald-500',
            bgLight: 'bg-green-50 dark:bg-green-900/20',
            textColor: 'text-green-600 dark:text-green-400',
            change: null
        },
        {
            title: 'Total Ventas',
            value: stats.totalSales,
            icon: ShoppingCart,
            gradient: 'from-purple-500 to-pink-500',
            bgLight: 'bg-purple-50 dark:bg-purple-900/20',
            textColor: 'text-purple-600 dark:text-purple-400',
            change: null
        },
        {
            title: 'Ingresos Ventas',
            value: `$${stats.totalSalesRevenue.toFixed(2)}`,
            icon: TrendingUp,
            gradient: 'from-primary-500 to-red-500',
            bgLight: 'bg-primary-50 dark:bg-primary-900/20',
            textColor: 'text-primary-600 dark:text-primary-400',
            change: null
        }
    ];

    const financialCards = [
        {
            title: 'Ingresos Totales',
            value: `$${stats.totalRevenue.toFixed(2)}`,
            icon: ArrowUpRight,
            color: 'text-green-600 dark:text-green-400',
            bg: 'bg-green-50 dark:bg-green-900/20',
            border: 'border-green-200 dark:border-green-800'
        },
        {
            title: 'Gastos Totales',
            value: `$${stats.totalExpenses.toFixed(2)}`,
            icon: ArrowDownRight,
            color: 'text-red-600 dark:text-red-400',
            bg: 'bg-red-50 dark:bg-red-900/20',
            border: 'border-red-200 dark:border-red-800'
        },
        {
            title: 'Balance',
            value: `$${(stats.totalRevenue - stats.totalExpenses).toFixed(2)}`,
            icon: BarChart3,
            color: 'text-blue-600 dark:text-blue-400',
            bg: 'bg-blue-50 dark:bg-blue-900/20',
            border: 'border-blue-200 dark:border-blue-800'
        }
    ];

    if (loading) {
        return (
            <Layout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-600 border-t-transparent mx-auto mb-4"></div>
                        <p className="text-gray-600 dark:text-gray-400">Cargando estadísticas...</p>
                    </div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="space-y-6">
                {/* Welcome Header */}
                <div className="bg-gradient-to-r from-primary-600 to-red-600 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
                    <div className="absolute inset-0 bg-white/5 bg-[radial-gradient(circle_at_50%_120%,rgba(255,255,255,0.1),transparent)]"></div>
                    <div className="relative">
                        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
                        <p className="text-white/90">Resumen general del sistema</p>
                    </div>
                    {/* Decorative element */}
                    <div className="absolute -right-10 -bottom-10 w-40 h-40 bg-white/10 rounded-full blur-2xl"></div>
                </div>

                {/* Main Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {statCards.map((card, index) => {
                        const Icon = card.icon;
                        return (
                            <div
                                key={index}
                                className="group bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 dark:border-gray-700 hover:scale-105 cursor-pointer relative overflow-hidden"
                            >
                                {/* Gradient overlay on hover */}
                                <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`}></div>

                                <div className="relative">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className={`p-3 rounded-xl ${card.bgLight} group-hover:scale-110 transition-transform duration-300`}>
                                            <Icon className={`w-6 h-6 ${card.textColor}`} />
                                        </div>
                                        {card.change && (
                                            <span className="text-xs font-semibold text-green-600 dark:text-green-400">{card.change}</span>
                                        )}
                                    </div>
                                    <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">{card.title}</h3>
                                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{card.value}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Financial Overview */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {financialCards.map((card, index) => {
                        const Icon = card.icon;
                        return (
                            <div
                                key={index}
                                className={`${card.bg} rounded-2xl p-6 border-2 ${card.border} hover:shadow-xl transition-all duration-300 hover:scale-105`}
                            >
                                <div className="flex items-center justify-between mb-3">
                                    <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300">{card.title}</h3>
                                    <Icon className={`w-5 h-5 ${card.color}`} />
                                </div>
                                <p className={`text-3xl font-bold ${card.color}`}>{card.value}</p>
                            </div>
                        );
                    })}
                </div>

                {/* Recent Activity & Alerts Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Recent Activity */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Actividad Reciente</h2>
                            <ShoppingCart className="w-5 h-5 text-gray-400" />
                        </div>
                        <div className="space-y-4">
                            {recentActivity.length > 0 ? (
                                recentActivity.map((activity, index) => (
                                    <div
                                        key={index}
                                        className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-900/50 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-900 transition-colors duration-200"
                                    >
                                        <div className="flex items-center space-x-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary-500 to-red-500 flex items-center justify-center text-white font-bold">
                                                {activity.type === 'sale' ? 'V' : 'T'}
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-900 dark:text-white">{activity.description}</p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(activity.date).toLocaleDateString('es-ES')}</p>
                                            </div>
                                        </div>
                                        <span className="text-sm font-bold text-green-600 dark:text-green-400">${(parseFloat(activity.amount) || 0).toFixed(2)}</span>
                                    </div>
                                ))
                            ) : (
                                <p className="text-center text-gray-500 dark:text-gray-400 py-8">No hay actividad reciente</p>
                            )}
                        </div>
                    </div>

                    {/* Alerts */}
                    <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg border border-gray-100 dark:border-gray-700">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">Alertas</h2>
                            <Package className="w-5 h-5 text-gray-400" />
                        </div>
                        <div className="space-y-4">
                            {stats.lowStock > 0 && (
                                <div className="p-4 bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-500 rounded-lg">
                                    <div className="flex items-start">
                                        <div className="flex-shrink-0">
                                            <Package className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                                        </div>
                                        <div className="ml-3">
                                            <h3 className="text-sm font-semibold text-yellow-800 dark:text-yellow-300">Stock Bajo</h3>
                                            <p className="text-sm text-yellow-700 dark:text-yellow-400 mt-1">
                                                {stats.lowStock} producto{stats.lowStock > 1 ? 's' : ''} con menos de 10 unidades
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="p-4 bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 rounded-lg">
                                <div className="flex items-start">
                                    <div className="flex-shrink-0">
                                        <TrendingUp className="w-5 h-5 text-green-600 dark:text-green-400" />
                                    </div>
                                    <div className="ml-3">
                                        <h3 className="text-sm font-semibold text-green-800 dark:text-green-300">Sistema Operativo</h3>
                                        <p className="text-sm text-green-700 dark:text-green-400 mt-1">
                                            Todos los sistemas funcionando correctamente
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
