import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';

const DEFAULT_ADMIN_SECRET = 'change_me_admin_secret';

function hasValidAdminSecret(req: Request) {
    const configuredSecret = process.env.ADMIN_SECRET || DEFAULT_ADMIN_SECRET;
    const adminSecret = req.header('x-admin-secret');

    if (!adminSecret) {
        return false;
    }

    return adminSecret === configuredSecret;
}

function hasAdminRole(req: Request) {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return false;
    }

    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET || 'my_super_secret_key_1234567890123456';

    try {
        const decoded = jwt.verify(token, secret) as jwt.JwtPayload & { role?: string };
        (req as any).user = decoded;

        return decoded.role === 'Admin';
    } catch {
        return false;
    }
}

export const adminMiddleware = (req: Request, res: Response, next: NextFunction): void => {
    if (hasAdminRole(req) || hasValidAdminSecret(req)) {
        next();
        return;
    }

    res.status(403).json({ error: 'Admin access required' });
};
