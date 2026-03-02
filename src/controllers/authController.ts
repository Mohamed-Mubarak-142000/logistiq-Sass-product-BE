import { Request, Response } from 'express';
import * as authService from '../services/authService';
import { AuthRequest } from '../middlewares/auth';

export const registerTenant = async (req: Request, res: Response) => {
    try {
        const result = await authService.registerTenant(req.body);
        res.status(201).json({
            success: true,
            data: result,
            message: 'Tenant registered successfully',
        });
    } catch (error: any) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;
        const result = await authService.login(email, password);
        res.status(200).json({
            success: true,
            data: result,
            message: 'Login successful',
        });
    } catch (error: any) {
        res.status(401).json({ success: false, message: error.message });
    }
};

export const resetPassword = async (req: AuthRequest, res: Response) => {
    try {
        const { newPassword } = req.body;
        const userId = req.user?.userId;
        const tenantId = req.user?.tenantId;

        if (!userId) throw new Error('Not authenticated');

        const result = await authService.resetPassword(userId, newPassword, tenantId || null);
        res.status(200).json(result);
    } catch (error: any) {
        res.status(400).json({ success: false, message: error.message });
    }
};
