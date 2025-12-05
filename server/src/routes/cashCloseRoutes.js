import express from 'express';
import { dbGet, dbRun, dbAll } from '../db.js';
import { verifyToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Get products for closing (current system quantities, filtered by inventory)
router.get('/products', verifyToken, async (req, res) => {
    try {
        const inventoryId = req.headers['x-inventory-id'];

        if (!inventoryId) {
            return res.status(400).json({ error: 'Debe seleccionar un inventario' });
        }

        const products = await dbAll(
            'SELECT id, name, quantity, units_per_box, unit_price FROM products WHERE inventory_id = ? ORDER BY name',
            [inventoryId]
        );
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

    const inventoryId = req.headers['x-inventory-id'];
    if (!inventoryId) {
        return res.status(400).json({ error: 'Debe seleccionar un inventario' });
    }

    try {
        const date = close_date || new Date().toISOString().split('T')[0];

        for (const item of items) {
            const difference = item.system_quantity - item.physical_quantity;

            await dbRun(
                `INSERT INTO cash_closes (close_date, product_id, product_name, system_quantity, physical_quantity, difference, units_per_box, inventory_id, created_by)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [date, item.product_id, item.product_name, item.system_quantity, item.physical_quantity, difference, item.units_per_box || 1, inventoryId, req.user.id]
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

// Get close history (filtered by inventory)
router.get('/history', verifyToken, async (req, res) => {
    try {
        const inventoryId = req.headers['x-inventory-id'];

        if (!inventoryId) {
            return res.status(400).json({ error: 'Debe seleccionar un inventario' });
        }

        const closes = await dbAll(`
            SELECT close_date, 
                   SUM(ABS(difference)) as total_difference,
                   COUNT(DISTINCT product_id) as products_count,
                   created_by
            FROM cash_closes 
            WHERE inventory_id = ?
            GROUP BY close_date, created_by
            ORDER BY close_date DESC
            LIMIT 30
        `, [inventoryId]);
        res.json(closes);
    } catch (error) {
        console.error('Error loading close history:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get close details by date (filtered by inventory)
router.get('/details/:date', verifyToken, async (req, res) => {
    try {
        const inventoryId = req.headers['x-inventory-id'];

        if (!inventoryId) {
            return res.status(400).json({ error: 'Debe seleccionar un inventario' });
        }

        const details = await dbAll(
            'SELECT * FROM cash_closes WHERE close_date = ? AND inventory_id = ? ORDER BY product_name',
            [req.params.date, inventoryId]
        );
        res.json(details);
    } catch (error) {
        console.error('Error loading close details:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;
