import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Inventory from './pages/Inventory';
import Accounting from './pages/Accounting';
import Users from './pages/Users';
import Sales from './pages/Sales';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import CashClose from './pages/CashClose';

function PrivateRoute({ children, roles }) {
    const { user, loading } = useAuth();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-600 border-t-transparent"></div>
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" />;
    }

    if (roles && !roles.includes(user.role)) {
        return <Navigate to="/dashboard" />;
    }

    return children;
}

function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route
                        path="/dashboard"
                        element={
                            <PrivateRoute>
                                <Dashboard />
                            </PrivateRoute>
                        }
                    />
                    <Route
                        path="/inventory"
                        element={
                            <PrivateRoute>
                                <Inventory />
                            </PrivateRoute>
                        }
                    />
                    <Route
                        path="/accounting"
                        element={
                            <PrivateRoute>
                                <Accounting />
                            </PrivateRoute>
                        }
                    />
                    <Route
                        path="/sales"
                        element={
                            <PrivateRoute>
                                <Sales />
                            </PrivateRoute>
                        }
                    />
                    <Route
                        path="/reports"
                        element={
                            <PrivateRoute roles={['admin', 'owner', 'superuser']}>
                                <Reports />
                            </PrivateRoute>
                        }
                    />
                    <Route
                        path="/settings"
                        element={
                            <PrivateRoute roles={['admin', 'owner', 'superuser']}>
                                <Settings />
                            </PrivateRoute>
                        }
                    />
                    <Route
                        path="/users"
                        element={
                            <PrivateRoute roles={['owner', 'superuser']}>
                                <Users />
                            </PrivateRoute>
                        }
                    />
                    <Route
                        path="/cash-close"
                        element={
                            <PrivateRoute roles={['admin', 'owner', 'superuser']}>
                                <CashClose />
                            </PrivateRoute>
                        }
                    />
                    <Route path="/" element={<Navigate to="/dashboard" />} />
                </Routes>
            </BrowserRouter>
        </AuthProvider>
    );
}

export default App;
