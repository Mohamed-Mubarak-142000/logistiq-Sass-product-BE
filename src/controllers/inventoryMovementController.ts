import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import * as inventoryMovementService from '../services/inventoryMovementService';

export const createMovement = async (req: AuthRequest, res: Response) => {
    try {
        const tenantId = req.user!.tenantId;
        const movement = await inventoryMovementService.createMovement({ ...req.body, userId: req.user!.userId }, tenantId.toString());
        res.status(201).json({ success: true, data: movement });
    } catch (error: any) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const getMovements = async (req: AuthRequest, res: Response) => {
    try {
        const tenantId = req.user!.tenantId;
        const { page = 1, limit = 10, ...filter } = req.query;
        const options = {
            skip: (Number(page) - 1) * Number(limit),
            limit: Number(limit),
            sort: { createdAt: -1 }
        };
        const result = await inventoryMovementService.getMovements(tenantId.toString(), options, filter);
        res.status(200).json({ success: true, data: result });
    } catch (error: any) {
        res.status(400).json({ success: false, message: error.message });
    }
};
