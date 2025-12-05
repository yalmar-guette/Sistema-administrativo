import express from 'express';
import { dbRun, dbGet, dbAll } from '../db.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Middleware to check if user is superuser
const requireSuperuser = (req, res, next) => {
    if (!req.user.is_superuser) {
        return res.status(403).json({ error: 'Acceso solo para superusuario' });
    }
    next();
};

// Get all organizations (superuser sees all, others see their own)
router.get('/', verifyToken, async (req, res) => {
    try {
        let organizations;
        if (req.user.is_superuser) {
            organizations = await dbAll(`
                SELECT o.*, 
                    (SELECT COUNT(*) FROM inventories WHERE organization_id = o.id) as inventory_count,
                    (SELECT COUNT(*) FROM user_organizations WHERE organization_id = o.id) as user_count
                FROM organizations o
                ORDER BY o.name
            `);
        } else {
            organizations = await dbAll(`
                SELECT o.*, uo.role,
                    (SELECT COUNT(*) FROM inventories WHERE organization_id = o.id) as inventory_count,
                    (SELECT COUNT(*) FROM user_organizations WHERE organization_id = o.id) as user_count
                FROM organizations o
                JOIN user_organizations uo ON o.id = uo.organization_id
                WHERE uo.user_id = ?
                ORDER BY o.name
            `, [req.user.id]);
        }
        res.json(organizations);
    } catch (error) {
        console.error('Error fetching organizations:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Create organization (superuser only, or first organization for owner)
router.post('/', verifyToken, async (req, res) => {
    const { name } = req.body;

    if (!name) {
        return res.status(400).json({ error: 'Nombre es requerido' });
    }

    try {
        const result = await dbRun(
            'INSERT INTO organizations (name, created_by) VALUES (?, ?)',
            [name, req.user.id]
        );

        // If not superuser, add the creator as owner of the organization
        if (!req.user.is_superuser) {
            await dbRun(
                'INSERT INTO user_organizations (user_id, organization_id, role) VALUES (?, ?, ?)',
                [req.user.id, result.insertId, 'owner']
            );
        }

        const org = await dbGet('SELECT * FROM organizations WHERE id = ?', [result.insertId]);
        res.status(201).json(org);
    } catch (error) {
        console.error('Error creating organization:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Update organization
router.put('/:id', verifyToken, async (req, res) => {
    const { name } = req.body;
    const orgId = req.params.id;

    try {
        // Check permission (superuser or owner of org)
        if (!req.user.is_superuser) {
            const userOrg = await dbGet(
                'SELECT * FROM user_organizations WHERE user_id = ? AND organization_id = ? AND role = ?',
                [req.user.id, orgId, 'owner']
            );
            if (!userOrg) {
                return res.status(403).json({ error: 'No tienes permiso para editar esta organización' });
            }
        }

        await dbRun('UPDATE organizations SET name = ? WHERE id = ?', [name, orgId]);
        const org = await dbGet('SELECT * FROM organizations WHERE id = ?', [orgId]);
        res.json(org);
    } catch (error) {
        console.error('Error updating organization:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Delete organization (superuser only)
router.delete('/:id', verifyToken, requireSuperuser, async (req, res) => {
    try {
        await dbRun('DELETE FROM organizations WHERE id = ?', [req.params.id]);
        res.json({ message: 'Organización eliminada' });
    } catch (error) {
        console.error('Error deleting organization:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Get users in organization
router.get('/:id/users', verifyToken, async (req, res) => {
    try {
        const users = await dbAll(`
            SELECT u.id, u.username, u.email, uo.role
            FROM users u
            JOIN user_organizations uo ON u.id = uo.user_id
            WHERE uo.organization_id = ?
            ORDER BY u.username
        `, [req.params.id]);
        res.json(users);
    } catch (error) {
        console.error('Error fetching org users:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Add user to organization
router.post('/:id/users', verifyToken, async (req, res) => {
    const { user_id, role } = req.body;
    const orgId = req.params.id;

    try {
        await dbRun(
            'INSERT INTO user_organizations (user_id, organization_id, role) VALUES (?, ?, ?)',
            [user_id, orgId, role]
        );
        res.status(201).json({ message: 'Usuario agregado' });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'Usuario ya está en esta organización' });
        }
        console.error('Error adding user to org:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Update user role in organization
router.put('/:id/users/:userId', verifyToken, async (req, res) => {
    const { role } = req.body;

    try {
        await dbRun(
            'UPDATE user_organizations SET role = ? WHERE organization_id = ? AND user_id = ?',
            [role, req.params.id, req.params.userId]
        );
        res.json({ message: 'Rol actualizado' });
    } catch (error) {
        console.error('Error updating user role:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Remove user from organization
router.delete('/:id/users/:userId', verifyToken, async (req, res) => {
    try {
        await dbRun(
            'DELETE FROM user_organizations WHERE organization_id = ? AND user_id = ?',
            [req.params.id, req.params.userId]
        );
        res.json({ message: 'Usuario removido' });
    } catch (error) {
        console.error('Error removing user from org:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;
