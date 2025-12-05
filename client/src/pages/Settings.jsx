import { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import Layout from '../components/Layout';
import api from '../api';

export default function Settings() {
  const [exchangeRate, setExchangeRate] = useState('');
  const [currentRate, setCurrentRate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadExchangeRate();
  }, []);

  const loadExchangeRate = async () => {
    try {
      const response = await api.get('/settings/exchange-rate');
      setCurrentRate(response.data);
      setExchangeRate(response.data.exchange_rate.toString());
    } catch (error) {
      console.error('Error loading exchange rate:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      await api.put('/settings/exchange-rate', {
        exchange_rate: parseFloat(exchangeRate),
      });
      alert('Tasa de cambio actualizada');
      loadExchangeRate();
    } catch (error) {
      alert(error.response?.data?.error || 'Error al actualizar tasa');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-2xl">
        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Configuración</h2>

        <div className="card">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Tasa de Cambio Bs/$
          </h3>

          {currentRate && (
          <div className="mb-6 p-4 bg-primary-50 dark:bg-primary-900/20 rounded-lg border border-primary-200 dark:border-primary-800">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Tasa Actual</p>
                <p className="text-3xl font-bold text-primary-600 dark:text-primary-400">
                  {parseFloat(currentRate.exchange_rate).toFixed(2)}
                  {' '}
                  Bs/$
                        </p>
              </div>
              <RefreshCw className="w-12 h-12 text-primary-600 dark:text-primary-400" />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              Última actualización:
              {' '}
              {new Date(currentRate.last_updated).toLocaleString('es-ES')}
            </p>
          </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Nueva Tasa de Cambio
              </label>
              <input
                type="number"
                step="0.01"
                value={exchangeRate}
                onChange={(e) => setExchangeRate(e.target.value)}
                className="input"
                placeholder="Ej: 51.89"
                required
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Ingresa la tasa del día (cuántos Bs vale 1$)
              </p>
            </div>

            <button
              type="submit"
              disabled={saving}
              className="btn btn-primary"
            >
              {saving ? 'Actualizando...' : 'Actualizar Tasa'}
            </button>
          </form>
        </div>
      </div>
    </Layout>
  );
}
