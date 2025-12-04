import express from 'express';
import { dbGet, dbRun } from '../db.js';
import { verifyToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Get exchange rate
router.get('/exchange-rate', verifyToken, async (req, res) => {
    try {
        const setting = await dbGet('SELECT * FROM settings WHERE key = ?', ['exchange_rate']);
        if (!setting) {
            return res.status(404).json({ error: 'Exchange rate not configured' });
        }
        res.json({
            exchange_rate: parseFloat(setting.value),
            last_updated: setting.updated_at
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Update exchange rate (admin/owner/superuser only)
router.put('/exchange-rate', verifyToken, requireRole('admin', 'owner', 'superuser'), async (req, res) => {
    const { exchange_rate } = req.body;

    if (!exchange_rate || exchange_rate <= 0) {
        return res.status(400).json({ error: 'Invalid exchange rate' });
    }

    try {
        await dbRun(
            'UPDATE settings SET value = ?, updated_at = CURRENT_TIMESTAMP, updated_by = ? WHERE key = ?',
            [exchange_rate.toString(), req.user.id, 'exchange_rate']
        );

        res.json({
            message: 'Exchange rate updated successfully',
            exchange_rate: parseFloat(exchange_rate)
        });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;
