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

// CORS configuration - Allow frontend domains
const corsOptions = {
    origin: [
        'http://localhost:5173', // Local development
        'https://sistema-administrativo-frontend.onrender.com', // Production frontend
        'https://sistema-administrativo-tfdd.onrender.com' // Alternative frontend URL
    ],
    credentials: true,
    optionsSuccessStatus: 200
};

// Middleware
app.use(cors(corsOptions));
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
        frontend: 'https://sistema-administrativo-frontend.onrender.com',
        endpoints: {
            auth: '/api/auth',
            inventory: '/api/inventory',
            accounting: '/api/accounting',
            users: '/api/users',
            settings: '/api/settings',
            sales: '/api/sales',
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
