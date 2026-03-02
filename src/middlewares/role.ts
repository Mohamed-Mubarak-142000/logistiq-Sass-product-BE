import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';

export const authorize = (roles: string[]) => {
    return (req: AuthRequest, res: Response, next: NextFunction) => {
        if (!req.user || !roles.includes(req.user.role)) {
            return res.status(403).json({
                success: false,
                message: 'Access denied: You do not have the required permissions',
            });
        }
        next();
    };
};
