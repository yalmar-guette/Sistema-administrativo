import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [currentOrganization, setCurrentOrganization] = useState(null);
    const [currentInventory, setCurrentInventory] = useState(null);
    const [inventories, setInventories] = useState([]);
    const [darkMode, setDarkMode] = useState(() => {
        const saved = localStorage.getItem('darkMode');
        return saved ? JSON.parse(saved) : false;
    });

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            loadUser();
        } else {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        localStorage.setItem('darkMode', JSON.stringify(darkMode));
        if (darkMode) {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    }, [darkMode]);

    // Load inventories when organization changes
    useEffect(() => {
        if (currentOrganization) {
            loadInventories(currentOrganization.id);
            localStorage.setItem('currentOrgId', currentOrganization.id);
        }
    }, [currentOrganization]);

    // Save current inventory to localStorage
    useEffect(() => {
        if (currentInventory) {
            localStorage.setItem('currentInventoryId', currentInventory.id);
        }
    }, [currentInventory]);

    const loadUser = async () => {
        try {
            const response = await api.get('/auth/me');
            setUser(response.data);

            // Restore saved organization/inventory
            const savedOrgId = localStorage.getItem('currentOrgId');
            const savedInvId = localStorage.getItem('currentInventoryId');

            if (response.data.organizations?.length > 0) {
                const savedOrg = response.data.organizations.find(o => o.id == savedOrgId);
                const orgToSet = savedOrg || response.data.organizations[0];
                setCurrentOrganization(orgToSet);

                // Load inventories and wait for completion
                try {
                    const invResponse = await api.get(`/inventories/organization/${orgToSet.id}`);
                    setInventories(invResponse.data);

                    if (invResponse.data.length > 0) {
                        const savedInv = invResponse.data.find(i => i.id == savedInvId);
                        setCurrentInventory(savedInv || invResponse.data[0]);
                    } else {
                        setCurrentInventory(null);
                    }
                } catch (invError) {
                    console.error('Error loading inventories:', invError);
                    setInventories([]);
                    setCurrentInventory(null);
                }
            }
        } catch (error) {
            console.error('Error loading user:', error);
            localStorage.removeItem('token');
        } finally {
            setLoading(false);
        }
    };

    const loadInventories = async (orgId) => {
        try {
            const response = await api.get(`/inventories/organization/${orgId}`);
            setInventories(response.data);

            // Restore or set first inventory
            const savedInvId = localStorage.getItem('currentInventoryId');
            if (response.data.length > 0) {
                const savedInv = response.data.find(i => i.id == savedInvId);
                setCurrentInventory(savedInv || response.data[0]);
            } else {
                setCurrentInventory(null);
            }
        } catch (error) {
            console.error('Error loading inventories:', error);
            setInventories([]);
            setCurrentInventory(null);
        }
    };

    const login = async (username, password) => {
        const response = await api.post('/auth/login', { username, password });
        localStorage.setItem('token', response.data.token);
        setUser(response.data.user);

        // Set first organization as current
        if (response.data.user.organizations?.length > 0) {
            setCurrentOrganization(response.data.user.organizations[0]);
        }

        return response.data;
    };

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('currentOrgId');
        localStorage.removeItem('currentInventoryId');
        setUser(null);
        setCurrentOrganization(null);
        setCurrentInventory(null);
        setInventories([]);
    };

    const toggleDarkMode = () => {
        setDarkMode(prev => !prev);
    };

    const switchOrganization = (org) => {
        setCurrentOrganization(org);
        setCurrentInventory(null);
    };

    const switchInventory = (inv) => {
        setCurrentInventory(inv);
    };

    // Helper to check user role in current organization
    const getCurrentRole = () => {
        if (user?.is_superuser) return 'superuser';
        if (!currentOrganization || !user?.organizations) return null;
        const org = user.organizations.find(o => o.id === currentOrganization.id);
        return org?.role || null;
    };

    const hasRole = (...roles) => {
        if (user?.is_superuser) return true;
        const currentRole = getCurrentRole();
        return roles.includes(currentRole);
    };

    return (
        <AuthContext.Provider value={{
            user,
            loading,
            login,
            logout,
            darkMode,
            toggleDarkMode,
            currentOrganization,
            currentInventory,
            inventories,
            switchOrganization,
            switchInventory,
            getCurrentRole,
            hasRole,
            loadInventories
        }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
