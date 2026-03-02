import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import * as orderService from '../services/orderService';

export const createOrder = async (req: AuthRequest, res: Response) => {
    try {
        const tenantId = req.user!.tenantId;
        const order = await orderService.createOrder(req.body, tenantId.toString());
        res.status(201).json({ success: true, data: order });
    } catch (error: any) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const getOrders = async (req: AuthRequest, res: Response) => {
    try {
        const tenantId = req.user!.tenantId;
        const { page = 1, limit = 10, search = '' } = req.query;
        const options = {
            skip: (Number(page) - 1) * Number(limit),
            limit: Number(limit),
        };
        const result = await orderService.getOrders(tenantId.toString(), options, search as string);
        res.status(200).json({ success: true, data: result });
    } catch (error: any) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const getOrderById = async (req: AuthRequest, res: Response) => {
    try {
        const tenantId = req.user!.tenantId;
        const order = await orderService.getOrderById(req.params.id as string, tenantId.toString());
        res.status(200).json({ success: true, data: order });
    } catch (error: any) {
        res.status(404).json({ success: false, message: error.message });
    }
};

export const getDashboardStats = async (req: AuthRequest, res: Response) => {
    try {
        const tenantId = req.user!.tenantId;
        const stats = await orderService.getDashboardStats(tenantId.toString());
        res.status(200).json({ success: true, data: stats });
    } catch (error: any) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const updateOrder = async (req: AuthRequest, res: Response) => {
    try {
        const tenantId = req.user!.tenantId;
        const order = await orderService.updateOrder(req.params.id as string, req.body, tenantId.toString());
        res.status(200).json({ success: true, data: order });
    } catch (error: any) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const deleteOrder = async (req: AuthRequest, res: Response) => {
    try {
        const tenantId = req.user!.tenantId;
        await orderService.deleteOrder(req.params.id as string, tenantId.toString());
        res.status(200).json({ success: true, message: 'Order deleted successfully' });
    } catch (error: any) {
        res.status(400).json({ success: false, message: error.message });
    }
};
