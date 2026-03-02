import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import * as storeService from '../services/storeService';
import User, { UserRole } from '../models/User';
import Tenant from '../models/Tenant';
import bcrypt from 'bcryptjs';

const sendWelcomeEmail = async (email: string, password: string, role: string) => {
    console.log(`[MOCK EMAIL SERVICE] Sending welcome email to ${email}`);
    console.log(`[MOCK EMAIL SERVICE] Role: ${role}`);
    console.log(`[MOCK EMAIL SERVICE] Your default password is: ${password}`);
};

export const createStore = async (req: AuthRequest, res: Response) => {
    try {
        const { 
            name, email, role, lat, lng, address, tenantId: bodyTenantId, 
            ownerName, phone, paymentType, creditLimit, 
            companyName, adminEmail, adminName, adminPassword
        } = req.body;
        
        const currentUserRole = req.user?.role;
        const currentUserTenantId = req.user?.tenantId;

        // 1. Logic for "Company" creation (Super Admin only)
        if (role === 'COMPANY') {
            if (currentUserRole !== UserRole.SUPER_ADMIN) {
                return res.status(403).json({ success: false, message: 'Only Super Admin can create companies' });
            }
            
            // Create Tenant
            const tenant = await Tenant.create({ name: companyName || name });
            
            // Create Company Admin for this Tenant
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(adminPassword || '123456', salt);
            
            const companyAdmin = await User.create({
                name: adminName || name,
                email: adminEmail || email,
                password: hashedPassword,
                role: UserRole.COMPANY_ADMIN,
                tenantId: tenant._id,
                location: { lat, lng, address },
                mustResetPassword: true
            });

            await sendWelcomeEmail(adminEmail || email, adminPassword || '123456', UserRole.COMPANY_ADMIN);

            return res.status(201).json({
                success: true,
                data: { tenant, admin: companyAdmin },
                message: 'Company and Admin created'
            });
        }

        // 2. Logic for adding Users (Admin, Driver, Manager, Client/Store)
        let finalTenantId = currentUserTenantId;
        
        if (currentUserRole === UserRole.SUPER_ADMIN) {
            if (!bodyTenantId) return res.status(400).json({ success: false, message: 'tenantId is required' });
            finalTenantId = bodyTenantId;
        }

        // Map frontend "Client" type to a database "Store" + "User" or just "User"
        // In this system, a Client is a Store entry + an associated User entry if they have login.
        
        const salt = await bcrypt.genSalt(10);
        const defaultPassword = '123456';
        const hashedPassword = await bcrypt.hash(defaultPassword, salt);

        // Create User Entry
        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            role: role || UserRole.STORE_OWNER,
            tenantId: finalTenantId,
            location: { lat, lng, address },
            mustResetPassword: true
        });

        // If it's a STORE_OWNER / Client, also create the Store entry
        let store = null;
        if (role === UserRole.STORE_OWNER) {
            store = await storeService.createStore({
                name,
                ownerName: ownerName || name,
                phone: phone || '',
                address: address || '',
                lat,
                lng,
                paymentType: paymentType || 'cash',
                creditLimit: creditLimit || 0
            }, finalTenantId!.toString());
        }

        await sendWelcomeEmail(email, defaultPassword, role);

        res.status(201).json({ 
            success: true, 
            data: { user, store },
            message: 'User created successfully'
        });

    } catch (error: any) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const getStores = async (req: AuthRequest, res: Response) => {
    try {
        const tenantId = req.user!.tenantId;
        const { page = 1, limit = 10, search = '' } = req.query;
        const options = {
            skip: (Number(page) - 1) * Number(limit),
            limit: Number(limit),
        };
        const result = await storeService.getStores(tenantId.toString(), options, search as string);
        res.status(200).json({ success: true, data: result });
    } catch (error: any) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const getStoreById = async (req: AuthRequest, res: Response) => {
    try {
        const tenantId = req.user!.tenantId;
        const store = await storeService.getStoreById(req.params.id as string, tenantId.toString());
        res.status(200).json({ success: true, data: store });
    } catch (error: any) {
        res.status(404).json({ success: false, message: error.message });
    }
};

export const updateStore = async (req: AuthRequest, res: Response) => {
    try {
        const tenantId = req.user!.tenantId;
        const store = await storeService.updateStore(req.params.id as string, req.body, tenantId.toString());
        res.status(200).json({ success: true, data: store });
    } catch (error: any) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const deleteStore = async (req: AuthRequest, res: Response) => {
    try {
        const tenantId = req.user!.tenantId;
        await storeService.deleteStore(req.params.id as string, tenantId.toString());
        res.status(200).json({ success: true, message: 'Store deleted successfully' });
    } catch (error: any) {
        res.status(400).json({ success: false, message: error.message });
    }
};
