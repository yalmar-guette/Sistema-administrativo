import express from 'express';
import bcrypt from 'bcrypt';
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

// Change user password (owner/superuser only)
router.put('/:id/password', verifyToken, requireRole('owner', 'superuser'), async (req, res) => {
    try {
        const { newPassword } = req.body;
        const userId = parseInt(req.params.id);

        // Validate password
        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }

        // Check if user exists
        const user = await dbGet('SELECT id, username FROM users WHERE id = ?', [userId]);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Hash new password and update
        const hashedPassword = bcrypt.hashSync(newPassword, 10);
        await dbRun('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, userId]);

        res.json({ message: 'Password updated successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;

