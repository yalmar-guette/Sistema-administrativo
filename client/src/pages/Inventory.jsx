import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../api';
import { Plus, Edit2, Trash2, Package, Search, Box } from 'lucide-react';

// Helper function to format quantity as boxes + units
function formatQuantity(quantity, unitsPerBox) {
    const qty = parseInt(quantity) || 0;
    const upb = parseInt(unitsPerBox) || 1;

    if (upb <= 1) return qty.toString();

    const boxes = Math.floor(qty / upb);
    const units = qty % upb;

    if (boxes === 0) return `${units} unid.`;
    if (units === 0) return `${boxes} caja${boxes > 1 ? 's' : ''}`;
    return `${boxes} caja${boxes > 1 ? 's' : ''} + ${units} unid.`;
}

export default function Inventory() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [exchangeRate, setExchangeRate] = useState(51.89);
    const [formData, setFormData] = useState({
        name: '',
        quantity: 0,
        units_per_box: 1,
        unit_price: 0
    });

    useEffect(() => {
        loadProducts();
    }, []);

    const loadProducts = async () => {
        try {
            const [productsRes, rateRes] = await Promise.all([
                api.get('/inventory'),
                api.get('/settings/exchange-rate')
            ]);
            setProducts(productsRes.data);
            setExchangeRate(rateRes.data.exchange_rate);
        } catch (error) {
            console.error('Error loading products:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            if (editingProduct) {
                await api.put(`/inventory/${editingProduct.id}`, formData);
            } else {
                await api.post('/inventory', formData);
            }
            setShowModal(false);
            setEditingProduct(null);
            setFormData({ name: '', quantity: 0, units_per_box: 1, unit_price: 0 });
            loadProducts();
        } catch (error) {
            alert(error.response?.data?.error || 'Error al guardar producto');
        }
    };

    const handleEdit = (product) => {
        setEditingProduct(product);
        setFormData({
            name: product.name,
            quantity: product.quantity,
            units_per_box: product.units_per_box || 1,
            unit_price: product.unit_price
        });
        setShowModal(true);
    };

    const handleDelete = async (id) => {
        if (!confirm('¿Estás seguro de eliminar este producto?')) return;
        try {
            await api.delete(`/inventory/${id}`);
            loadProducts();
        } catch (error) {
            alert(error.response?.data?.error || 'Error al eliminar producto');
        }
    };

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <Layout>
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Inventario</h2>
                        <p className="text-gray-600 dark:text-gray-400">Gestión de productos</p>
                    </div>
                    <button
                        onClick={() => {
                            setEditingProduct(null);
                            setFormData({ name: '', quantity: 0, units_per_box: 1, unit_price: 0 });
                            setShowModal(true);
                        }}
                        className="btn btn-primary flex items-center space-x-2 shadow-lg"
                    >
                        <Plus className="w-5 h-5" />
                        <span>Nuevo Producto</span>
                    </button>
                </div>

                {/* Search */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Buscar por nombre..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="input pl-10"
                    />
                </div>

                {/* Products Table */}
                <div className="card">
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent"></div>
                        </div>
                    ) : filteredProducts.length === 0 ? (
                        <div className="text-center py-12">
                            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-600 dark:text-gray-400">No hay productos</p>
                        </div>
                    ) : (
                        <div className="table-container">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Nombre</th>
                                        <th className="text-right">Cantidad</th>
                                        <th className="text-right">Precio Unit. $</th>
                                        <th className="text-right">Precio Unit. Bs</th>
                                        <th className="text-right">Valor Total</th>
                                        <th className="text-center">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredProducts.map((product) => {
                                        const price = parseFloat(product.unit_price) || 0;
                                        const qty = parseInt(product.quantity) || 0;
                                        const upb = parseInt(product.units_per_box) || 1;
                                        return (
                                            <tr key={product.id}>
                                                <td className="font-medium text-gray-900 dark:text-white">
                                                    <div className="flex items-center space-x-2">
                                                        <span>{product.name}</span>
                                                        {upb > 1 && (
                                                            <span className="text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full flex items-center">
                                                                <Box className="w-3 h-3 mr-1" />
                                                                {upb}/caja
                                                            </span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="text-right">
                                                    <span className="font-semibold text-gray-900 dark:text-white">{formatQuantity(qty, upb)}</span>
                                                    {upb > 1 && (
                                                        <span className="block text-xs text-gray-500 dark:text-gray-400">({qty} unid.)</span>
                                                    )}
                                                </td>
                                                <td className="text-right font-semibold">${price.toFixed(2)}</td>
                                                <td className="text-right font-semibold text-primary-600 dark:text-primary-400">
                                                    {(price * parseFloat(exchangeRate)).toFixed(2)} Bs
                                                </td>
                                                <td className="text-right font-semibold text-green-600 dark:text-green-400">
                                                    ${(qty * price).toFixed(2)}
                                                </td>
                                                <td>
                                                    <div className="flex justify-center space-x-2">
                                                        <button
                                                            onClick={() => handleEdit(product)}
                                                            className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                                                        >
                                                            <Edit2 className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(product.id)}
                                                            className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
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
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                                {editingProduct ? 'Editar Producto' : 'Nuevo Producto'}
                            </h3>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Nombre *
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="input"
                                    required
                                />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Cantidad (unidades) *
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.quantity}
                                        onChange={(e) => setFormData({ ...formData, quantity: parseInt(e.target.value) || 0 })}
                                        className="input"
                                        min="0"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        <Box className="w-4 h-4 inline mr-1" />
                                        Unidades por Caja
                                    </label>
                                    <input
                                        type="number"
                                        value={formData.units_per_box}
                                        onChange={(e) => setFormData({ ...formData, units_per_box: parseInt(e.target.value) || 1 })}
                                        className="input"
                                        min="1"
                                        placeholder="Ej: 24, 36"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Deja 1 si no aplica</p>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Precio Unitario ($) *
                                    </label>
                                    <input
                                        type="number"
                                        step="0.01"
                                        value={formData.unit_price}
                                        onChange={(e) => setFormData({ ...formData, unit_price: parseFloat(e.target.value) || 0 })}
                                        className="input"
                                        min="0"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Preview */}
                            {formData.units_per_box > 1 && formData.quantity > 0 && (
                                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                                    <p className="text-sm text-blue-700 dark:text-blue-300">
                                        <strong>Vista previa:</strong> {formData.quantity} unidades = {formatQuantity(formData.quantity, formData.units_per_box)}
                                    </p>
                                </div>
                            )}

                            <div className="flex justify-end space-x-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="btn btn-secondary"
                                >
                                    Cancelar
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    {editingProduct ? 'Actualizar' : 'Crear'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </Layout>
    );
}
