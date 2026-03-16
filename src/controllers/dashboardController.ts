import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import Tenant from '../models/Tenant';
import User, { UserRole } from '../models/User';
import Vehicle from '../models/Vehicle';
import Warehouse from '../models/Warehouse';
import Order, { OrderStatus } from '../models/Order';
import Product from '../models/Product';
import Store from '../models/Store';

export const getSuperAdminSummary = async (req: AuthRequest, res: Response) => {
    try {
        const [
            totalCompanies,
            activeCompanies,
            totalDrivers,
            totalVehicles,
            totalWarehouses,
            totalOrders,
            totalProducts,
            activeVehicles
        ] = await Promise.all([
            Tenant.countDocuments(),
            Tenant.countDocuments({ isActive: true }),
            User.countDocuments({ role: UserRole.DRIVER }),
            Vehicle.countDocuments(),
            Warehouse.countDocuments(),
            Order.countDocuments(),
            Product.countDocuments(),
            Vehicle.countDocuments({ status: { $ne: 'INACTIVE' } })
        ]);

        res.status(200).json({
            success: true,
            data: {
                totalCompanies,
                activeCompanies,
                inactiveCompanies: totalCompanies - activeCompanies,
                totalDrivers,
                totalVehicles,
                activeVehicles,
                totalWarehouses,
                totalOrders,
                totalProducts
            }
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getSuperAdminCharts = async (req: AuthRequest, res: Response) => {
    try {
        // Companies Growth (Last 6 months)
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

        const companiesGrowth = await Tenant.aggregate([
            { $match: { createdAt: { $gte: sixMonthsAgo } } },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
                    count: { $sum: 1 }
                }
            },
            { $sort: { "_id": 1 } }
        ]);

        // Orders Distribution by Status
        const ordersDistribution = await Order.aggregate([
            {
                $group: {
                    _id: "$status",
                    count: { $sum: 1 }
                }
            }
        ]);

        // Sales Over Time
        const salesOverTime = await Order.aggregate([
            { $match: { createdAt: { $gte: sixMonthsAgo }, status: OrderStatus.DELIVERED } },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m", date: "$createdAt" } },
                    totalSales: { $sum: "$totalAmount" }
                }
            },
            { $sort: { "_id": 1 } }
        ]);

        res.status(200).json({
            success: true,
            data: {
                companiesGrowth,
                ordersDistribution,
                salesOverTime
            }
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getTenantDashboardStats = async (req: AuthRequest, res: Response) => {
    try {
        const tenantId = req.user!.tenantId;
        const [
            totalOrders,
            totalProducts,
            totalDrivers,
            totalVehicles,
            totalWarehouses,
            totalStores,
            pendingOrders,
            deliveredOrders,
            activeVehicles
        ] = await Promise.all([
            Order.countDocuments({ tenantId }),
            Product.countDocuments({ tenantId }),
            User.countDocuments({ tenantId, role: UserRole.DRIVER }),
            Vehicle.countDocuments({ tenantId }),
            Warehouse.countDocuments({ tenantId }),
            Store.countDocuments({ tenantId }),
            Order.countDocuments({ tenantId, status: OrderStatus.PENDING }),
            Order.countDocuments({ tenantId, status: OrderStatus.DELIVERED }),
            Vehicle.countDocuments({ tenantId, status: { $ne: 'INACTIVE' } })
        ]);

        res.status(200).json({
            success: true,
            data: {
                totalOrders,
                totalProducts,
                totalDrivers,
                totalVehicles,
                activeVehicles,
                totalWarehouses,
                totalStores,
                pendingOrders,
                deliveredOrders
            }
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getTopCompanies = async (req: AuthRequest, res: Response) => {
    try {
        const topCompanies = await Order.aggregate([
            {
                $group: {
                    _id: '$tenantId',
                    ordersCount: { $sum: 1 },
                    totalSales: { $sum: '$totalAmount' }
                }
            },
            { $sort: { ordersCount: -1 } },
            { $limit: 5 }
        ]);

        const companyIds = topCompanies.map((item) => item._id);
        const companies = await Tenant.find({ _id: { $in: companyIds } })
            .select('name isActive')
            .lean();

        const companyById = new Map(companies.map((company) => [company._id.toString(), company]));

        const responseData = topCompanies.map((item) => {
            const company = companyById.get(item._id.toString());
            return {
                companyId: item._id,
                companyName: company?.name || 'شركة غير معروفة',
                isActive: company?.isActive ?? false,
                ordersCount: item.ordersCount,
                totalSales: item.totalSales
            };
        });

        res.status(200).json({ success: true, data: responseData });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getTopWarehouses = async (req: AuthRequest, res: Response) => {
    try {
        const tenantId = req.user!.tenantId;
        const topWarehouses = await Order.aggregate([
            { $match: { tenantId: new (require('mongoose').Types.ObjectId)(tenantId) } },
            {
                $group: {
                    _id: '$warehouseId',
                    ordersCount: { $sum: 1 },
                    totalSales: { $sum: '$totalAmount' }
                }
            },
            { $sort: { ordersCount: -1 } },
            { $limit: 5 }
        ]);

        const warehouseIds = topWarehouses.map((item) => item._id);
        const warehouses = await Warehouse.find({ _id: { $in: warehouseIds } })
            .select('name location')
            .lean();
        const warehouseById = new Map(warehouses.map((warehouse) => [warehouse._id.toString(), warehouse]));

        const responseData = topWarehouses.map((item) => {
            const warehouse = warehouseById.get(item._id.toString());
            return {
                warehouseId: item._id,
                warehouseName: warehouse?.name || 'مستودع غير معروف',
                location: warehouse?.location,
                ordersCount: item.ordersCount,
                totalSales: item.totalSales
            };
        });

        res.status(200).json({ success: true, data: responseData });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getWarehouseDashboardStats = async (req: AuthRequest, res: Response) => {
    try {
        const tenantId = req.user!.tenantId;
        const warehouseId = req.query.warehouseId; // Optional: filter by specific warehouse if provided

        const query: any = { tenantId };
        if (warehouseId) query.warehouseId = warehouseId;

        const [
            totalOrders,
            pendingPickups,
            lowStockProducts
        ] = await Promise.all([
            Order.countDocuments(query),
            Order.countDocuments({ ...query, status: OrderStatus.PENDING }),
            Product.countDocuments({ ...query, stock: { $lt: 10 } }) // Simplified low stock
        ]);

        res.status(200).json({
            success: true,
            data: {
                totalOrders,
                pendingPickups,
                lowStockProducts
            }
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};
