import express from 'express';
import { dbRun, dbGet, dbAll } from '../db.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Get inventories for an organization
router.get('/organization/:orgId', verifyToken, async (req, res) => {
    try {
        const inventories = await dbAll(`
            SELECT i.*, 
                (SELECT COUNT(*) FROM products WHERE inventory_id = i.id) as product_count
            FROM inventories i
            WHERE i.organization_id = ?
            ORDER BY i.name
        `, [req.params.orgId]);
        res.json(inventories);
    } catch (error) {
        console.error('Error fetching inventories:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get single inventory
router.get('/:id', verifyToken, async (req, res) => {
    try {
        const inventory = await dbGet(`
            SELECT i.*, o.name as organization_name
            FROM inventories i
            JOIN organizations o ON i.organization_id = o.id
            WHERE i.id = ?
        `, [req.params.id]);

        if (!inventory) {
            return res.status(404).json({ error: 'Inventario no encontrado' });
        }
        res.json(inventory);
    } catch (error) {
        console.error('Error fetching inventory:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Create inventory
router.post('/', verifyToken, async (req, res) => {
    const { organization_id, name } = req.body;

    if (!organization_id || !name) {
        return res.status(400).json({ error: 'organization_id y name son requeridos' });
    }

    try {
        // Check user has access to organization
        if (!req.user.is_superuser) {
            const userOrg = await dbGet(
                'SELECT * FROM user_organizations WHERE user_id = ? AND organization_id = ? AND role IN (?, ?)',
                [req.user.id, organization_id, 'owner', 'admin']
            );
            if (!userOrg) {
                return res.status(403).json({ error: 'No tienes permiso para crear inventarios en esta organización' });
            }
        }

        const result = await dbRun(
            'INSERT INTO inventories (organization_id, name) VALUES (?, ?)',
            [organization_id, name]
        );

        const inventory = await dbGet('SELECT * FROM inventories WHERE id = ?', [result.insertId]);
        res.status(201).json(inventory);
    } catch (error) {
        console.error('Error creating inventory:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Update inventory
router.put('/:id', verifyToken, async (req, res) => {
    const { name } = req.body;

    try {
        await dbRun('UPDATE inventories SET name = ? WHERE id = ?', [name, req.params.id]);
        const inventory = await dbGet('SELECT * FROM inventories WHERE id = ?', [req.params.id]);
        res.json(inventory);
    } catch (error) {
        console.error('Error updating inventory:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Delete inventory
router.delete('/:id', verifyToken, async (req, res) => {
    try {
        await dbRun('DELETE FROM inventories WHERE id = ?', [req.params.id]);
        res.json({ message: 'Inventario eliminado' });
    } catch (error) {
        console.error('Error deleting inventory:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;
