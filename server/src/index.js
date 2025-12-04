import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initializeDatabase } from './db.js';
import authRoutes from './routes/authRoutes.js';
import inventoryRoutes from './routes/inventoryRoutes.js';
import accountingRoutes from './routes/accountingRoutes.js';
import usersRoutes from './routes/usersRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';
import salesRoutes from './routes/salesRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize database
initializeDatabase();

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/accounting', accountingRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/sales', salesRoutes);

// Root route (informational)
app.get('/', (req, res) => {
    res.json({
        message: '✅ API del Sistema de Inventario y Contabilidad',
        status: 'Funcionando correctamente',
        note: 'Este es el backend. Para acceder a la aplicación, ve a:',
        frontend: 'http://localhost:5173',
        endpoints: {
            auth: '/api/auth',
            inventory: '/api/inventory',
            accounting: '/api/accounting',
            users: '/api/users',
            health: '/api/health'
        }
    });
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
    console.log(`✓ Server running on http://localhost:${PORT}`);
});
