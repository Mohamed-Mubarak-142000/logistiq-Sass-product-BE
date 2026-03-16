import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { UserRole } from '../models/User';
import * as productService from '../services/productService';
import { createActivityLog } from '../services/activityLogService';

export const createProduct = async (req: AuthRequest, res: Response) => {
    try {
        const { companyId, ...payload } = req.body;
        const imageUrl = req.file?.path;
        const isSuperAdmin = req.user!.role === UserRole.SUPER_ADMIN;
        if (isSuperAdmin && !companyId) {
            return res.status(400).json({ success: false, message: 'Company is required for product creation.' });
        }
        const tenantId = (isSuperAdmin && companyId) ? companyId : req.user!.tenantId;
        const createPayload = imageUrl ? { ...payload, imageUrl } : payload;
        const product = await productService.createProduct(createPayload, tenantId.toString());
        await createActivityLog({
            action: 'PRODUCT_CREATED',
            tenantId: tenantId.toString(),
            actorId: req.user!.userId,
            actorRole: req.user!.role,
            entityType: 'Product',
            entityId: product._id?.toString(),
            metadata: { name: product.name, sku: product.sku }
        });
        res.status(201).json({ success: true, data: product });
    } catch (error: any) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const getProducts = async (req: AuthRequest, res: Response) => {
    try {
        const isSuperAdmin = req.user!.role === UserRole.SUPER_ADMIN;
        const tenantId = req.user!.tenantId;
        const { page = 1, limit = 10, search = '', sortBy = 'createdAt', order = 'desc', companyId, ...filters } = req.query;
        
        // Ensure sortBy is not an empty string
        const effectiveSortBy = (sortBy && sortBy !== '') ? (sortBy as string) : 'createdAt';
        const effectiveOrder = order === 'asc' ? 1 : -1;

        const options = {
            skip: (Number(page) - 1) * Number(limit),
            limit: Number(limit),
            sort: { [effectiveSortBy]: effectiveOrder }
        };
        const effectiveTenantId = isSuperAdmin ? (companyId as string | undefined) : tenantId;
        const result = await productService.getProducts(effectiveTenantId, options, search as string, filters);
        res.status(200).json({ success: true, data: result });
    } catch (error: any) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const getProductById = async (req: AuthRequest, res: Response) => {
    try {
        const isSuperAdmin = req.user!.role === UserRole.SUPER_ADMIN;
        const tenantId = req.user!.tenantId;
        const product = await productService.getProductById(req.params.id as string, isSuperAdmin ? undefined : tenantId);
        res.status(200).json({ success: true, data: product });
    } catch (error: any) {
        res.status(404).json({ success: false, message: error.message });
    }
};

export const updateProduct = async (req: AuthRequest, res: Response) => {
    try {
        const isSuperAdmin = req.user!.role === UserRole.SUPER_ADMIN;
        const tenantId = req.user!.tenantId;
        const { companyId, ...payload } = req.body;
        const imageUrl = req.file?.path;
        const effectiveTenantId = isSuperAdmin && companyId ? companyId : tenantId;
        const updatePayload = imageUrl ? { ...payload, imageUrl } : payload;
        const product = await productService.updateProduct(req.params.id as string, updatePayload, effectiveTenantId, isSuperAdmin);
        await createActivityLog({
            action: payload.stock !== undefined ? 'INVENTORY_CHANGED' : 'PRODUCT_UPDATED',
            tenantId: effectiveTenantId.toString(),
            actorId: req.user!.userId,
            actorRole: req.user!.role,
            entityType: 'Product',
            entityId: product._id?.toString(),
            metadata: { name: product.name, sku: product.sku, stock: payload.stock }
        });
        res.status(200).json({ success: true, data: product });
    } catch (error: any) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const deleteProduct = async (req: AuthRequest, res: Response) => {
    try {
        const isSuperAdmin = req.user!.role === UserRole.SUPER_ADMIN;
        const tenantId = req.user!.tenantId;
        const target = await productService.getProductById(req.params.id as string, isSuperAdmin ? undefined : tenantId);
        await productService.deleteProduct(req.params.id as string, tenantId, isSuperAdmin);
        await createActivityLog({
            action: 'PRODUCT_UPDATED',
            tenantId: target.tenantId?.toString() || tenantId.toString(),
            actorId: req.user!.userId,
            actorRole: req.user!.role,
            entityType: 'Product',
            entityId: req.params.id as string,
            metadata: { isActive: false }
        });
        res.status(200).json({ success: true, message: 'Product deleted successfully' });
    } catch (error: any) {
        res.status(400).json({ success: false, message: error.message });
    }
};
