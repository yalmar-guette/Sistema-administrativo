import express from 'express';
import { dbGet, dbRun, dbAll } from '../db.js';
import { verifyToken, requireRole } from '../middleware/auth.js';

const router = express.Router();

// Get all products
router.get('/', verifyToken, async (req, res) => {
    try {
        const products = await dbAll('SELECT * FROM products ORDER BY created_at DESC');
        res.json(products);
    } catch (error) {
        console.error('Error loading products:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get single product
router.get('/:id', verifyToken, async (req, res) => {
    try {
        const product = await dbGet('SELECT * FROM products WHERE id = ?', [req.params.id]);
        if (!product) {
            return res.status(404).json({ error: 'Product not found' });
        }
        res.json(product);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

// Create product
router.post('/', verifyToken, async (req, res) => {
    const { name, description, sku, quantity, unit_price, category } = req.body;

    try {
        const result = await dbRun(
            'INSERT INTO products (name, description, sku, quantity, unit_price, category, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [name, description, sku || null, quantity || 0, unit_price || 0, category, req.user.id]
        );

        const product = await dbGet('SELECT * FROM products WHERE id = ?', [result.insertId]);
        res.status(201).json(product);
    } catch (error) {
        console.error('Error creating product:', error.message, error.code, error.sqlMessage);
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'SKU already exists' });
        }
        res.status(500).json({ error: 'Server error: ' + error.message });
    }
});

// Update product
router.put('/:id', verifyToken, async (req, res) => {
    const { name, description, sku, quantity, unit_price, category } = req.body;

    try {
        await dbRun(
            'UPDATE products SET name = ?, description = ?, sku = ?, quantity = ?, unit_price = ?, category = ? WHERE id = ?',
            [name, description, sku, quantity, unit_price, category, req.params.id]
        );

        const product = await dbGet('SELECT * FROM products WHERE id = ?', [req.params.id]);
        res.json(product);
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Delete product (admin/owner/superuser only)
router.delete('/:id', verifyToken, requireRole('admin', 'owner', 'superuser'), async (req, res) => {
    try {
        await dbRun('DELETE FROM products WHERE id = ?', [req.params.id]);
        res.json({ message: 'Product deleted successfully' });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;
