import express from 'express';
import bcrypt from 'bcrypt';
import { dbGet, dbRun, dbAll } from '../db.js';
import { verifyToken } from '../middleware/auth.js';

const router = express.Router();

// Get users of current organization (filtered by organization_id from header)
router.get('/', verifyToken, async (req, res) => {
    try {
        const organizationId = req.headers['x-organization-id'];

        if (!organizationId && !req.user.is_superuser) {
            return res.status(400).json({ error: 'Debe seleccionar una organización' });
        }

        let users;
        if (req.user.is_superuser && !organizationId) {
            // Superuser without org selected sees all users
            users = await dbAll(`
                SELECT u.id, u.username, u.email, u.created_at, u.is_superuser
                FROM users u
                ORDER BY u.username
            `);
        } else {
            // Get users of specific organization with their role in that org
            users = await dbAll(`
                SELECT u.id, u.username, u.email, u.created_at, uo.role
                FROM users u
                JOIN user_organizations uo ON u.id = uo.user_id
                WHERE uo.organization_id = ?
                ORDER BY u.username
            `, [organizationId]);
        }

        res.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Delete user (owner/superuser only)
router.delete('/:id', verifyToken, async (req, res) => {
    try {
        const organizationId = req.headers['x-organization-id'];

        // Prevent deleting yourself
        if (req.user.id === parseInt(req.params.id)) {
            return res.status(400).json({ error: 'Cannot delete your own account' });
        }

        // Check permissions
        if (!req.user.is_superuser) {
            const userOrg = await dbGet(
                'SELECT * FROM user_organizations WHERE user_id = ? AND organization_id = ? AND role = ?',
                [req.user.id, organizationId, 'owner']
            );
            if (!userOrg) {
                return res.status(403).json({ error: 'Solo owners pueden eliminar usuarios' });
            }
        }

        // Remove user from organization (not delete user entirely, just unlink from org)
        if (organizationId) {
            await dbRun(
                'DELETE FROM user_organizations WHERE user_id = ? AND organization_id = ?',
                [req.params.id, organizationId]
            );
        } else {
            // Superuser can delete user completely
            await dbRun('DELETE FROM users WHERE id = ?', [req.params.id]);
        }

        res.json({ message: 'Usuario removido correctamente' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Change user password (owner/superuser or self)
router.put('/:id/password', verifyToken, async (req, res) => {
    try {
        const { newPassword, currentPassword } = req.body;
        const userId = parseInt(req.params.id);

        // Validate password
        if (!newPassword || newPassword.length < 6) {
            return res.status(400).json({ error: 'Password must be at least 6 characters' });
        }

        // Check if user exists
        const user = await dbGet('SELECT id, username, password FROM users WHERE id = ?', [userId]);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // If changing own password, verify current password
        if (req.user.id === userId && currentPassword) {
            const validPassword = bcrypt.compareSync(currentPassword, user.password);
            if (!validPassword) {
                return res.status(401).json({ error: 'Contraseña actual incorrecta' });
            }
        }

        // Hash new password and update
        const hashedPassword = bcrypt.hashSync(newPassword, 10);
        await dbRun('UPDATE users SET password = ? WHERE id = ?', [hashedPassword, userId]);

        res.json({ message: 'Password updated successfully' });
    } catch (error) {
        console.error('Error updating password:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Update user profile (self only)
router.put('/:id', verifyToken, async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const { username, email } = req.body;

        // Only allow users to update their own profile
        if (req.user.id !== userId && !req.user.is_superuser) {
            return res.status(403).json({ error: 'No tienes permiso para editar este usuario' });
        }

        // Check if user exists
        const user = await dbGet('SELECT id FROM users WHERE id = ?', [userId]);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        // Update user
        await dbRun(
            'UPDATE users SET username = ?, email = ? WHERE id = ?',
            [username, email, userId]
        );

        res.json({ message: 'Perfil actualizado correctamente' });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(400).json({ error: 'Username o email ya existe' });
        }
        console.error('Error updating profile:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Update user role in organization (owner only)
router.put('/:id/role', verifyToken, async (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const { role } = req.body;
        const organizationId = req.headers['x-organization-id'];

        if (!organizationId) {
            return res.status(400).json({ error: 'Debe seleccionar una organización' });
        }

        // Check permissions - only owner can change roles
        if (!req.user.is_superuser) {
            const userOrg = await dbGet(
                'SELECT * FROM user_organizations WHERE user_id = ? AND organization_id = ? AND role = ?',
                [req.user.id, organizationId, 'owner']
            );
            if (!userOrg) {
                return res.status(403).json({ error: 'Solo owners pueden cambiar roles' });
            }
        }

        // Validate role
        if (!['owner', 'admin', 'employee'].includes(role)) {
            return res.status(400).json({ error: 'Rol inválido' });
        }

        // Update role
        await dbRun(
            'UPDATE user_organizations SET role = ? WHERE user_id = ? AND organization_id = ?',
            [role, userId, organizationId]
        );

        res.json({ message: 'Rol actualizado correctamente' });
    } catch (error) {
        console.error('Error updating role:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

export default router;
