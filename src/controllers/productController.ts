import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import * as productService from '../services/productService';

export const createProduct = async (req: AuthRequest, res: Response) => {
    try {
        const tenantId = req.user!.tenantId;
        const product = await productService.createProduct(req.body, tenantId);
        res.status(201).json({ success: true, data: product });
    } catch (error: any) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const getProducts = async (req: AuthRequest, res: Response) => {
    try {
        const tenantId = req.user!.tenantId;
        const { page = 1, limit = 10, search = '', sortBy = 'createdAt', order = 'desc', ...filters } = req.query;
        
        // Ensure sortBy is not an empty string
        const effectiveSortBy = (sortBy && sortBy !== '') ? (sortBy as string) : 'createdAt';
        const effectiveOrder = order === 'asc' ? 1 : -1;

        const options = {
            skip: (Number(page) - 1) * Number(limit),
            limit: Number(limit),
            sort: { [effectiveSortBy]: effectiveOrder }
        };
        const result = await productService.getProducts(tenantId, options, search as string, filters);
        res.status(200).json({ success: true, data: result });
    } catch (error: any) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const getProductById = async (req: AuthRequest, res: Response) => {
    try {
        const tenantId = req.user!.tenantId;
        const product = await productService.getProductById(req.params.id as string, tenantId);
        res.status(200).json({ success: true, data: product });
    } catch (error: any) {
        res.status(404).json({ success: false, message: error.message });
    }
};

export const updateProduct = async (req: AuthRequest, res: Response) => {
    try {
        const tenantId = req.user!.tenantId;
        const product = await productService.updateProduct(req.params.id as string, req.body, tenantId);
        res.status(200).json({ success: true, data: product });
    } catch (error: any) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const deleteProduct = async (req: AuthRequest, res: Response) => {
    try {
        const tenantId = req.user!.tenantId;
        await productService.deleteProduct(req.params.id as string, tenantId);
        res.status(200).json({ success: true, message: 'Product deleted successfully' });
    } catch (error: any) {
        res.status(400).json({ success: false, message: error.message });
    }
};
