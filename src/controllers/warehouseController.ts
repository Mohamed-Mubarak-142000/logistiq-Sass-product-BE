import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import * as warehouseService from '../services/warehouseService';
import Tenant from '../models/Tenant';
import { createActivityLog } from '../services/activityLogService';

export const createWarehouse = async (req: AuthRequest, res: Response) => {
    try {
        const { companyId } = req.body;
        const isSuperAdmin = req.user!.role === 'SUPER_ADMIN';
        if (isSuperAdmin && !companyId) {
            return res.status(400).json({ success: false, message: 'Company is required for warehouse creation.' });
        }
        if (isSuperAdmin && companyId) {
            const companyExists = await Tenant.findById(companyId).select('_id').lean();
            if (!companyExists) {
                return res.status(404).json({ success: false, message: 'Company not found.' });
            }
        }
        // If super admin and companyId is provided, use that. Otherwise use current user's tenantId.
        const tenantId = (isSuperAdmin && companyId) ? companyId : req.user!.tenantId;
        const warehouse = await warehouseService.createWarehouse(req.body, tenantId.toString(), tenantId.toString());
        await createActivityLog({
            action: 'WAREHOUSE_CREATED',
            tenantId: tenantId.toString(),
            actorId: req.user!.userId,
            actorRole: req.user!.role,
            entityType: 'Warehouse',
            entityId: warehouse.warehouse?._id?.toString() || warehouse._id?.toString(),
            metadata: { name: warehouse.warehouse?.name || warehouse.name }
        });
        res.status(201).json({ success: true, data: warehouse });
    } catch (error: any) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const getWarehouses = async (req: AuthRequest, res: Response) => {
    try {
        const tenantId = req.user!.tenantId;
        const isSuperAdmin = req.user!.role === 'SUPER_ADMIN';
        const { page = 1, limit = 10, search = '', sortBy = 'createdAt', order = 'desc', ...filters } = req.query;
        const sortByValue = Array.isArray(sortBy) ? sortBy[0] : sortBy;
        const orderValue = Array.isArray(order) ? order[0] : order;
        const sortKey = typeof sortByValue === 'string' && sortByValue.trim() !== '' ? sortByValue : 'createdAt';
        const sortDirection = orderValue === 'asc' ? 1 : -1;
        const options = {
            skip: (Number(page) - 1) * Number(limit),
            limit: Number(limit),
            sort: { [sortKey]: sortDirection },
        };
        if (filters.isActive !== undefined) {
            (filters as any).isActive = String(filters.isActive) === 'true';
        }
        const result = await warehouseService.getWarehouses(isSuperAdmin ? undefined : tenantId.toString(), options, search as string, filters);
        res.status(200).json({ success: true, data: result });
    } catch (error: any) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const getWarehouseById = async (req: AuthRequest, res: Response) => {
    try {
        const tenantId = req.user!.tenantId;
        const isSuperAdmin = req.user!.role === 'SUPER_ADMIN';
        const warehouse = await warehouseService.getWarehouseById(
            req.params.id as string,
            isSuperAdmin ? undefined : tenantId.toString()
        );
        res.status(200).json({ success: true, data: warehouse });
    } catch (error: any) {
        res.status(404).json({ success: false, message: error.message });
    }
};

export const updateWarehouse = async (req: AuthRequest, res: Response) => {
    try {
        const { companyId } = req.body;
        const isSuperAdmin = req.user!.role === 'SUPER_ADMIN';
        if (isSuperAdmin && companyId) {
            const companyExists = await Tenant.findById(companyId).select('_id').lean();
            if (!companyExists) {
                return res.status(404).json({ success: false, message: 'Company not found.' });
            }
        }
        const tenantId = req.user!.tenantId;
        const effectiveCompanyId = isSuperAdmin && companyId ? companyId : tenantId.toString();
        const warehouse = await warehouseService.updateWarehouse(
            req.params.id as string,
            req.body,
            tenantId.toString(),
            effectiveCompanyId,
            isSuperAdmin
        );
        await createActivityLog({
            action: 'WAREHOUSE_UPDATED',
            tenantId: effectiveCompanyId.toString(),
            actorId: req.user!.userId,
            actorRole: req.user!.role,
            entityType: 'Warehouse',
            entityId: req.params.id as string,
            metadata: { name: warehouse.name }
        });
        res.status(200).json({ success: true, data: warehouse });
    } catch (error: any) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const deleteWarehouse = async (req: AuthRequest, res: Response) => {
    try {
        const tenantId = req.user!.tenantId;
        const isSuperAdmin = req.user!.role === 'SUPER_ADMIN';
        await warehouseService.deleteWarehouse(req.params.id as string, tenantId.toString(), isSuperAdmin);
        res.status(200).json({ success: true, message: 'Warehouse deleted successfully' });
    } catch (error: any) {
        res.status(400).json({ success: false, message: error.message });
    }
};
