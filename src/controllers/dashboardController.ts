import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import Tenant from '../models/Tenant';
import User from '../models/User';
import Vehicle from '../models/Vehicle';
import Warehouse from '../models/Warehouse';
import Order from '../models/Order';

export const getSuperAdminSummary = async (req: AuthRequest, res: Response) => {
    try {
        const [
            totalCompanies,
            activeCompanies,
            totalDrivers,
            totalVehicles,
            totalWarehouses,
            totalOrders
        ] = await Promise.all([
            Tenant.countDocuments(),
            Tenant.countDocuments({ isActive: true }),
            User.countDocuments({ role: 'driver' }),
            Vehicle.countDocuments(),
            Warehouse.countDocuments(),
            Order.countDocuments()
        ]);

        res.status(200).json({
            success: true,
            data: {
                totalCompanies,
                activeCompanies,
                inactiveCompanies: totalCompanies - activeCompanies,
                totalDrivers,
                totalVehicles,
                totalWarehouses,
                totalOrders
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
            { $match: { createdAt: { $gte: sixMonthsAgo }, status: 'delivered' } },
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
