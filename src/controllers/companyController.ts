import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import Tenant from '../models/Tenant';
import Store from '../models/Store';
import { UserRole } from '../models/User';
import Campaign, { CampaignStatus } from '../models/Campaign';

const ensureCompanyAccess = (req: AuthRequest, companyId: string) => {
    if (req.user?.role === UserRole.SUPER_ADMIN) return;
    if (req.user?.tenantId !== companyId) {
        const error = new Error('Access denied: company mismatch');
        (error as any).statusCode = 403;
        throw error;
    }
};

const parseTags = (value?: string | string[]) => {
    if (!value) return [];
    if (Array.isArray(value)) return value.map((tag) => tag.trim()).filter(Boolean);
    return value.split(',').map((tag) => tag.trim()).filter(Boolean);
};

export const getCompanies = async (req: AuthRequest, res: Response) => {
    try {
        const companies = req.user?.role === UserRole.SUPER_ADMIN
            ? await Tenant.find().select('name isActive location').lean()
            : await Tenant.find({ _id: req.user?.tenantId }).select('name isActive location').lean();
        res.status(200).json({ success: true, data: companies });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getCompanyStores = async (req: AuthRequest, res: Response) => {
    try {
        const { companyId } = req.params;
        const effectiveCompanyId = req.user?.role === UserRole.SUPER_ADMIN
            ? companyId
            : req.user?.tenantId;
        const stores = await Store.find({ tenantId: effectiveCompanyId })
            .select('name ownerName warehouseId isActive')
            .lean();
        res.status(200).json({ success: true, data: stores });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getCompanyCampaigns = async (req: AuthRequest, res: Response) => {
    try {
        const { companyId } = req.params;
        ensureCompanyAccess(req, companyId as string);
        const campaigns = await Campaign.find({ companyId }).sort({ createdAt: -1 }).lean();
        res.status(200).json({ success: true, data: campaigns });
    } catch (error: any) {
        res.status(error.statusCode || 500).json({ success: false, message: error.message });
    }
};

export const createCompanyCampaign = async (req: AuthRequest, res: Response) => {
    try {
        const { companyId } = req.params;
        ensureCompanyAccess(req, companyId as string);

        const company = await Tenant.findById(companyId).select('_id').lean();
        if (!company) return res.status(404).json({ success: false, message: 'Company not found' });

        const {
            name,
            description,
            startDate,
            endDate,
            budget,
            status,
            targetAudience,
            tags,
        } = req.body;

        if (!name || !startDate || !endDate || budget === undefined) {
            return res.status(400).json({ success: false, message: 'Missing required campaign fields' });
        }

        const start = new Date(startDate);
        const end = new Date(endDate);
        if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
            return res.status(400).json({ success: false, message: 'Invalid campaign dates' });
        }
        if (start > end) {
            return res.status(400).json({ success: false, message: 'Start date must be before end date' });
        }

        const parsedBudget = Number(budget);
        if (Number.isNaN(parsedBudget) || parsedBudget < 0) {
            return res.status(400).json({ success: false, message: 'Invalid budget' });
        }

        const campaign = await Campaign.create({
            name,
            description,
            startDate: start,
            endDate: end,
            budget: parsedBudget,
            status: status || CampaignStatus.ACTIVE,
            companyId,
            targetAudience,
            tags: parseTags(tags),
        });

        res.status(201).json({ success: true, data: campaign });
    } catch (error: any) {
        res.status(error.statusCode || 500).json({ success: false, message: error.message });
    }
};

export const updateCompanyCampaign = async (req: AuthRequest, res: Response) => {
    try {
        const { companyId, campaignId } = req.params;
        ensureCompanyAccess(req, companyId as string);

        const campaign = await Campaign.findOne({ _id: campaignId, companyId });
        if (!campaign) return res.status(404).json({ success: false, message: 'Campaign not found' });

        const updateData: any = { ...req.body };

        if (updateData.startDate || updateData.endDate) {
            const start = new Date(updateData.startDate || campaign.startDate);
            const end = new Date(updateData.endDate || campaign.endDate);
            if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
                return res.status(400).json({ success: false, message: 'Invalid campaign dates' });
            }
            if (start > end) {
                return res.status(400).json({ success: false, message: 'Start date must be before end date' });
            }
            updateData.startDate = start;
            updateData.endDate = end;
        }

        if (updateData.budget !== undefined) {
            const parsedBudget = Number(updateData.budget);
            if (Number.isNaN(parsedBudget) || parsedBudget < 0) {
                return res.status(400).json({ success: false, message: 'Invalid budget' });
            }
            updateData.budget = parsedBudget;
        }

        if (updateData.tags !== undefined) {
            updateData.tags = parseTags(updateData.tags);
        }

        const updated = await Campaign.findOneAndUpdate(
            { _id: campaignId, companyId },
            updateData,
            { new: true }
        );

        res.status(200).json({ success: true, data: updated });
    } catch (error: any) {
        res.status(error.statusCode || 500).json({ success: false, message: error.message });
    }
};

export const deleteCompanyCampaign = async (req: AuthRequest, res: Response) => {
    try {
        const { companyId, campaignId } = req.params;
        ensureCompanyAccess(req, companyId as string);

        const deleted = await Campaign.findOneAndDelete({ _id: campaignId, companyId });
        if (!deleted) return res.status(404).json({ success: false, message: 'Campaign not found' });

        res.status(200).json({ success: true, message: 'Campaign deleted successfully' });
    } catch (error: any) {
        res.status(error.statusCode || 500).json({ success: false, message: error.message });
    }
};
