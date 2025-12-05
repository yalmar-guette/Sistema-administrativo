import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { Plus, Edit2, Trash2, Users, Package, Building2 } from 'lucide-react';

export default function Organizations() {
    const { user, currentOrganization, switchOrganization, loadInventories } = useAuth();
    const [organizations, setOrganizations] = useState([]);
    const [inventories, setInventories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showOrgModal, setShowOrgModal] = useState(false);
    const [showInvModal, setShowInvModal] = useState(false);
    const [editingOrg, setEditingOrg] = useState(null);
    const [editingInv, setEditingInv] = useState(null);
    const [orgForm, setOrgForm] = useState({ name: '' });
    const [invForm, setInvForm] = useState({ name: '', organization_id: '' });

    useEffect(() => {
        loadData();
    }, []);

    useEffect(() => {
        if (currentOrganization) {
            loadOrgInventories(currentOrganization.id);
        }
    }, [currentOrganization]);

    const loadData = async () => {
        try {
            const res = await api.get('/organizations');
            setOrganizations(res.data);
            if (res.data.length > 0 && !currentOrganization) {
                switchOrganization(res.data[0]);
            }
        } catch (error) {
            console.error('Error loading organizations:', error);
        } finally {
            setLoading(false);
        }
    };

    const loadOrgInventories = async (orgId) => {
        try {
            const res = await api.get(`/inventories/organization/${orgId}`);
            setInventories(res.data);
        } catch (error) {
            console.error('Error loading inventories:', error);
        }
    };

    const handleSaveOrg = async (e) => {
        e.preventDefault();
        try {
            if (editingOrg) {
                await api.put(`/organizations/${editingOrg.id}`, orgForm);
            } else {
                await api.post('/organizations', orgForm);
            }
            setShowOrgModal(false);
            setEditingOrg(null);
            setOrgForm({ name: '' });
            loadData();
        } catch (error) {
            alert(error.response?.data?.error || 'Error al guardar');
        }
    };

    const handleSaveInv = async (e) => {
        e.preventDefault();
        try {
            if (editingInv) {
                await api.put(`/inventories/${editingInv.id}`, invForm);
            } else {
                await api.post('/inventories', {
                    ...invForm,
                    organization_id: currentOrganization?.id
                });
            }
            setShowInvModal(false);
            setEditingInv(null);
            setInvForm({ name: '' });
            loadOrgInventories(currentOrganization.id);
            loadInventories(currentOrganization.id);
        } catch (error) {
            alert(error.response?.data?.error || 'Error al guardar');
        }
    };

    const handleDeleteOrg = async (id) => {
        if (!confirm('¿Eliminar organización? Se eliminarán todos los inventarios y datos asociados.')) return;
        try {
            await api.delete(`/organizations/${id}`);
            loadData();
        } catch (error) {
            alert('Error al eliminar');
        }
    };

    const handleDeleteInv = async (id) => {
        if (!confirm('¿Eliminar inventario? Se eliminarán todos los productos y datos asociados.')) return;
        try {
            await api.delete(`/inventories/${id}`);
            loadOrgInventories(currentOrganization.id);
            loadInventories(currentOrganization.id);
        } catch (error) {
            alert('Error al eliminar');
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
                {/* Organizations Section */}
                <div className="card">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                            <Building2 className="w-6 h-6 mr-2" />
                            Organizaciones
                        </h2>
                        {user?.is_superuser && (
                            <button
                                onClick={() => { setEditingOrg(null); setOrgForm({ name: '' }); setShowOrgModal(true); }}
                                className="btn btn-primary flex items-center space-x-2"
                            >
                                <Plus className="w-4 h-4" />
                                <span>Nueva Organización</span>
                            </button>
                        )}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {organizations.map(org => (
                            <div
                                key={org.id}
                                onClick={() => switchOrganization(org)}
                                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${currentOrganization?.id === org.id
                                    ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                                    : 'border-gray-200 dark:border-gray-700 hover:border-primary-300'
                                    }`}
                            >
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="font-bold text-lg text-gray-900 dark:text-white">{org.name}</h3>
                                        <div className="flex items-center space-x-4 text-sm text-gray-500 mt-2">
                                            <span className="flex items-center">
                                                <Package className="w-4 h-4 mr-1" />
                                                {org.inventory_count || 0} inventarios
                                            </span>
                                            <span className="flex items-center">
                                                <Users className="w-4 h-4 mr-1" />
                                                {org.user_count || 0} usuarios
                                            </span>
                                        </div>
                                        {org.role && (
                                            <span className={`inline-block mt-2 px-2 py-0.5 text-xs rounded-full ${org.role === 'owner' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' :
                                                org.role === 'admin' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' :
                                                    'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                                                }`}>
                                                {org.role}
                                            </span>
                                        )}
                                    </div>
                                    {user?.is_superuser && (
                                        <div className="flex space-x-1">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); setEditingOrg(org); setOrgForm({ name: org.name }); setShowOrgModal(true); }}
                                                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleDeleteOrg(org.id); }}
                                                className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 rounded"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        ))}
                        {organizations.length === 0 && (
                            <p className="text-gray-500 col-span-full">No hay organizaciones. Crea una para empezar.</p>
                        )}
                    </div>
                </div>

                {/* Inventories Section */}
                {currentOrganization && (
                    <div className="card">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center">
                                <Package className="w-6 h-6 mr-2" />
                                Inventarios de {currentOrganization.name}
                            </h2>
                            {(user?.is_superuser || getCurrentRole() === 'owner') && (
                                <button
                                    onClick={() => { setEditingInv(null); setInvForm({ name: '' }); setShowInvModal(true); }}
                                    className="btn btn-primary flex items-center space-x-2"
                                >
                                    <Plus className="w-4 h-4" />
                                    <span>Nuevo Inventario</span>
                                </button>
                            )}
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            {inventories.map(inv => (
                                <div
                                    key={inv.id}
                                    className="p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
                                >
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h3 className="font-bold text-gray-900 dark:text-white">{inv.name}</h3>
                                            <p className="text-sm text-gray-500 mt-1">
                                                {inv.product_count || 0} productos
                                            </p>
                                        </div>
                                        <div className="flex space-x-1">
                                            <button
                                                onClick={() => { setEditingInv(inv); setInvForm({ name: inv.name }); setShowInvModal(true); }}
                                                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded"
                                            >
                                                <Edit2 className="w-4 h-4" />
                                            </button>
                                            <button
                                                onClick={() => handleDeleteInv(inv.id)}
                                                className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 rounded"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {inventories.length === 0 && (
                                <p className="text-gray-500 col-span-full">No hay inventarios. Crea uno para empezar.</p>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Organization Modal */}
            {showOrgModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                            {editingOrg ? 'Editar Organización' : 'Nueva Organización'}
                        </h3>
                        <form onSubmit={handleSaveOrg}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Nombre *
                                </label>
                                <input
                                    type="text"
                                    value={orgForm.name}
                                    onChange={(e) => setOrgForm({ ...orgForm, name: e.target.value })}
                                    className="input"
                                    required
                                />
                            </div>
                            <div className="flex justify-end space-x-2">
                                <button
                                    type="button"
                                    onClick={() => setShowOrgModal(false)}
                                    className="btn btn-secondary"
                                >
                                    Cancelar
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    Guardar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Inventory Modal */}
            {showInvModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full p-6">
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
                            {editingInv ? 'Editar Inventario' : 'Nuevo Inventario'}
                        </h3>
                        <form onSubmit={handleSaveInv}>
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                    Nombre *
                                </label>
                                <input
                                    type="text"
                                    value={invForm.name}
                                    onChange={(e) => setInvForm({ ...invForm, name: e.target.value })}
                                    className="input"
                                    required
                                />
                            </div>
                            <div className="flex justify-end space-x-2">
                                <button
                                    type="button"
                                    onClick={() => setShowInvModal(false)}
                                    className="btn btn-secondary"
                                >
                                    Cancelar
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    Guardar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </Layout>
    );
}
