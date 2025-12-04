import express from 'express';
import { dbGet, dbRun, dbAll } from '../db.js';
import { verifyToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Get products for closing (current system quantities)
router.get('/products', verifyToken, async (req, res) => {
    try {
        const products = await dbAll('SELECT id, name, quantity, units_per_box, unit_price FROM products ORDER BY name');
        res.json(products);
    } catch (error) {
        console.error('Error loading products for close:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Save cash close
router.post('/', verifyToken, requireRole('admin', 'owner', 'superuser'), async (req, res) => {
    const { items, close_date } = req.body;

    if (!items || items.length === 0) {
        return res.status(400).json({ error: 'No items to save' });
    }

    try {
        const date = close_date || new Date().toISOString().split('T')[0];

        for (const item of items) {
            const difference = item.system_quantity - item.physical_quantity;

            await dbRun(
                `INSERT INTO cash_closes (close_date, product_id, product_name, system_quantity, physical_quantity, difference, units_per_box, created_by)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [date, item.product_id, item.product_name, item.system_quantity, item.physical_quantity, difference, item.units_per_box || 1, req.user.id]
            );

            // Update product quantity to match physical count
            await dbRun(
                'UPDATE products SET quantity = ? WHERE id = ?',
                [item.physical_quantity, item.product_id]
            );
        }

        res.status(201).json({ message: 'Cierre guardado exitosamente' });
    } catch (error) {
        console.error('Error saving cash close:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get close history
router.get('/history', verifyToken, async (req, res) => {
    try {
        const closes = await dbAll(`
            SELECT close_date, 
                   SUM(ABS(difference)) as total_difference,
                   COUNT(DISTINCT product_id) as products_count,
                   created_by
            FROM cash_closes 
            GROUP BY close_date, created_by
            ORDER BY close_date DESC
            LIMIT 30
        `);
        res.json(closes);
    } catch (error) {
        console.error('Error loading close history:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get close details by date
router.get('/details/:date', verifyToken, async (req, res) => {
    try {
        const details = await dbAll(
            'SELECT * FROM cash_closes WHERE close_date = ? ORDER BY product_name',
            [req.params.date]
        );
        res.json(details);
    } catch (error) {
        console.error('Error loading close details:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;
