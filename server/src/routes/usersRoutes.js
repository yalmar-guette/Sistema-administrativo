import express from 'express';
import { dbGet, dbRun, dbAll } from '../db.js';
import { verifyToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Get all users (owner/superuser only)
router.get('/', verifyToken, requireRole('owner', 'superuser'), async (req, res) => {
    try {
        const users = await dbAll('SELECT id, username, email, role, created_at FROM users');
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Delete user (owner/superuser only)
router.delete('/:id', verifyToken, requireRole('owner', 'superuser'), async (req, res) => {
    try {
        // Prevent deleting yourself
        if (req.user.id === parseInt(req.params.id)) {
            return res.status(400).json({ error: 'Cannot delete your own account' });
        }

        await dbRun('DELETE FROM users WHERE id = ?', [req.params.id]);
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;
