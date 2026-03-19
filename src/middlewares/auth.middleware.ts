import { Request, Response, NextFunction } from 'express';
import * as jwt from 'jsonwebtoken';

export const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Token missing or invalid' });
        return;
    }

    const token = authHeader.split(' ')[1];

    try {
        const secret = process.env.JWT_SECRET || 'my_super_secret_key_1234567890123456';
        const decoded = jwt.verify(token, secret);
        
        // Gắn thông tin giải mã được vào request để các Controller sử dụng
        (req as any).user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Token expired or invalid' });
    }
};