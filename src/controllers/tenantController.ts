import { Request, Response } from 'express';
import Tenant from '../models/Tenant';
import User, { UserRole } from '../models/User';
import bcrypt from 'bcryptjs';
import { sendWelcomeEmail } from '../utils/emailService';

export const createTenant = async (req: Request, res: Response) => {
    try {
        const { name, subdomain, plan, adminName, adminEmail, adminPassword = Math.floor(100000 + Math.random() * 900000).toString(), location, isActive } = req.body;

        // 1. Check if user already exists
        const existingUser = await User.findOne({ email: adminEmail });
        if (existingUser) {
            throw new Error('Email already registered');
        }

        // 2. Create Tenant
        const tenant = await Tenant.create({ 
            name, 
            subdomain, 
            plan, 
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
        const tenants = await Tenant.find();
        res.status(200).json({ success: true, data: tenants });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getTenantById = async (req: Request, res: Response) => {
    try {
        const tenant = await Tenant.findById(req.params.id);
        if (!tenant) return res.status(404).json({ success: false, message: 'Tenant not found' });
        res.status(200).json({ success: true, data: tenant });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateTenant = async (req: Request, res: Response) => {
    try {
        const tenant = await Tenant.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!tenant) return res.status(404).json({ success: false, message: 'Tenant not found' });
        res.status(200).json({ success: true, data: tenant });
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
