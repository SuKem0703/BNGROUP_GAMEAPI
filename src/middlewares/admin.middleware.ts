import { Request, Response, NextFunction } from 'express';

const DEFAULT_ADMIN_SECRET = 'change_me_admin_secret';

export const adminMiddleware = (req: Request, res: Response, next: NextFunction): void => {
    const configuredSecret = process.env.ADMIN_SECRET || DEFAULT_ADMIN_SECRET;
    const adminSecret = req.header('x-admin-secret');

    if (!adminSecret) {
        res.status(401).json({ error: 'Admin secret missing' });
        return;
    }

    if (adminSecret !== configuredSecret) {
        res.status(403).json({ error: 'Admin secret invalid' });
        return;
    }

    next();
};
