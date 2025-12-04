import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../api';
import { Plus, Trash2, BookOpen, Calendar } from 'lucide-react';

export default function Accounting() {
    const [transactions, setTransactions] = useState([]);
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [formData, setFormData] = useState({
        date: new Date().toISOString().split('T')[0],
        description: '',
        reference: '',
        entries: [
            { account_id: '', debit: 0, credit: 0 },
            { account_id: '', debit: 0, credit: 0 }
        ]
    });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [transRes, accRes] = await Promise.all([
                api.get('/accounting/transactions'),
                api.get('/accounting/accounts')
            ]);
            setTransactions(transRes.data);
            setAccounts(accRes.data);
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        const totalDebit = formData.entries.reduce((sum, e) => sum + parseFloat(e.debit || 0), 0);
        const totalCredit = formData.entries.reduce((sum, e) => sum + parseFloat(e.credit || 0), 0);

        if (Math.abs(totalDebit - totalCredit) > 0.01) {
            alert('La transacción debe estar balanceada (Debe = Haber)');
            return;
        }

        try {
            await api.post('/accounting/transactions', formData);
            setShowModal(false);
            setFormData({
                date: new Date().toISOString().split('T')[0],
                description: '',
                reference: '',
                entries: [
                    { account_id: '', debit: 0, credit: 0 },
                    { account_id: '', debit: 0, credit: 0 }
                ]
            });
            loadData();
        } catch (error) {
            alert(error.response?.data?.error || 'Error al guardar transacción');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm('¿Estás seguro de eliminar esta transacción?')) return;
        try {
            await api.delete(`/accounting/transactions/${id}`);
            loadData();
        } catch (error) {
            alert(error.response?.data?.error || 'Error al eliminar transacción');
        }
    };

    const addEntry = () => {
        setFormData({
            ...formData,
            entries: [...formData.entries, { account_id: '', debit: 0, credit: 0 }]
        });
    };

    const removeEntry = (index) => {
        setFormData({
            ...formData,
            entries: formData.entries.filter((_, i) => i !== index)
        });
    };

    const updateEntry = (index, field, value) => {
        const newEntries = [...formData.entries];
        newEntries[index][field] = field === 'account_id' ? value : parseFloat(value) || 0;
        setFormData({ ...formData, entries: newEntries });
    };

    const totalDebit = formData.entries.reduce((sum, e) => sum + parseFloat(e.debit || 0), 0);
    const totalCredit = formData.entries.reduce((sum, e) => sum + parseFloat(e.credit || 0), 0);
    const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01;

    return (
        <Layout>
            <div className="space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Libro Diario</h2>
                        <p className="text-gray-600 dark:text-gray-400">Registro de transacciones contables</p>
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="btn btn-primary flex items-center space-x-2 shadow-lg"
                    >
                        <Plus className="w-5 h-5" />
                        <span>Nueva Transacción</span>
                    </button>
                </div>

                {/* Accounts Summary */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {['asset', 'liability', 'equity', 'revenue'].map(type => {
                        const typeAccounts = accounts.filter(a => a.type === type);
                        const total = typeAccounts.reduce((sum, a) => sum + a.balance, 0);
                        const labels = {
                            asset: 'Activos',
                            liability: 'Pasivos',
                            equity: 'Patrimonio',
                            revenue: 'Ingresos'
                        };
                        return (
                            <div key={type} className="card">
                                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2">
                                    {labels[type]}
                                </h3>
                                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                                    ${total.toLocaleString('es-ES', { minimumFractionDigits: 2 })}
                                </p>
                            </div>
                        );
                    })}
                </div>

                {/* Transactions List */}
                <div className="card">
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent"></div>
                        </div>
                    ) : transactions.length === 0 ? (
                        <div className="text-center py-12">
                            <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                            <p className="text-gray-600 dark:text-gray-400">No hay transacciones</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {transactions.map((trans) => {
                                const totalDebit = trans.entries.reduce((sum, e) => sum + e.debit, 0);
                                return (
                                    <div
                                        key={trans.id}
                                        className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:shadow-md transition-shadow"
                                    >
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <div className="flex items-center space-x-3 mb-1">
                                                    <Calendar className="w-4 h-4 text-gray-400" />
                                                    <span className="font-medium text-gray-900 dark:text-white">
                                                        {new Date(trans.date).toLocaleDateString('es-ES')}
                                                    </span>
                                                    {trans.reference && (
                                                        <span className="text-sm text-gray-500">Ref: {trans.reference}</span>
                                                    )}
                                                </div>
                                                <p className="text-gray-600 dark:text-gray-400">{trans.description}</p>
                                            </div>
                                            <button
                                                onClick={() => handleDelete(trans.id)}
                                                className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                        <div className="table-container">
                                            <table className="table text-sm">
                                                <thead>
                                                    <tr>
                                                        <th>Cuenta</th>
                                                        <th className="text-right">Debe</th>
                                                        <th className="text-right">Haber</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {trans.entries.map((entry, i) => (
                                                        <tr key={i}>
                                                            <td>
                                                                {entry.account_code} - {entry.account_name}
                                                            </td>
                                                            <td className="text-right">
                                                                {entry.debit > 0 ? `$${entry.debit.toFixed(2)}` : '-'}
                                                            </td>
                                                            <td className="text-right">
                                                                {entry.credit > 0 ? `$${entry.credit.toFixed(2)}` : '-'}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                    <tr className="font-bold bg-gray-50 dark:bg-gray-900">
                                                        <td>TOTAL</td>
                                                        <td className="text-right">${totalDebit.toFixed(2)}</td>
                                                        <td className="text-right">${totalDebit.toFixed(2)}</td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 overflow-y-auto">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full my-8">
                        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">Nueva Transacción</h3>
                        </div>
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Fecha *
                                    </label>
                                    <input
                                        type="date"
                                        value={formData.date}
                                        onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                        className="input"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                        Referencia
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.reference}
                                        onChange={(e) => setFormData({ ...formData, reference: e.target.value })}
                                        className="input"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Descripción *
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="input"
                                    rows="2"
                                    required
                                />
                            </div>

                            <div>
                                <div className="flex justify-between items-center mb-3">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                        Asientos
                                    </label>
                                    <button
                                        type="button"
                                        onClick={addEntry}
                                        className="text-sm btn btn-secondary"
                                    >
                                        + Agregar Línea
                                    </button>
                                </div>

                                <div className="space-y-2">
                                    {formData.entries.map((entry, index) => (
                                        <div key={index} className="grid grid-cols-12 gap-2 items-center">
                                            <select
                                                value={entry.account_id}
                                                onChange={(e) => updateEntry(index, 'account_id', e.target.value)}
                                                className="input col-span-6"
                                                required
                                            >
                                                <option value="">Seleccionar cuenta...</option>
                                                {accounts.map(acc => (
                                                    <option key={acc.id} value={acc.id}>
                                                        {acc.code} - {acc.name}
                                                    </option>
                                                ))}
                                            </select>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={entry.debit}
                                                onChange={(e) => updateEntry(index, 'debit', e.target.value)}
                                                className="input col-span-2"
                                                placeholder="Debe"
                                            />
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={entry.credit}
                                                onChange={(e) => updateEntry(index, 'credit', e.target.value)}
                                                className="input col-span-2"
                                                placeholder="Haber"
                                            />
                                            {formData.entries.length > 2 && (
                                                <button
                                                    type="button"
                                                    onClick={() => removeEntry(index)}
                                                    className="col-span-2 p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                                    <div className="flex justify-between text-sm">
                                        <span className="font-medium">Total Debe:</span>
                                        <span className="font-bold">${totalDebit.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm mt-1">
                                        <span className="font-medium">Total Haber:</span>
                                        <span className="font-bold">${totalCredit.toFixed(2)}</span>
                                    </div>
                                    <div className="flex justify-between text-sm mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                                        <span className="font-medium">Estado:</span>
                                        <span className={`font-bold ${isBalanced ? 'text-green-600' : 'text-red-600'}`}>
                                            {isBalanced ? '✓ Balanceado' : '✗ No balanceado'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end space-x-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="btn btn-secondary"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="btn btn-primary"
                                    disabled={!isBalanced}
                                >
                                    Crear Transacción
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </Layout>
    );
}
