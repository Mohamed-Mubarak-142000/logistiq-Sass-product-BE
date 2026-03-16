import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import * as orderService from '../services/orderService';
import { createActivityLog } from '../services/activityLogService';

export const createOrder = async (req: AuthRequest, res: Response) => {
    try {
        const tenantId = req.user!.tenantId;
        const order = await orderService.createOrder(req.body, tenantId.toString());
        await createActivityLog({
            action: 'ORDER_CREATED',
            tenantId: tenantId.toString(),
            actorId: req.user!.userId,
            actorRole: req.user!.role,
            entityType: 'Order',
            entityId: order._id?.toString(),
            metadata: { orderNumber: order.orderNumber, totalAmount: order.totalAmount }
        });
        res.status(201).json({ success: true, data: order });
    } catch (error: any) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const getOrders = async (req: AuthRequest, res: Response) => {
    try {
        const tenantId = req.user!.tenantId;
        const isSuperAdmin = req.user!.role === 'SUPER_ADMIN';
        const { page = 1, limit = 10, search = '', status, driverId, storeId, warehouseId, sortBy = 'createdAt', order = 'desc', companyId } = req.query;
        const options = {
            skip: (Number(page) - 1) * Number(limit),
            limit: Number(limit),
            sort: { [sortBy as string]: order === 'asc' ? 1 : -1 }
        };
        const filters: any = {};
        if (status) filters.status = status;
        if (driverId) filters.driverId = driverId;
        if (storeId) filters.storeId = storeId;
        if (warehouseId) filters.warehouseId = warehouseId;

        const effectiveTenantId = isSuperAdmin ? (companyId as string | undefined) : tenantId.toString();
        const result = await orderService.getOrders(effectiveTenantId, options, search as string, filters);
        res.status(200).json({ success: true, data: result });
    } catch (error: any) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const assignOrder = async (req: AuthRequest, res: Response) => {
    try {
        const tenantId = req.user!.tenantId;
        const { driverId, vehicleId } = req.body;
        const orderId = req.params.id as string;
        const order = await orderService.assignOrderToDriver(orderId, driverId, vehicleId, tenantId.toString());
        res.status(200).json({ success: true, data: order });
    } catch (error: any) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const startTrip = async (req: AuthRequest, res: Response) => {
    try {
        const tenantId = req.user!.tenantId;
        const userId = req.user!.userId;
        const result = await orderService.startTrip(userId.toString(), tenantId.toString());
        res.status(200).json({ success: true, data: result });
    } catch (error: any) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const deliverOrder = async (req: AuthRequest, res: Response) => {
    try {
        const tenantId = req.user!.tenantId;
        const { signatureUrl, photoUrl } = req.body;
        const orderId = req.params.id as string;
        const order = await orderService.deliverOrder(orderId, { signatureUrl, photoUrl }, tenantId.toString());
        await createActivityLog({
            action: 'ORDER_DELIVERED',
            tenantId: tenantId.toString(),
            actorId: req.user!.userId,
            actorRole: req.user!.role,
            entityType: 'Order',
            entityId: orderId,
            metadata: { orderNumber: order.orderNumber }
        });
        res.status(200).json({ success: true, data: order });
    } catch (error: any) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const confirmDelivery = async (req: AuthRequest, res: Response) => {
    try {
        const tenantId = req.user!.tenantId;
        const orderId = req.params.id as string;
        const order = await orderService.confirmDelivery(orderId, tenantId.toString());
        await createActivityLog({
            action: 'ORDER_COMPLETED',
            tenantId: tenantId.toString(),
            actorId: req.user!.userId,
            actorRole: req.user!.role,
            entityType: 'Order',
            entityId: orderId,
            metadata: { orderNumber: order.orderNumber }
        });
        res.status(200).json({ success: true, data: order });
    } catch (error: any) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const getOrderById = async (req: AuthRequest, res: Response) => {
    try {
        const tenantId = req.user!.tenantId;
        const isSuperAdmin = req.user!.role === 'SUPER_ADMIN';
        const order = await orderService.getOrderById(req.params.id as string, isSuperAdmin ? undefined : tenantId.toString());
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
        const isSuperAdmin = req.user!.role === 'SUPER_ADMIN';
        const order = await orderService.updateOrder(req.params.id as string, req.body, isSuperAdmin ? undefined : tenantId.toString());
        res.status(200).json({ success: true, data: order });
    } catch (error: any) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const deleteOrder = async (req: AuthRequest, res: Response) => {
    try {
        const tenantId = req.user!.tenantId;
        const isSuperAdmin = req.user!.role === 'SUPER_ADMIN';
        await orderService.deleteOrder(req.params.id as string, isSuperAdmin ? undefined : tenantId.toString());
        res.status(200).json({ success: true, message: 'Order deleted successfully' });
    } catch (error: any) {
        res.status(400).json({ success: false, message: error.message });
    }
};
