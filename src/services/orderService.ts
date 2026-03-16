import { orderRepository } from '../repositories/orderRepository';
import { OrderStatus } from '../models/Order';
import mongoose from 'mongoose';

export const createOrder = async (data: any, tenantId: string) => {
    // Basic validation could go here
    return await orderRepository.create({ ...data, tenantId, status: OrderStatus.PENDING });
};

export const getOrders = async (tenantId: string | undefined, options: any, search = '', filters: any = {}) => {
    let query: any = { ...filters };
    if (tenantId) {
        query.tenantId = tenantId;
    }
    if (search) {
        query.$or = [
            { orderNumber: { $regex: search, $options: 'i' } },
        ];
    }
    const { skip = 0, limit = 10, sort = { createdAt: -1 } } = options;
    const orders = await orderRepository.model
        .find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('storeId', 'name ownerName phone')
        .populate('warehouseId', 'name')
        .populate('vehicleId', 'name plateNumber')
        .populate('items.productId', 'name sku sellingPrice');
    const total = await orderRepository.count(query);
    return { orders, total };
};

export const assignOrderToDriver = async (orderId: string, driverId: string, vehicleId: string, tenantId: string) => {
    const order = await orderRepository.findOne({ _id: orderId, tenantId });
    if (!order) throw new Error('Order not found');
    
    return await orderRepository.update(orderId, {
        driverId,
        vehicleId,
        status: OrderStatus.ASSIGNED
    });
};

export const startTrip = async (driverId: string, tenantId: string) => {
    // Validate driver has at least 3 assigned orders
    const assignedOrders = await orderRepository.find({
        driverId: new mongoose.Types.ObjectId(driverId),
        tenantId: new mongoose.Types.ObjectId(tenantId),
        status: OrderStatus.ASSIGNED
    });

    if (assignedOrders.length < 3) {
        throw new Error('You must have at least 3 assigned orders to start a trip (Dispatch Validation Rule).');
    }

    // Update all assigned orders to IN_TRANSIT
    const orderIds = assignedOrders.map(o => o._id);
    await orderRepository.model.updateMany(
        { _id: { $in: orderIds }, tenantId: new mongoose.Types.ObjectId(tenantId) },
        { $set: { status: OrderStatus.IN_TRANSIT } }
    );

    return { success: true, count: orderIds.length };
};

export const deliverOrder = async (orderId: string, proof: { signatureUrl: string, photoUrl: string }, tenantId: string) => {
    const order = await orderRepository.findOne({ _id: orderId, tenantId });
    if (!order) throw new Error('Order not found');

    if (order.status !== OrderStatus.IN_TRANSIT) {
        throw new Error('Order must be in IN_TRANSIT status to be delivered');
    }

    return await orderRepository.update(orderId, {
        status: OrderStatus.DELIVERED,
        deliveryProof: {
            ...proof,
            deliveredAt: new Date()
        }
    });
};

export const confirmDelivery = async (orderId: string, tenantId: string) => {
    const order = await orderRepository.findOne({ _id: orderId, tenantId });
    if (!order) throw new Error('Order not found');

    if (order.status !== OrderStatus.DELIVERED) {
        throw new Error('Order must be in DELIVERED status to be confirmed by Warehouse');
    }

    return await orderRepository.update(orderId, {
        status: OrderStatus.CLOSED
    });
};

export const getDashboardStats = async (tenantId: string) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayOrders = await orderRepository.count({
        tenantId,
        createdAt: { $gte: today }
    });

    // For demonstration, these are simplified. In a real app, you might have specific logic/collections.
    const activeDeliveries = await orderRepository.count({
        tenantId,
        status: OrderStatus.IN_TRANSIT
    });

    const lowStockAlerts = 0; // This would normally come from a product check

    const stats = await orderRepository.model.aggregate([
        { $match: { tenantId: new (require('mongoose').Types.ObjectId)(tenantId) } },
        { $group: { _id: null, totalSales: { $sum: "$totalAmount" } } }
    ]);

    const totalSales = stats.length > 0 ? stats[0].totalSales : 0;

    const weeklySales = await orderRepository.model.aggregate([
        {
            $match: {
                tenantId: new (require('mongoose').Types.ObjectId)(tenantId),
                createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
            }
        },
        {
            $group: {
                _id: { $dayOfWeek: "$createdAt" },
                value: { $sum: "$totalAmount" }
            }
        },
        { $sort: { "_id": 1 } }
    ]);

    const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    const chartData = days.map((name, index) => {
        const dayData = weeklySales.find(d => d._id === index + 1);
        return { name, value: dayData ? dayData.value : 0 };
    });

    return {
        todayOrders,
        activeDeliveries,
        lowStockAlerts,
        totalSales,
        chartData
    };
};

export const getOrderById = async (id: string, tenantId?: string) => {
    const query = tenantId ? { _id: id, tenantId } : { _id: id };
    const order = await orderRepository.model
        .findOne(query)
        .populate('storeId', 'name ownerName phone address')
        .populate('warehouseId', 'name location')
        .populate('vehicleId', 'name plateNumber')
        .populate('items.productId', 'name sku sellingPrice');
    if (!order) throw new Error('Order not found');
    return order;
};

export const updateOrder = async (id: string, data: any, tenantId?: string) => {
    const order = await orderRepository.findOne(tenantId ? { _id: id, tenantId } : { _id: id });
    if (!order) throw new Error('Order not found');
    return await orderRepository.update(id, data);
};

export const deleteOrder = async (id: string, tenantId?: string) => {
    const order = await orderRepository.findOne(tenantId ? { _id: id, tenantId } : { _id: id });
    if (!order) throw new Error('Order not found');
    return await orderRepository.delete(id);
};
