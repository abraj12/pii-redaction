import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/User';
import { env } from '../config/env';

export interface AuthRequest extends Request {
    user?: any;
}

const tokenFromRequest = (req: Request): string | null => {
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        return req.headers.authorization.split(' ')[1] || null;
    }
    return null;
};

const attachCurrentUser = async (req: AuthRequest, token: string): Promise<boolean> => {
    const decoded = jwt.verify(token, env.jwtSecret) as { id?: string };
    if (!decoded.id) return false;
    const user = await User.findById(decoded.id).select('-password');
    if (!user || user.status !== 'active') return false;
    req.user = {
        id: user._id.toString(),
        role: user.role,
        email: user.email,
        name: user.name
    };
    return true;
};

export const protect = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const token = tokenFromRequest(req);
    if (!token) {
        res.status(401).json({ error: 'Not authorized, no token' });
        return;
    }

    try {
        const ok = await attachCurrentUser(req, token);
        if (!ok) {
            res.status(401).json({ error: 'Not authorized' });
            return;
        }
        next();
    } catch (error) {
        res.status(401).json({ error: 'Not authorized, token failed' });
    }
};

export const optionalAuth = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
    const token = tokenFromRequest(req);
    if (!token) {
        next();
        return;
    }

    try {
        await attachCurrentUser(req, token);
    } catch (error) {
        // Invalid optional token means the request continues as anonymous.
    }
    next();
};

export const adminProtect = (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({ error: 'Not authorized as an admin' });
    }
};
