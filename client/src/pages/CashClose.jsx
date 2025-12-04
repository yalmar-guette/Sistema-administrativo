import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../api';
import { Save, Download, History, Printer, Eye, X } from 'lucide-react';

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
    const [viewingDetails, setViewingDetails] = useState(null);

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

    const getTotalSalesUSD = () => {
        return products.reduce((sum, p) => {
            const diff = calculateDifference(p);
            if (diff > 0) {
                const price = parseFloat(p.unit_price) || 0;
                return sum + (diff * price);
            }
            return sum;
        }, 0);
    };

    const getTotalSalesBs = () => {
        return getTotalSalesUSD() * exchangeRate;
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
                    units_per_box: upb,
                    unit_price: parseFloat(p.unit_price) || 0
                };
            });

            await api.post('/cash-close', {
                items,
                total_usd: getTotalSalesUSD(),
                total_bs: getTotalSalesBs()
            });
            alert('Cierre guardado exitosamente');
            loadData();
        } catch (error) {
            alert(error.response?.data?.error || 'Error al guardar cierre');
        } finally {
            setSaving(false);
        }
    };

    const exportToCSV = () => {
        let csv = 'Producto,Precio USD,Precio Bs,Stock Sistema,Conteo Fisico,Diferencia,Venta USD,Venta Bs\n';
        products.forEach(p => {
            const upb = parseInt(p.units_per_box) || 1;
            const count = counts[p.id] || { boxes: 0, units: 0 };
            const physicalQty = parseToQuantity(count.boxes, count.units, upb);
            const diff = calculateDifference(p);
            const price = parseFloat(p.unit_price) || 0;
            const saleUsd = diff > 0 ? diff * price : 0;
            const saleBs = saleUsd * exchangeRate;
            csv += `${p.name},${price.toFixed(2)},${(price * exchangeRate).toFixed(2)},${p.quantity},${physicalQty},${diff},${saleUsd.toFixed(2)},${saleBs.toFixed(2)}\n`;
        });
        csv += `\nTOTAL,,,,,${getTotalDifference()},${getTotalSalesUSD().toFixed(2)},${getTotalSalesBs().toFixed(2)}\n`;

        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `cierre-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    const printClose = () => {
        const printContent = `
            <html>
            <head>
                <title>Cierre de Caja - ${new Date().toLocaleDateString('es-ES')}</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; }
                    h1 { text-align: center; }
                    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    th { background: #f5f5f5; }
                    .text-right { text-align: right; }
                    .text-center { text-align: center; }
                    .total-row { font-weight: bold; background: #e8f5e9; }
                    .summary { margin-top: 20px; padding: 15px; background: #f9f9f9; border-radius: 8px; }
                    .summary h3 { margin-top: 0; }
                    .big-number { font-size: 24px; font-weight: bold; color: #2e7d32; }
                </style>
            </head>
            <body>
                <h1>Cierre de Caja</h1>
                <p>Fecha: ${new Date().toLocaleDateString('es-ES')} - ${new Date().toLocaleTimeString('es-ES')}</p>
                <table>
                    <thead>
                        <tr>
                            <th>Producto</th>
                            <th class="text-right">Precio $</th>
                            <th class="text-right">Precio Bs</th>
                            <th class="text-center">Stock Sistema</th>
                            <th class="text-center">Conteo Físico</th>
                            <th class="text-center">Diferencia</th>
                            <th class="text-right">Venta $</th>
                            <th class="text-right">Venta Bs</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${products.map(p => {
            const upb = parseInt(p.units_per_box) || 1;
            const count = counts[p.id] || { boxes: 0, units: 0 };
            const physicalQty = parseToQuantity(count.boxes, count.units, upb);
            const diff = calculateDifference(p);
            const price = parseFloat(p.unit_price) || 0;
            const saleUsd = diff > 0 ? diff * price : 0;
            const saleBs = saleUsd * exchangeRate;
            return `
                                <tr>
                                    <td>${p.name}</td>
                                    <td class="text-right">$${price.toFixed(2)}</td>
                                    <td class="text-right">${(price * exchangeRate).toFixed(2)} Bs</td>
                                    <td class="text-center">${formatQuantity(p.quantity, upb)}</td>
                                    <td class="text-center">${formatQuantity(physicalQty, upb)}</td>
                                    <td class="text-center">${diff}</td>
                                    <td class="text-right">$${saleUsd.toFixed(2)}</td>
                                    <td class="text-right">${saleBs.toFixed(2)} Bs</td>
                                </tr>
                            `;
        }).join('')}
                        <tr class="total-row">
                            <td colspan="5">TOTAL</td>
                            <td class="text-center">${getTotalDifference()}</td>
                            <td class="text-right">$${getTotalSalesUSD().toFixed(2)}</td>
                            <td class="text-right">${getTotalSalesBs().toFixed(2)} Bs</td>
                        </tr>
                    </tbody>
                </table>
                <div class="summary">
                    <h3>Resumen del Cierre</h3>
                    <p>Items con diferencia: ${products.filter(p => calculateDifference(p) !== 0).length}</p>
                    <p>Total Ventas: <span class="big-number">$${getTotalSalesUSD().toFixed(2)}</span></p>
                    <p>Total Ventas: <span class="big-number">${getTotalSalesBs().toFixed(2)} Bs</span></p>
                </div>
            </body>
            </html>
        `;

        const printWindow = window.open('', '_blank');
        printWindow.document.write(printContent);
        printWindow.document.close();
        printWindow.print();
    };

    const viewHistoryDetails = async (closeDate) => {
        try {
            const res = await api.get(`/cash-close/details/${closeDate}`);
            setViewingDetails({ date: closeDate, items: res.data });
        } catch (error) {
            alert('Error al cargar detalles');
        }
    };

    const printHistoryDetails = (details) => {
        const printContent = `
            <html>
            <head>
                <title>Cierre de Caja - ${new Date(details.date).toLocaleDateString('es-ES')}</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 20px; }
                    h1 { text-align: center; }
                    table { width: 100%; border-collapse: collapse; margin: 20px 0; }
                    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                    th { background: #f5f5f5; }
                    .text-right { text-align: right; }
                    .text-center { text-align: center; }
                </style>
            </head>
            <body>
                <h1>Cierre de Caja</h1>
                <p>Fecha: ${new Date(details.date).toLocaleDateString('es-ES')}</p>
                <table>
                    <thead>
                        <tr>
                            <th>Producto</th>
                            <th class="text-center">Stock Inicial</th>
                            <th class="text-center">Conteo Final</th>
                            <th class="text-center">Diferencia</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${details.items.map(item => `
                            <tr>
                                <td>${item.product_name}</td>
                                <td class="text-center">${item.system_quantity}</td>
                                <td class="text-center">${item.physical_quantity}</td>
                                <td class="text-center">${item.difference}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </body>
            </html>
        `;

        const printWindow = window.open('', '_blank');
        printWindow.document.write(printContent);
        printWindow.document.close();
        printWindow.print();
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
                            onClick={printClose}
                            className="btn bg-blue-600 hover:bg-blue-700 text-white flex items-center space-x-2"
                        >
                            <Printer className="w-4 h-4" />
                            <span>Imprimir</span>
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

                {/* History Panel */}
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
                                            <th className="text-center">Acciones</th>
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
                                                <td className="text-center">
                                                    <button
                                                        onClick={() => viewHistoryDetails(h.close_date)}
                                                        className="p-1 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded mr-2"
                                                        title="Ver detalles"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </button>
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
                                    <th className="text-right">Venta $</th>
                                    <th className="text-right">Venta Bs</th>
                                </tr>
                            </thead>
                            <tbody>
                                {products.map((product) => {
                                    const upb = parseInt(product.units_per_box) || 1;
                                    const count = counts[product.id] || { boxes: 0, units: 0 };
                                    const diff = calculateDifference(product);
                                    const price = parseFloat(product.unit_price) || 0;
                                    const priceBs = price * exchangeRate;
                                    const saleUsd = diff > 0 ? diff * price : 0;
                                    const saleBs = saleUsd * exchangeRate;

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
                                            <td className="text-right font-semibold text-green-600 dark:text-green-400">
                                                ${saleUsd.toFixed(2)}
                                            </td>
                                            <td className="text-right font-semibold text-green-600 dark:text-green-400">
                                                {saleBs.toFixed(2)} Bs
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Summary */}
                    <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg border border-green-200 dark:border-green-800">
                        <h4 className="font-bold text-gray-900 dark:text-white mb-4">Resumen del Cierre</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                                <span className="text-sm text-gray-600 dark:text-gray-400 block">Items Vendidos:</span>
                                <span className="text-xl font-bold">{getTotalDifference()}</span>
                            </div>
                            <div>
                                <span className="text-sm text-gray-600 dark:text-gray-400 block">Productos con Diferencia:</span>
                                <span className="text-xl font-bold">{products.filter(p => calculateDifference(p) !== 0).length}</span>
                            </div>
                            <div>
                                <span className="text-sm text-gray-600 dark:text-gray-400 block">Total Ventas USD:</span>
                                <span className="text-2xl font-bold text-green-600 dark:text-green-400">${getTotalSalesUSD().toFixed(2)}</span>
                            </div>
                            <div>
                                <span className="text-sm text-gray-600 dark:text-gray-400 block">Total Ventas Bs:</span>
                                <span className="text-2xl font-bold text-primary-600 dark:text-primary-400">{getTotalSalesBs().toFixed(2)} Bs</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* History Details Modal */}
            {viewingDetails && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                Cierre del {new Date(viewingDetails.date).toLocaleDateString('es-ES')}
                            </h3>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => printHistoryDetails(viewingDetails)}
                                    className="btn bg-blue-600 hover:bg-blue-700 text-white flex items-center space-x-2"
                                >
                                    <Printer className="w-4 h-4" />
                                    <span>Imprimir</span>
                                </button>
                                <button
                                    onClick={() => setViewingDetails(null)}
                                    className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                                >
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                        </div>
                        <div className="p-6">
                            <table className="table text-sm">
                                <thead>
                                    <tr>
                                        <th>Producto</th>
                                        <th className="text-center">Stock Inicial</th>
                                        <th className="text-center">Conteo Final</th>
                                        <th className="text-center">Diferencia</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {viewingDetails.items.map((item, i) => (
                                        <tr key={i}>
                                            <td className="font-medium">{item.product_name}</td>
                                            <td className="text-center">{item.system_quantity}</td>
                                            <td className="text-center">{item.physical_quantity}</td>
                                            <td className={`text-center font-bold ${item.difference > 0 ? 'text-green-600' : item.difference < 0 ? 'text-red-600' : ''}`}>
                                                {item.difference}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
}
