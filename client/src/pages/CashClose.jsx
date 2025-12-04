import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../api';
import { Save, FileText, Download, History, Box } from 'lucide-react';

// Helper function to format quantity as boxes + units
function formatQuantity(quantity, unitsPerBox) {
    const qty = parseInt(quantity) || 0;
    const upb = parseInt(unitsPerBox) || 1;

    if (upb <= 1) return `${qty} Unds`;

    const boxes = Math.floor(qty / upb);
    const units = qty % upb;

    return `${boxes} Cjs / ${units} Unds`;
}

// Parse boxes and units to total quantity
function parseToQuantity(boxes, units, unitsPerBox) {
    return (parseInt(boxes) || 0) * (parseInt(unitsPerBox) || 1) + (parseInt(units) || 0);
}

export default function CashClose() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [counts, setCounts] = useState({});
    const [history, setHistory] = useState([]);
    const [showHistory, setShowHistory] = useState(false);
    const [exchangeRate, setExchangeRate] = useState(50);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [productsRes, historyRes, rateRes] = await Promise.all([
                api.get('/cash-close/products'),
                api.get('/cash-close/history'),
                api.get('/settings/exchange-rate')
            ]);
            setProducts(productsRes.data);
            setHistory(historyRes.data);
            setExchangeRate(parseFloat(rateRes.data.exchange_rate) || 50);

            // Initialize counts with system quantities
            const initialCounts = {};
            productsRes.data.forEach(p => {
                const upb = parseInt(p.units_per_box) || 1;
                const qty = parseInt(p.quantity) || 0;
                initialCounts[p.id] = {
                    boxes: Math.floor(qty / upb),
                    units: qty % upb
                };
            });
            setCounts(initialCounts);
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCountChange = (productId, field, value) => {
        setCounts(prev => ({
            ...prev,
            [productId]: {
                ...prev[productId],
                [field]: parseInt(value) || 0
            }
        }));
    };

    const calculateDifference = (product) => {
        const systemQty = parseInt(product.quantity) || 0;
        const upb = parseInt(product.units_per_box) || 1;
        const count = counts[product.id] || { boxes: 0, units: 0 };
        const physicalQty = parseToQuantity(count.boxes, count.units, upb);
        return systemQty - physicalQty;
    };

    const getTotalDifference = () => {
        return products.reduce((sum, p) => sum + Math.abs(calculateDifference(p)), 0);
    };

    const handleSave = async () => {
        if (!confirm('¿Guardar cierre de caja? Esto actualizará el inventario con el conteo físico.')) return;

        setSaving(true);
        try {
            const items = products.map(p => {
                const upb = parseInt(p.units_per_box) || 1;
                const count = counts[p.id] || { boxes: 0, units: 0 };
                const physicalQty = parseToQuantity(count.boxes, count.units, upb);

                return {
                    product_id: p.id,
                    product_name: p.name,
                    system_quantity: parseInt(p.quantity) || 0,
                    physical_quantity: physicalQty,
                    units_per_box: upb
                };
            });

            await api.post('/cash-close', { items });
            alert('Cierre guardado exitosamente');
            loadData();
        } catch (error) {
            alert(error.response?.data?.error || 'Error al guardar cierre');
        } finally {
            setSaving(false);
        }
    };

    const exportToCSV = () => {
        let csv = 'Producto,Stock Sistema,Conteo Fisico,Diferencia\n';
        products.forEach(p => {
            const upb = parseInt(p.units_per_box) || 1;
            const count = counts[p.id] || { boxes: 0, units: 0 };
            const physicalQty = parseToQuantity(count.boxes, count.units, upb);
            const diff = calculateDifference(p);
            csv += `${p.name},${p.quantity},${physicalQty},${diff}\n`;
        });

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cierre-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    if (loading) {
        return (
            <Layout>
                <div className="flex items-center justify-center min-h-[60vh]">
                    <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary-600 border-t-transparent"></div>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                    <div>
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Cierre de Caja</h2>
                        <p className="text-gray-600 dark:text-gray-400">
                            Introduce el conteo físico para cada producto. El sistema calculará la diferencia.
                        </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => setShowHistory(!showHistory)}
                            className="btn btn-secondary flex items-center space-x-2"
                        >
                            <History className="w-4 h-4" />
                            <span>Historial</span>
                        </button>
                        <button
                            onClick={exportToCSV}
                            className="btn bg-green-600 hover:bg-green-700 text-white flex items-center space-x-2"
                        >
                            <Download className="w-4 h-4" />
                            <span>Exportar CSV</span>
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="btn btn-primary flex items-center space-x-2"
                        >
                            <Save className="w-4 h-4" />
                            <span>{saving ? 'Guardando...' : 'Guardar Cierre'}</span>
                        </button>
                    </div>
                </div>

                {/* History Modal */}
                {showHistory && (
                    <div className="card bg-gray-50 dark:bg-gray-900">
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-3">Historial de Cierres</h3>
                        {history.length === 0 ? (
                            <p className="text-gray-500">No hay cierres anteriores</p>
                        ) : (
                            <div className="table-container">
                                <table className="table text-sm">
                                    <thead>
                                        <tr>
                                            <th>Fecha</th>
                                            <th className="text-right">Productos</th>
                                            <th className="text-right">Diferencia Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {history.map((h, i) => (
                                            <tr key={i}>
                                                <td>{new Date(h.close_date).toLocaleDateString('es-ES')}</td>
                                                <td className="text-right">{h.products_count}</td>
                                                <td className={`text-right font-bold ${h.total_difference > 0 ? 'text-red-600' : 'text-green-600'}`}>
                                                    {h.total_difference}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {/* Products Table */}
                <div className="card">
                    <div className="table-container">
                        <table className="table">
                            <thead>
                                <tr>
                                    <th>Producto</th>
                                    <th className="text-right">Precio $</th>
                                    <th className="text-right">Precio Bs</th>
                                    <th className="text-center">Stock Sistema</th>
                                    <th className="text-center">Conteo Físico</th>
                                    <th className="text-center">Diferencia</th>
                                </tr>
                            </thead>
                            <tbody>
                                {products.map((product) => {
                                    const upb = parseInt(product.units_per_box) || 1;
                                    const count = counts[product.id] || { boxes: 0, units: 0 };
                                    const diff = calculateDifference(product);
                                    const price = parseFloat(product.unit_price) || 0;
                                    const priceBs = price * exchangeRate;

                                    return (
                                        <tr key={product.id}>
                                            <td className="font-medium">{product.name}</td>
                                            <td className="text-right font-semibold">${price.toFixed(2)}</td>
                                            <td className="text-right font-semibold text-primary-600 dark:text-primary-400">{priceBs.toFixed(2)} Bs</td>
                                            <td className="text-center">
                                                <span className="font-semibold">{formatQuantity(product.quantity, upb)}</span>
                                            </td>
                                            <td>
                                                <div className="flex items-center justify-center space-x-2">
                                                    <div className="flex items-center space-x-1">
                                                        <span className="text-sm text-gray-500">Cajas:</span>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            value={count.boxes}
                                                            onChange={(e) => handleCountChange(product.id, 'boxes', e.target.value)}
                                                            className="w-16 px-2 py-1 border rounded text-center dark:bg-gray-700 dark:border-gray-600"
                                                        />
                                                    </div>
                                                    <div className="flex items-center space-x-1">
                                                        <span className="text-sm text-gray-500">Unds:</span>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            value={count.units}
                                                            onChange={(e) => handleCountChange(product.id, 'units', e.target.value)}
                                                            className="w-16 px-2 py-1 border rounded text-center dark:bg-gray-700 dark:border-gray-600"
                                                        />
                                                    </div>
                                                </div>
                                            </td>
                                            <td className={`text-center font-bold ${diff > 0 ? 'text-green-600 dark:text-green-400' : diff < 0 ? 'text-red-600 dark:text-red-400' : ''}`}>
                                                {diff}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Summary */}
                    <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                        <h4 className="font-bold text-gray-900 dark:text-white mb-2">Resumen del Cierre</h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <span className="text-sm text-gray-600 dark:text-gray-400">Total Items con Diferencia:</span>
                                <span className="ml-2 font-bold">{products.filter(p => calculateDifference(p) !== 0).length}</span>
                            </div>
                            <div>
                                <span className="text-sm text-gray-600 dark:text-gray-400">Diferencia Total Absoluta:</span>
                                <span className="ml-2 font-bold">{getTotalDifference()}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
}
