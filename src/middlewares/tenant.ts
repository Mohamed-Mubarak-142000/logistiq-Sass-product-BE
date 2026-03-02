import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth';
import { UserRole } from '../models/User';

export const tenantIsolation = (req: AuthRequest, res: Response, next: NextFunction) => {
    // Super Admins bypass tenant isolation to access all data
    if (req.user && req.user.role === UserRole.SUPER_ADMIN) {
        return next();
    }

    if (!req.user || !req.user.tenantId) {
        return res.status(403).json({
            success: false,
            message: 'Tenant context is missing',
        });
    }
    // The tenantId is already attached to req.user by the auth middleware
    next();
};
