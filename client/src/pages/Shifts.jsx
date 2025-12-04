import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../api';
import { Play, Square, Clock, Package, History, Box } from 'lucide-react';

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

export default function Shifts() {
    const [currentShift, setCurrentShift] = useState(null);
    const [history, setHistory] = useState([]);
    const [loading, setLoading] = useState(true);
    const [viewingShift, setViewingShift] = useState(null);
    const [notes, setNotes] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const [currentRes, historyRes] = await Promise.all([
                api.get('/shifts/current'),
                api.get('/shifts/history')
            ]);
            setCurrentShift(currentRes.data);
            setHistory(historyRes.data);
        } catch (error) {
            console.error('Error loading shifts:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpen = async () => {
        if (!confirm('¿Abrir nuevo turno? Se registrará el inventario actual como inicio.')) return;
        try {
            await api.post('/shifts/open');
            loadData();
        } catch (error) {
            alert(error.response?.data?.error || 'Error al abrir turno');
        }
    };

    const handleClose = async () => {
        if (!confirm('¿Cerrar turno? Se registrará el inventario final.')) return;
        try {
            await api.post('/shifts/close', { notes });
            setNotes('');
            loadData();
        } catch (error) {
            alert(error.response?.data?.error || 'Error al cerrar turno');
        }
    };

    const viewShiftDetails = async (shiftId) => {
        try {
            const res = await api.get(`/shifts/${shiftId}`);
            setViewingShift(res.data);
        } catch (error) {
            alert('Error al cargar detalles del turno');
        }
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
                <div>
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Turnos</h2>
                    <p className="text-gray-600 dark:text-gray-400">Control de apertura y cierre de turnos</p>
                </div>

                {/* Current Shift Status */}
                <div className={`card ${currentShift ? 'border-2 border-green-500' : 'border-2 border-gray-300 dark:border-gray-600'}`}>
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                            <div className={`p-3 rounded-full ${currentShift ? 'bg-green-100 dark:bg-green-900/30' : 'bg-gray-100 dark:bg-gray-800'}`}>
                                <Clock className={`w-6 h-6 ${currentShift ? 'text-green-600' : 'text-gray-500'}`} />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                                    {currentShift ? 'Turno Abierto' : 'Sin Turno Activo'}
                                </h3>
                                {currentShift && (
                                    <p className="text-sm text-gray-600 dark:text-gray-400">
                                        Abierto: {new Date(currentShift.opened_at).toLocaleString('es-ES')}
                                        {currentShift.opened_by_name && ` por ${currentShift.opened_by_name}`}
                                    </p>
                                )}
                            </div>
                        </div>

                        {currentShift ? (
                            <button
                                onClick={handleClose}
                                className="btn bg-red-600 hover:bg-red-700 text-white flex items-center space-x-2"
                            >
                                <Square className="w-5 h-5" />
                                <span>Cerrar Turno</span>
                            </button>
                        ) : (
                            <button
                                onClick={handleOpen}
                                className="btn btn-primary flex items-center space-x-2"
                            >
                                <Play className="w-5 h-5" />
                                <span>Abrir Turno</span>
                            </button>
                        )}
                    </div>

                    {currentShift && (
                        <>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                    Notas del turno (opcional)
                                </label>
                                <textarea
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    className="input"
                                    rows="2"
                                    placeholder="Observaciones del día..."
                                />
                            </div>

                            <h4 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center">
                                <Package className="w-5 h-5 mr-2" />
                                Inventario al Inicio del Turno
                            </h4>
                            <div className="table-container">
                                <table className="table text-sm">
                                    <thead>
                                        <tr>
                                            <th>Producto</th>
                                            <th className="text-right">Cantidad Inicial</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {currentShift.inventory?.map((item) => (
                                            <tr key={item.id}>
                                                <td className="font-medium">
                                                    {item.product_name}
                                                    {item.units_per_box > 1 && (
                                                        <span className="ml-2 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full">
                                                            {item.units_per_box}/caja
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="text-right">
                                                    <span className="font-semibold">{formatQuantity(item.initial_quantity, item.units_per_box)}</span>
                                                    {item.units_per_box > 1 && (
                                                        <span className="block text-xs text-gray-500">({item.initial_quantity} unid.)</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </>
                    )}
                </div>

                {/* Shift History */}
                <div className="card">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center">
                        <History className="w-5 h-5 mr-2" />
                        Historial de Turnos
                    </h3>
                    {history.length === 0 ? (
                        <p className="text-gray-600 dark:text-gray-400 text-center py-8">No hay turnos anteriores</p>
                    ) : (
                        <div className="table-container">
                            <table className="table">
                                <thead>
                                    <tr>
                                        <th>Apertura</th>
                                        <th>Cierre</th>
                                        <th>Abierto por</th>
                                        <th>Estado</th>
                                        <th className="text-center">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {history.map((shift) => (
                                        <tr key={shift.id}>
                                            <td>{new Date(shift.opened_at).toLocaleString('es-ES')}</td>
                                            <td>
                                                {shift.closed_at
                                                    ? new Date(shift.closed_at).toLocaleString('es-ES')
                                                    : '-'
                                                }
                                            </td>
                                            <td>{shift.opened_by_name || '-'}</td>
                                            <td>
                                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${shift.status === 'open'
                                                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                                                        : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'
                                                    }`}>
                                                    {shift.status === 'open' ? 'Abierto' : 'Cerrado'}
                                                </span>
                                            </td>
                                            <td className="text-center">
                                                <button
                                                    onClick={() => viewShiftDetails(shift.id)}
                                                    className="text-blue-600 hover:underline text-sm"
                                                >
                                                    Ver detalles
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* Shift Details Modal */}
            {viewingShift && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                                Detalles del Turno
                            </h3>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                {new Date(viewingShift.opened_at).toLocaleString('es-ES')}
                                {viewingShift.closed_at && ` - ${new Date(viewingShift.closed_at).toLocaleString('es-ES')}`}
                            </p>
                        </div>
                        <div className="p-6">
                            {viewingShift.notes && (
                                <div className="mb-4 p-3 bg-gray-50 dark:bg-gray-900 rounded-lg">
                                    <strong className="text-sm text-gray-700 dark:text-gray-300">Notas:</strong>
                                    <p className="text-gray-600 dark:text-gray-400">{viewingShift.notes}</p>
                                </div>
                            )}

                            <h4 className="font-bold text-gray-900 dark:text-white mb-3">Comparación de Inventario</h4>
                            <div className="table-container">
                                <table className="table text-sm">
                                    <thead>
                                        <tr>
                                            <th>Producto</th>
                                            <th className="text-right">Inicio</th>
                                            <th className="text-right">Final</th>
                                            <th className="text-right">Vendidos</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {viewingShift.inventory?.map((item) => {
                                            const sold = item.final_quantity !== null
                                                ? item.initial_quantity - item.final_quantity
                                                : null;
                                            return (
                                                <tr key={item.id}>
                                                    <td className="font-medium">
                                                        {item.product_name}
                                                        {item.units_per_box > 1 && (
                                                            <span className="ml-2 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full">
                                                                {item.units_per_box}/caja
                                                            </span>
                                                        )}
                                                    </td>
                                                    <td className="text-right">{formatQuantity(item.initial_quantity, item.units_per_box)}</td>
                                                    <td className="text-right">
                                                        {item.final_quantity !== null
                                                            ? formatQuantity(item.final_quantity, item.units_per_box)
                                                            : '-'
                                                        }
                                                    </td>
                                                    <td className={`text-right font-semibold ${sold > 0 ? 'text-green-600 dark:text-green-400' : ''}`}>
                                                        {sold !== null ? (sold > 0 ? `+${sold}` : sold) : '-'}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            <div className="flex justify-end pt-4">
                                <button
                                    onClick={() => setViewingShift(null)}
                                    className="btn btn-secondary"
                                >
                                    Cerrar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </Layout>
    );
}
