import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import Order from '../models/Order';
import Product from '../models/Product';

export const getReports = async (req: AuthRequest, res: Response) => {
    try {
        res.status(200).json({ success: true, message: 'Reports list available' });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getReportDetails = async (req: AuthRequest, res: Response) => {
    try {
        const { reportType } = req.params;
        const { period, from, to } = req.query;
        const tenantId = req.user!.tenantId;

        let dateFilter: any = {};
        if (from && to) {
            dateFilter = { createdAt: { $gte: new Date(from as string), $lte: new Date(to as string) } };
        } else if (period) {
            const now = new Date();
            if (period === 'today') {
                const startOfDay = new Date(now.setHours(0, 0, 0, 0));
                dateFilter = { createdAt: { $gte: startOfDay } };
            } else if (period === 'last7days') {
                const sevenDaysAgo = new Date(now.setDate(now.getDate() - 7));
                dateFilter = { createdAt: { $gte: sevenDaysAgo } };
            } else if (period === 'last30days') {
                const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));
                dateFilter = { createdAt: { $gte: thirtyDaysAgo } };
            } else if (period === 'thisMonth') {
                const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                dateFilter = { createdAt: { $gte: startOfMonth } };
            } else if (period === 'thisYear') {
                const startOfYear = new Date(now.getFullYear(), 0, 1);
                dateFilter = { createdAt: { $gte: startOfYear } };
            }
        }

        let reportData = {};

        switch (reportType) {
            case 'sales':
                reportData = await Order.aggregate([
                    { $match: { ...dateFilter, tenantId, status: 'delivered' } },
                    {
                        $group: {
                            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                            total: { $sum: "$totalAmount" },
                            count: { $sum: 1 }
                        }
                    },
                    { $sort: { "_id": 1 } }
                ]);
                break;
            case 'inventory':
                reportData = await Product.find({ tenantId }).select('name quantity minQuantity').lean();
                break;
            case 'customers':
                reportData = await Order.aggregate([
                    { $match: { ...dateFilter, tenantId } },
                    {
                        $group: {
                            _id: "$customerName",
                            totalSpent: { $sum: "$totalAmount" },
                            orderCount: { $sum: 1 }
                        }
                    },
                    { $sort: { totalSpent: -1 } },
                    { $limit: 10 }
                ]);
                break;
            default:
                return res.status(400).json({ success: false, message: 'Invalid report type' });
        }

        res.status(200).json({ success: true, data: reportData });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};
