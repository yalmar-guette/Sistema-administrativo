import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { dbGet, dbRun } from '../db.js';

const router = express.Router();

// Login
router.post('/login', async (req, res) => {
    const { username, password } = req.body;

    try {
        const user = await dbGet('SELECT * FROM users WHERE username = ?', [username]);

        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const validPassword = bcrypt.compareSync(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: user.id, username: user.username, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Register (only for superuser and owner)
router.post('/register', async (req, res) => {
    const { username, email, password, role, token } = req.body;

    try {
        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Only superuser and owner can create users
        if (!['superuser', 'owner'].includes(decoded.role)) {
            return res.status(403).json({ error: 'Insufficient permissions' });
        }

        // Validate role
        if (!['admin', 'owner', 'employee'].includes(role)) {
            return res.status(400).json({ error: 'Invalid role' });
        }

        const hashedPassword = bcrypt.hashSync(password, 10);

        const result = await dbRun(
            'INSERT INTO users (username, email, password, role, created_by) VALUES (?, ?, ?, ?, ?)',
            [username, email, hashedPassword, role, decoded.id]
        );

        res.json({
            message: 'User created successfully',
            userId: result.insertId
        });
    } catch (error) {
        console.error('Register error:', error);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'Username or email already exists' });
        }
        res.status(500).json({ error: 'Server error' });
    }
});

// Get current user
router.get('/me', async (req, res) => {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const user = await dbGet('SELECT id, username, email, role FROM users WHERE id = ?', [decoded.id]);

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json(user);
    } catch (error) {
        res.status(401).json({ error: 'Invalid token' });
    }
});

export default router;
