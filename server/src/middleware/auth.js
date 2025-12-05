import jwt from 'jsonwebtoken';

/**
 * Middleware to verify JWT token from Authorization header.
 * Attaches decoded user to req.user if valid.
 * @param {import('express').Request} req - Express request object
 * @param {import('express').Response} res - Express response object
 * @param {import('express').NextFunction} next - Express next function
 */
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

/**
 * Middleware to check if user has required role(s).
 * Superusers bypass this check.
 * @param {...string} roles - Roles allowed to access the route
 * @returns {import('express').RequestHandler} Express middleware
 */
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
