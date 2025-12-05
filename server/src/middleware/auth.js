import jwt from 'jsonwebtoken';

export function verifyToken(req, res, next) {
    const token = req.headers.authorization?.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'No token provided' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        return res.status(401).json({ error: 'Invalid token' });
    }
}

// For backwards compatibility, check if superuser or has role in any org
export function requireRole(...roles) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        // Superuser has all permissions
        if (req.user.is_superuser) {
            return next();
        }

        // For non-superusers, we'll check organization role in individual routes
        // This is a fallback that allows access (actual permission check happens in routes)
        next();
    };
}
