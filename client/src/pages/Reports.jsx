import { useState } from 'react';
import Layout from '../components/Layout';
import api from '../api';
import { Calendar, FileDown, Printer, FileSpreadsheet } from 'lucide-react';

export default function Reports() {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
    const [report, setReport] = useState(null);
    const [loading, setLoading] = useState(false);

    const generateReport = async () => {
        setLoading(true);
        try {
            const response = await api.get(`/sales/daily-report?date=${date}`);
            setReport(response.data);
        } catch (error) {
            alert('Error al generar reporte');
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const exportPDF = () => {
        alert('Función de exportar PDF en desarrollo. Usa la opción de Imprimir y guarda como PDF.');
    };

    const exportExcel = () => {
        if (!report) return;

        const csv = generateCSV();
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `reporte_${date}.csv`;
        a.click();
    };

    const generateCSV = () => {
        if (!report) return '';

        let csv = 'REPORTE DE CIERRE DIARIO\n';
        csv += `Fecha:,${date}\n\n`;

        csv += 'PRODUCTOS\n';
        csv += 'Producto,Stock Inicial,Vendidos,Stock Final,Ingreso USD,Ingreso Bs\n';
        report.products.forEach(p => {
            csv += `${p.name},${p.initial_stock},${p.sold},${p.final_stock},${p.revenue_usd.toFixed(2)},${p.revenue_bs.toFixed(2)}\n`;
        });

        csv += '\nMÉTODOS DE PAGO\n';
        csv += 'Método,Cantidad,Total USD,Total Bs\n';
        Object.entries(report.payment_methods).forEach(([method, data]) => {
            csv += `${method},${data.count},${data.usd.toFixed(2)},${data.bs.toFixed(2)}\n`;
        });

        csv += `\nTOTALES\n`;
        csv += `Total Ventas:,${report.totals.total_sales}\n`;
        csv += `Total USD:,${report.totals.total_usd.toFixed(2)}\n`;
        csv += `Total Bs:,${report.totals.total_bs.toFixed(2)}\n`;

        return csv;
    };

    return (
        <Layout>
            <div className="space-y-6">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Reportes</h2>
                    <p className="text-gray-600 dark:text-gray-400">Cierre diario de ventas e inventario</p>
                </div>

                <div className="card">
                    <div className="flex flex-col sm:flex-row gap-4 items-end">
                        <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                                <Calendar className="w-4 h-4 inline mr-1" />
                                Fecha del Reporte
                            </label>
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="input"
                            />
                        </div>
                        <button
                            onClick={generateReport}
                            disabled={loading}
                            className="btn btn-primary"
                        >
                            {loading ? 'Generando...' : 'Generar Reporte'}
                        </button>
                    </div>
                </div>

                {report && (
                    <>
                        <div className="card print:shadow-none">
                            <div className="flex justify-between items-center mb-6 print:mb-4">
                                <div>
                                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                                        Reporte de Cierre - {new Date(date).toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                                    </h3>
                                </div>
                                <div className="flex space-x-2 print:hidden">
                                    <button onClick={handlePrint} className="btn btn-secondary flex items-center space-x-1">
                                        <Printer className="w-4 h-4" />
                                        <span>Imprimir</span>
                                    </button>
                                    <button onClick={exportExcel} className="btn btn-secondary flex items-center space-x-1">
                                        <FileSpreadsheet className="w-4 h-4" />
                                        <span>Excel</span>
                                    </button>
                                </div>
                            </div>

                            {/* Products Summary */}
                            <div className="mb-8">
                                <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-3">Movimiento de Productos</h4>
                                <div className="table-container">
                                    <table className="table">
                                        <thead>
                                            <tr>
                                                <th>Producto</th>
                                                <th className="text-center">Stock Inicial</th>
                                                <th className="text-center">Vendidos</th>
                                                <th className="text-center">Stock Final</th>
                                                <th className="text-right">Ingreso $</th>
                                                <th className="text-right">Ingreso Bs</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {report.products.map((product, index) => (
                                                <tr key={index}>
                                                    <td className="font-medium">{product.name}</td>
                                                    <td className="text-center">{product.initial_stock}</td>
                                                    <td className="text-center font-semibold text-primary-600 dark:text-primary-400">
                                                        {product.sold}
                                                    </td>
                                                    <td className="text-center">{product.final_stock}</td>
                                                    <td className="text-right">${product.revenue_usd.toFixed(2)}</td>
                                                    <td className="text-right text-green-600 dark:text-green-400">
                                                        {product.revenue_bs.toFixed(2)} Bs
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>

                            {/* Payment Methods */}
                            <div className="mb-8">
                                <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-3">Ingresos por Método de Pago</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {Object.entries(report.payment_methods).map(([method, data]) => (
                                        <div key={method} className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                                            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                                                {method.replace('_', ' ').toUpperCase()}
                                            </div>
                                            <div className="text-lg font-bold text-gray-900 dark:text-white">
                                                {data.count} venta{data.count !== 1 ? 's' : ''}
                                            </div>
                                            <div className="text-sm mt-2 space-y-1">
                                                {data.usd > 0 && (
                                                    <div className="text-green-600 dark:text-green-400">
                                                        ${data.usd.toFixed(2)}
                                                    </div>
                                                )}
                                                {data.bs > 0 && (
                                                    <div className="text-primary-600 dark:text-primary-400">
                                                        {data.bs.toFixed(2)} Bs
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Totals */}
                            <div className="bg-gradient-to-r from-primary-50 to-red-50 dark:from-primary-900/20 dark:to-red-900/20 border border-primary-200 dark:border-primary-800 rounded-lg p-6">
                                <h4 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Totales del Día</h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <div className="text-sm text-gray-600 dark:text-gray-400">Total Ventas</div>
                                        <div className="text-3xl font-bold text-gray-900 dark:text-white">
                                            {report.totals.total_sales}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-gray-600 dark:text-gray-400">Total en Dólares</div>
                                        <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                                            ${report.totals.total_usd.toFixed(2)}
                                        </div>
                                    </div>
                                    <div>
                                        <div className="text-sm text-gray-600 dark:text-gray-400">Total en Bolívares</div>
                                        <div className="text-3xl font-bold text-primary-600 dark:text-primary-400">
                                            {report.totals.total_bs.toFixed(2)} Bs
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </Layout>
    );
}
