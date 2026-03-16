import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import * as storeService from '../services/storeService';

export const createStore = async (req: AuthRequest, res: Response) => {
    try {
        const tenantId = req.user!.tenantId;
        const result = await storeService.createStore(req.body, tenantId.toString());
        res.status(201).json({ success: true, data: result });
    } catch (error: any) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const getStores = async (req: AuthRequest, res: Response) => {
    try {
        const tenantId = req.user!.tenantId;
        const { page = 1, limit = 10, search = '', sortBy = 'createdAt', order = 'desc', ...filters } = req.query;
        const options = {
            skip: (Number(page) - 1) * Number(limit),
            limit: Number(limit),
            sort: { [sortBy as string]: order === 'asc' ? 1 : -1 },
        };
        if (filters.isActive !== undefined) {
            (filters as any).isActive = String(filters.isActive) === 'true';
        }
        const result = await storeService.getStores(tenantId.toString(), options, search as string, filters);
        res.status(200).json({ success: true, data: result });
    } catch (error: any) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const getStoreById = async (req: AuthRequest, res: Response) => {
    try {
        const tenantId = req.user!.tenantId;
        const store = await storeService.getStoreById(req.params.id as string, tenantId.toString());
        res.status(200).json({ success: true, data: store });
    } catch (error: any) {
        res.status(404).json({ success: false, message: error.message });
    }
};

export const updateStore = async (req: AuthRequest, res: Response) => {
    try {
        const tenantId = req.user!.tenantId;
        const store = await storeService.updateStore(req.params.id as string, req.body, tenantId.toString());
        res.status(200).json({ success: true, data: store });
    } catch (error: any) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const deleteStore = async (req: AuthRequest, res: Response) => {
    try {
        const tenantId = req.user!.tenantId;
        await storeService.deleteStore(req.params.id as string, tenantId.toString());
        res.status(200).json({ success: true, message: 'Store deleted successfully' });
    } catch (error: any) {
        res.status(400).json({ success: false, message: error.message });
    }
};

