import express from 'express';
import { dbGet, dbRun, dbAll } from '../db.js';
import { verifyToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Get current open shift
router.get('/current', verifyToken, async (req, res) => {
    try {
        const shift = await dbGet(`
            SELECT s.*, u.username as opened_by_name
            FROM shifts s
            LEFT JOIN users u ON s.opened_by = u.id
            WHERE s.status = 'open'
            ORDER BY s.opened_at DESC
            LIMIT 1
        `);

        if (shift) {
            // Get inventory for this shift
            const inventory = await dbAll(
                'SELECT * FROM shift_inventory WHERE shift_id = ?',
                [shift.id]
            );
            shift.inventory = inventory;
        }

        res.json(shift || null);
    } catch (error) {
        console.error('Error getting current shift:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Open new shift
router.post('/open', verifyToken, async (req, res) => {
    try {
        // Check if there's already an open shift
        const existingShift = await dbGet("SELECT id FROM shifts WHERE status = 'open'");
        if (existingShift) {
            return res.status(400).json({ error: 'Ya hay un turno abierto. Ciérralo antes de abrir uno nuevo.' });
        }

        // Create new shift
        const result = await dbRun(
            'INSERT INTO shifts (opened_by, status) VALUES (?, ?)',
            [req.user.id, 'open']
        );

        const shiftId = result.insertId;

        // Capture current inventory
        const products = await dbAll('SELECT id, name, quantity, units_per_box FROM products');

        for (const product of products) {
            await dbRun(
                'INSERT INTO shift_inventory (shift_id, product_id, product_name, initial_quantity, units_per_box) VALUES (?, ?, ?, ?, ?)',
                [shiftId, product.id, product.name, product.quantity, product.units_per_box || 1]
            );
        }

        res.status(201).json({
            message: 'Turno abierto exitosamente',
            shift_id: shiftId
        });
    } catch (error) {
        console.error('Error opening shift:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Close shift
router.post('/close', verifyToken, async (req, res) => {
    const { notes } = req.body;

    try {
        // Get current open shift
        const shift = await dbGet("SELECT id FROM shifts WHERE status = 'open'");
        if (!shift) {
            return res.status(400).json({ error: 'No hay turno abierto para cerrar.' });
        }

        // Update final quantities in shift_inventory
        const products = await dbAll('SELECT id, quantity FROM products');

        for (const product of products) {
            await dbRun(
                'UPDATE shift_inventory SET final_quantity = ? WHERE shift_id = ? AND product_id = ?',
                [product.quantity, shift.id, product.id]
            );
        }

        // Close the shift
        await dbRun(
            'UPDATE shifts SET status = ?, closed_at = NOW(), closed_by = ?, notes = ? WHERE id = ?',
            ['closed', req.user.id, notes || null, shift.id]
        );

        res.json({ message: 'Turno cerrado exitosamente' });
    } catch (error) {
        console.error('Error closing shift:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get shift history
router.get('/history', verifyToken, async (req, res) => {
    try {
        const shifts = await dbAll(`
            SELECT s.*, 
                   u1.username as opened_by_name,
                   u2.username as closed_by_name
            FROM shifts s
            LEFT JOIN users u1 ON s.opened_by = u1.id
            LEFT JOIN users u2 ON s.closed_by = u2.id
            ORDER BY s.opened_at DESC
            LIMIT 30
        `);

        res.json(shifts);
    } catch (error) {
        console.error('Error getting shift history:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get shift details with inventory comparison
router.get('/:id', verifyToken, async (req, res) => {
    try {
        const shift = await dbGet(`
            SELECT s.*, 
                   u1.username as opened_by_name,
                   u2.username as closed_by_name
            FROM shifts s
            LEFT JOIN users u1 ON s.opened_by = u1.id
            LEFT JOIN users u2 ON s.closed_by = u2.id
            WHERE s.id = ?
        `, [req.params.id]);

        if (!shift) {
            return res.status(404).json({ error: 'Turno no encontrado' });
        }

        // Get inventory for this shift
        const inventory = await dbAll(
            'SELECT * FROM shift_inventory WHERE shift_id = ?',
            [shift.id]
        );
        shift.inventory = inventory;

        res.json(shift);
    } catch (error) {
        console.error('Error getting shift details:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;
