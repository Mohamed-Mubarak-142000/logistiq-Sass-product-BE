import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import * as warehouseService from '../services/warehouseService';

export const createWarehouse = async (req: AuthRequest, res: Response) => {
    try {
        const { companyId } = req.body;
        // If super admin and companyId is provided, use that. Otherwise use current user's tenantId.
        const tenantId = (req.user!.role === 'SUPER_ADMIN' && companyId) ? companyId : req.user!.tenantId;
        const warehouse = await warehouseService.createWarehouse(req.body, tenantId.toString());
        res.status(201).json({ success: true, data: warehouse });
    } catch (error: any) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const getWarehouses = async (req: AuthRequest, res: Response) => {
    try {
        const tenantId = req.user!.tenantId;
        const { page = 1, limit = 10, search = '' } = req.query;
        const options = {
            skip: (Number(page) - 1) * Number(limit),
            limit: Number(limit),
        };
        const result = await warehouseService.getWarehouses(tenantId.toString(), options, search as string);
        res.status(200).json({ success: true, data: result });
    } catch (error: any) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const getWarehouseById = async (req: AuthRequest, res: Response) => {
    try {
        const tenantId = req.user!.tenantId;
        const warehouse = await warehouseService.getWarehouseById(req.params.id as string, tenantId.toString());
        res.status(200).json({ success: true, data: warehouse });
    } catch (error: any) {
        res.status(404).json({ success: false, message: error.message });
    }
};

export const updateWarehouse = async (req: AuthRequest, res: Response) => {
    try {
        const tenantId = req.user!.tenantId;
        const warehouse = await warehouseService.updateWarehouse(req.params.id as string, req.body, tenantId.toString());
        res.status(200).json({ success: true, data: warehouse });
    } catch (error: any) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const deleteWarehouse = async (req: AuthRequest, res: Response) => {
    try {
        const tenantId = req.user!.tenantId;
        await warehouseService.deleteWarehouse(req.params.id as string, tenantId.toString());
        res.status(200).json({ success: true, message: 'Warehouse deleted successfully' });
    } catch (error: any) {
        res.status(400).json({ success: false, message: error.message });
    }
};
