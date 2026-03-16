import { Request, Response } from 'express';
import Tenant from '../models/Tenant';
import User, { UserRole } from '../models/User';
import bcrypt from 'bcryptjs';
import { sendWelcomeEmail } from '../utils/emailService';

export const createTenant = async (req: Request, res: Response) => {
    try {
        const { name, adminName, adminEmail, adminPassword = Math.floor(100000 + Math.random() * 900000).toString(), location, isActive } = req.body;

        // 1. Check if user already exists
        const existingUser = await User.findOne({ email: adminEmail });
        if (existingUser) {
            throw new Error('Email already registered');
        }

        // 2. Create Tenant
        const tenant = await Tenant.create({
            name,
            location,
            isActive: isActive !== undefined ? isActive : true
        });

        // 3. Create Company Admin for this Tenant
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(adminPassword, salt);

        const companyAdmin = await User.create({
            name: adminName,
            email: adminEmail,
            password: hashedPassword,
            role: UserRole.COMPANY_ADMIN,
            tenantId: tenant._id,
            location,
            mustResetPassword: true 
        });

        // 4. Send actual email (mocked)
        await sendWelcomeEmail(adminEmail, adminPassword, adminName);

        res.status(201).json({
            success: true,
            data: {
                tenant,
                admin: {
                    id: companyAdmin._id,
                    name: companyAdmin.name,
                    email: companyAdmin.email
                }
            },
            message: 'Tenant and Company Admin created successfully and email sent.'
        });
    } catch (error: any) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const getAllTenants = async (req: Request, res: Response) => {
    try {
        const tenants = await Tenant.find().lean();
        const tenantIds = tenants.map((tenant) => tenant._id);
        const admins = await User.find({ tenantId: { $in: tenantIds }, role: UserRole.COMPANY_ADMIN })
            .select('name email tenantId')
            .lean();

        const adminByTenant = new Map(
            admins.map((admin) => [admin.tenantId.toString(), admin])
        );

        const data = tenants.map((tenant) => {
            const admin = adminByTenant.get(tenant._id.toString());
            return {
                ...tenant,
                adminName: admin?.name,
                adminEmail: admin?.email,
            };
        });

        res.status(200).json({ success: true, data });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getTenantById = async (req: Request, res: Response) => {
    try {
        const tenant = await Tenant.findById(req.params.id).lean();
        if (!tenant) return res.status(404).json({ success: false, message: 'Tenant not found' });

        const admin = await User.findOne({ tenantId: tenant._id, role: UserRole.COMPANY_ADMIN })
            .select('name email')
            .lean();

        res.status(200).json({
            success: true,
            data: {
                ...tenant,
                adminName: admin?.name,
                adminEmail: admin?.email,
            }
        });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateTenant = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name, location, isActive, adminName, adminEmail, adminPassword } = req.body;

        const tenant = await Tenant.findByIdAndUpdate(
            id,
            { name, location, isActive },
            { new: true, runValidators: true }
        );

        if (!tenant) return res.status(404).json({ success: false, message: 'Tenant not found' });

        // Update company admin if details are provided
        if (adminName || adminEmail || adminPassword) {
            const admin = await User.findOne({ tenantId: tenant._id, role: UserRole.COMPANY_ADMIN });
            if (admin) {
                if (adminName) admin.name = adminName;
                if (adminEmail) {
                    const existingUser = await User.findOne({ email: adminEmail, _id: { $ne: admin._id } });
                    if (existingUser) {
                        return res.status(400).json({ success: false, message: 'Email already in use by another user' });
                    }
                    admin.email = adminEmail;
                }
                if (adminPassword) {
                    const salt = await bcrypt.genSalt(10);
                    admin.password = await bcrypt.hash(adminPassword, salt);
                }
                await admin.save();
            }
        }

        res.status(200).json({ success: true, data: tenant, message: 'Tenant updated successfully' });
    } catch (error: any) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const deleteTenant = async (req: Request, res: Response) => {
    try {
        const tenant = await Tenant.findByIdAndDelete(req.params.id);
        if (!tenant) return res.status(404).json({ success: false, message: 'Tenant not found' });
        
        // Optionally delete all users associated with this tenant
        await User.deleteMany({ tenantId: tenant._id });

        res.status(200).json({ success: true, message: 'Tenant and associated users deleted' });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};
