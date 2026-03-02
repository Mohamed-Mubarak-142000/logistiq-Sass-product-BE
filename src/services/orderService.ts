import { orderRepository } from '../repositories/orderRepository';

export const createOrder = async (data: any, tenantId: string) => {
    return await orderRepository.create({ ...data, tenantId });
};

export const getOrders = async (tenantId: string, options: any, search = '') => {
    let query: any = { tenantId };
    if (search) {
        query.$or = [
            { orderNumber: { $regex: search, $options: 'i' } },
        ];
    }
    const orders = await orderRepository.find(query, options);
    const total = await orderRepository.count(query);
    return { orders, total };
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
        status: 'SHIPPED'
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

export const getOrderById = async (id: string, tenantId: string) => {
    const order = await orderRepository.findOne({ _id: id, tenantId });
    if (!order) throw new Error('Order not found');
    return order;
};

export const updateOrder = async (id: string, data: any, tenantId: string) => {
    const order = await orderRepository.findOne({ _id: id, tenantId });
    if (!order) throw new Error('Order not found');
    return await orderRepository.update(id, data);
};

export const deleteOrder = async (id: string, tenantId: string) => {
    const order = await orderRepository.findOne({ _id: id, tenantId });
    if (!order) throw new Error('Order not found');
    return await orderRepository.delete(id);
};
