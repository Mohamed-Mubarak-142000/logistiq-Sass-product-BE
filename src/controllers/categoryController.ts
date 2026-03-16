import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { UserRole } from '../models/User';
import * as categoryService from '../services/categoryService';

export const getCategories = async (req: AuthRequest, res: Response) => {
    try {
        const { companyId, storeId } = req.query;
        const isSuperAdmin = req.user!.role === UserRole.SUPER_ADMIN;
        const tenantId = (isSuperAdmin && companyId)
            ? companyId
            : req.user!.tenantId;

        const categories = await categoryService.getCategories(isSuperAdmin ? (companyId as string | undefined) : tenantId.toString(), { storeId });
        res.status(200).json({ success: true, data: categories });
    } catch (error: any) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const createCategory = async (req: AuthRequest, res: Response) => {
    try {
        const { companyId, ...payload } = req.body;
        const imageUrl = req.file?.path;
        const isSuperAdmin = req.user!.role === UserRole.SUPER_ADMIN;
        if (isSuperAdmin && !companyId) {
            return res.status(400).json({ success: false, message: 'Company is required for category creation.' });
        }
        if (!imageUrl) {
            return res.status(400).json({ success: false, message: 'Category image is required.' });
        }
        const tenantId = (isSuperAdmin && companyId)
            ? companyId
            : req.user!.tenantId;

        const category = await categoryService.createCategory({ ...payload, imageUrl }, tenantId.toString());
        res.status(201).json({ success: true, data: category });
    } catch (error: any) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const updateCategory = async (req: AuthRequest, res: Response) => {
    try {
        const { companyId, ...payload } = req.body;
        const imageUrl = req.file?.path;
        const isSuperAdmin = req.user!.role === UserRole.SUPER_ADMIN;
        const tenantId = (isSuperAdmin && companyId)
            ? companyId
            : req.user!.tenantId;

        const updatePayload = imageUrl ? { ...payload, imageUrl } : payload;
        const category = await categoryService.updateCategory(req.params.id as string, updatePayload, tenantId.toString(), isSuperAdmin);
        res.status(200).json({ success: true, data: category });
    } catch (error: any) {
        res.status(400).json({ success: false, message: error.message });
    }
};
