import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../api';
import { Plus, Trash2, ShoppingCart, DollarSign } from 'lucide-react';

const PAYMENT_METHODS = {
    pago_movil: { label: 'Pago Móvil', icon: '📱', currency: 'bs' },
    pos: { label: 'Punto de Venta', icon: '💳', currency: 'bs' },
    bs_cash: { label: 'Bs Efectivo', icon: '💵', currency: 'bs' },
    usd_cash: { label: 'Dólares Efectivo', icon: '💵', currency: 'usd' },
    zelle: { label: 'Zelle', icon: '💸', currency: 'usd' },
    binance: { label: 'Binance', icon: '₿', currency: 'usd' }
};

export default function Sales() {
    const [sales, setSales] = useState([]);
    const [products, setProducts] = useState([]);
    const [exchangeRate, setExchangeRate] = useState(51.89);
    const [showModal, setShowModal] = useState(false);
    const [loading, setLoading] = useState(true);

    const [formData, setFormData] = useState({
        customer_name: '',
        payment_method: 'pago_movil',
        items: []
    });

    const [selectedProduct, setSelectedProduct] = useState('');
    const [quantity, setQuantity] = useState(1);

    // Get max stock for selected product (considering items already added)
    const getMaxStock = () => {
        if (!selectedProduct) return 999;
        const product = products.find(p => p.id === parseInt(selectedProduct));
        if (!product) return 999;

        // Calculate how many of this product are already in the cart
        const alreadyAdded = formData.items
            .filter(item => item.product_id === product.id)
            .reduce((sum, item) => sum + item.quantity, 0);

        return Math.max(0, product.quantity - alreadyAdded);
    };

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [salesRes, productsRes, rateRes] = await Promise.all([
                api.get('/sales'),
                api.get('/inventory'),
                api.get('/settings/exchange-rate')
            ]);
            setSales(salesRes.data);
            setProducts(productsRes.data);
            setExchangeRate(rateRes.data.exchange_rate);
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const addItem = () => {
        if (!selectedProduct || quantity <= 0) return;

        const product = products.find(p => p.id === parseInt(selectedProduct));
        if (!product) return;

        // Check how many of this product are already in the cart
        const alreadyAdded = formData.items
            .filter(item => item.product_id === product.id)
            .reduce((sum, item) => sum + item.quantity, 0);

        const availableStock = product.quantity - alreadyAdded;

        if (availableStock <= 0) {
            alert('Ya agregaste todo el stock disponible de este producto');
            return;
        }

        if (quantity > availableStock) {
            alert(`Solo puedes agregar ${availableStock} unidad(es) más de este producto`);
            return;
        }

        const unitPriceUsd = parseFloat(product.unit_price) || 0;
        const unitPriceBs = unitPriceUsd * parseFloat(exchangeRate);
        const subtotalUsd = unitPriceUsd * quantity;
        const subtotalBs = unitPriceBs * quantity;

        setFormData({
            ...formData,
            items: [
                ...formData.items,
                {
                    product_id: product.id,
                    product_name: product.name,
                    quantity: quantity,
                    unit_price_usd: unitPriceUsd,
                    unit_price_bs: unitPriceBs,
                    subtotal_usd: subtotalUsd,
                    subtotal_bs: subtotalBs
                }
            ]
        });

        setSelectedProduct('');
        setQuantity(1);
    };

    const removeItem = (index) => {
        setFormData({
            ...formData,
            items: formData.items.filter((_, i) => i !== index)
        });
    };

    const getTotals = () => {
        const totalUsd = formData.items.reduce((sum, item) => sum + item.subtotal_usd, 0);
        const totalBs = formData.items.reduce((sum, item) => sum + item.subtotal_bs, 0);
        return { totalUsd, totalBs };
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (formData.items.length === 0) {
            alert('Agrega al menos un producto');
            return;
        }

        try {
            await api.post('/sales', {
                ...formData,
                exchange_rate: exchangeRate
            });

            alert('Venta registrada exitosamente');
            setShowModal(false);
            setFormData({ customer_name: '', payment_method: 'pago_movil', items: [] });
            loadData();
        } catch (error) {
            alert(error.response?.data?.error || 'Error al registrar venta');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('¿Anular esta venta? Se devolverá el inventario')) return;

        try {
            await api.delete(`/sales/${id}`);
            loadData();
        } catch (error) {
            alert(error.response?.data?.error || 'Error al anular venta');
        }
    };

    const { totalUsd, totalBs } = getTotals();
    const paymentMethod = PAYMENT_METHODS[formData.payment_method];

    return (
        <Layout>
            <div className="space-y-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Ventas</h2>
                        <p className="text-gray-600 dark:text-gray-400">Registro de ventas</p>
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="btn btn-primary flex items-center space-x-2 shadow-lg"
                    >
                        <Plus className="w-5 h-5" />
                        <span>Nueva Venta</span>
                    </button>
                </div>

                <div className="card">
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent"></div>
                        </div>
                    ) : sales.length === 0 ? (
                        <div className="text-center py-12">
                            <ShoppingCart className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-600 dark:text-gray-400">No hay ventas</p>
                        </div>
                    ) : (
                        <div className="table-container">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>N° Venta</th>
                                        <th>Fecha</th>
                                        <th>Cliente</th>
                                        <th>Método Pago</th>
                                        <th className="text-right">Total $</th>
                                        <th className="text-right">Total Bs</th>
                                        <th className="text-center">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {sales.map((sale) => {
                                        const pm = PAYMENT_METHODS[sale.payment_method];
                                        const totalUsdSale = parseFloat(sale.total_usd) || 0;
                                        const totalBsSale = parseFloat(sale.total_bs) || 0;
                                        return (
                                            <tr key={sale.id}>
                                                <td className="font-mono text-sm font-semibold text-primary-600 dark:text-primary-400">
                                                    {sale.sale_number}
                                                </td>
                                                <td>{new Date(sale.date).toLocaleDateString('es-ES')}</td>
                                                <td>{sale.customer_name || '-'}</td>
                                                <td>
                                                    <span className="text-sm">
                                                        {pm?.icon} {pm?.label}
                                                    </span>
                                                </td>
                                                <td className="text-right font-semibold">${totalUsdSale.toFixed(2)}</td>
                                                <td className="text-right font-semibold text-green-600 dark:text-green-400">
                                                    {totalBsSale.toFixed(2)} Bs
                                                </td>
                                                <td>
                                                    <div className="flex justify-center">
                                                        <button
                                                            onClick={() => handleDelete(sale.id)}
                                                            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full my-8">
                        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Nueva Venta</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                Tasa del día: {parseFloat(exchangeRate).toFixed(2)} Bs/$
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            {/* Customer & Payment Method */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Cliente (Opcional)
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.customer_name}
                                        onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                                        className="input"
                                        placeholder="Nombre del cliente"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Método de Pago *
                                    </label>
                                    <select
                                        value={formData.payment_method}
                                        onChange={(e) => setFormData({ ...formData, payment_method: e.target.value })}
                                        className="input"
                                        required
                                    >
                                        {Object.entries(PAYMENT_METHODS).map(([key, pm]) => (
                                            <option key={key} value={key}>
                                                {pm.icon} {pm.label} ({pm.currency === 'bs' ? 'Bs' : '$'})
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            {/* Add Product */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Agregar Producto
                                </label>
                                <div className="flex space-x-2">
                                    <select
                                        value={selectedProduct}
                                        onChange={(e) => setSelectedProduct(e.target.value)}
                                        className="input flex-1"
                                    >
                                        <option value="">Seleccionar producto...</option>
                                        {products.filter(p => parseInt(p.quantity) > 0).map(p => (
                                            <option key={p.id} value={p.id}>
                                                {p.name} (Stock: {p.quantity}) - ${(parseFloat(p.unit_price) || 0).toFixed(2)}
                                            </option>
                                        ))}
                                    </select>
                                    <input
                                        type="number"
                                        value={quantity}
                                        onChange={(e) => {
                                            const val = parseInt(e.target.value) || 1;
                                            const max = getMaxStock();
                                            setQuantity(Math.min(val, max));
                                        }}
                                        className="input w-24"
                                        min="1"
                                        max={getMaxStock()}
                                        placeholder="Cant."
                                    />
                                    <button type="button" onClick={addItem} className="btn btn-secondary">
                                        <Plus className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>

                            {/* Items List */}
                            {formData.items.length > 0 && (
                                <div className="border border-gray-200 dark:border-gray-700 rounded-lg">
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-50 dark:bg-gray-900">
                                            <tr>
                                                <th className="px-4 py-2 text-left">Producto</th>
                                                <th className="px-4 py-2 text-center">Cant.</th>
                                                <th className="px-4 py-2 text-right">P. Unit $</th>
                                                <th className="px-4 py-2 text-right">P. Unit Bs</th>
                                                <th className="px-4 py-2 text-right">Subtotal</th>
                                                <th className="px-4 py-2"></th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {formData.items.map((item, index) => (
                                                <tr key={index} className="border-t border-gray-200 dark:border-gray-700">
                                                    <td className="px-4 py-2">{item.product_name}</td>
                                                    <td className="px-4 py-2 text-center">{item.quantity}</td>
                                                    <td className="px-4 py-2 text-right">${item.unit_price_usd.toFixed(2)}</td>
                                                    <td className="px-4 py-2 text-right">{item.unit_price_bs.toFixed(2)} Bs</td>
                                                    <td className="px-4 py-2 text-right font-semibold">
                                                        ${item.subtotal_usd.toFixed(2)} / {item.subtotal_bs.toFixed(2)} Bs
                                                    </td>
                                                    <td className="px-4 py-2">
                                                        <button
                                                            type="button"
                                                            onClick={() => removeItem(index)}
                                                            className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                                                        >
                                                            <Trash2 className="w-4 h-4" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* Total */}
                            {formData.items.length > 0 && (
                                <div className="bg-gradient-to-r from-primary-50 to-red-50 dark:from-primary-900/20 dark:to-red-900/20 border border-primary-200 dark:border-primary-800 rounded-lg p-6">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-gray-700 dark:text-gray-300">Método de pago:</span>
                                        <span className="font-semibold">{paymentMethod.icon} {paymentMethod.label}</span>
                                    </div>
                                    <div className="flex justify-between items-center text-2xl font-bold">
                                        <span className="text-gray-900 dark:text-white">Total a cobrar:</span>
                                        {paymentMethod.currency === 'bs' ? (
                                            <span className="text-primary-600 dark:text-primary-400">
                                                {totalBs.toFixed(2)} Bs
                                            </span>
                                        ) : (
                                            <span className="text-green-600 dark:text-green-400">
                                                ${totalUsd.toFixed(2)} <span className="text-sm text-gray-600 dark:text-gray-400">({totalBs.toFixed(2)} Bs)</span>
                                            </span>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="btn btn-secondary"
                                >
                                    Cancelar
                                </button>
                                <button type="submit" className="btn btn-primary" disabled={formData.items.length === 0}>
                                    Registrar Venta
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </Layout>
    );
}
