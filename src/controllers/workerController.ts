import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import User, { UserRole } from '../models/User';
import bcrypt from 'bcryptjs';
import { sendWelcomeEmail } from '../utils/emailService';

export const createWorker = async (req: AuthRequest, res: Response) => {
    try {
        const { name, email, role, location, tenantId: bodyTenantId, warehouseId, vehicleId, password = '123456' } = req.body;
        const currentUserRole = req.user?.role;
        const currentUserTenantId = req.user?.tenantId;

        // Role-based visibility and restrictions
        let finalTenantId = currentUserTenantId;

        if (currentUserRole === UserRole.SUPER_ADMIN) {
            // Super Admin must provide a tenantId if creating anyone other than another Super Admin (though usually they create Tenants)
            if (!bodyTenantId && role !== UserRole.SUPER_ADMIN) {
                return res.status(400).json({ success: false, message: 'Tenant ID is required for non-Super Admin users' });
            }
            finalTenantId = bodyTenantId;
        } else if (currentUserRole === UserRole.COMPANY_ADMIN) {
            // Company Admin can only add workers to THEIR company
            const allowedRoles = [UserRole.DRIVER, UserRole.WAREHOUSE_MANAGER, UserRole.WAREHOUSE_OWNER, UserRole.SHOP_OWNER, UserRole.SUPERMARKET_OWNER];
            if (!allowedRoles.includes(role)) {
                return res.status(403).json({ success: false, message: 'You do not have permission to create this type of user' });
            }
        } else {
            return res.status(403).json({ success: false, message: 'Unauthorized to create users' });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'User with this email already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        const worker = await User.create({
            name,
            email,
            password: hashedPassword,
            role,
            tenantId: finalTenantId,
            warehouseId,
            vehicleId,
            location,
            mustResetPassword: true, // New users must reset password
        });

        // Send actual email (mocked for now)
        await sendWelcomeEmail(email, password, name);

        res.status(201).json({
            success: true,
            data: {
                id: worker._id,
                name: worker.name,
                email: worker.email,
                role: worker.role,
                tenantId: worker.tenantId,
                warehouseId: worker.warehouseId,
                vehicleId: worker.vehicleId,
                location: worker.location,
            },
            message: 'User created successfully and email sent.'
        });
    } catch (error: any) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const getAllWorkers = async (req: AuthRequest, res: Response) => {
    try {
        const tenantId = req.user?.tenantId;
        const { role } = req.query;
        
        const filter: any = { tenantId };
        if (role) {
            filter.role = role;
        } else {
            filter.role = { $in: [UserRole.DRIVER, UserRole.WAREHOUSE_MANAGER, UserRole.WAREHOUSE_OWNER, UserRole.SHOP_OWNER, UserRole.SUPERMARKET_OWNER] };
        }

        const workers = await User.find(filter).select('-password');
        res.status(200).json({ success: true, data: workers });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getWorkerById = async (req: AuthRequest, res: Response) => {
    try {
        const tenantId = req.user?.tenantId;
        const worker = await User.findOne({ _id: req.params.id, tenantId });
        if (!worker) return res.status(404).json({ success: false, message: 'Worker not found' });
        res.status(200).json({ success: true, data: worker });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateWorker = async (req: AuthRequest, res: Response) => {
    try {
        const tenantId = req.user?.tenantId;
        const worker = await User.findOneAndUpdate(
            { _id: req.params.id, tenantId },
            req.body,
            { new: true }
        );
        if (!worker) return res.status(404).json({ success: false, message: 'Worker not found' });
        res.status(200).json({ success: true, data: worker });
    } catch (error: any) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const deleteWorker = async (req: AuthRequest, res: Response) => {
    try {
        const tenantId = req.user?.tenantId;
        const worker = await User.findOneAndDelete({ _id: req.params.id, tenantId });
        if (!worker) return res.status(404).json({ success: false, message: 'Worker not found' });
        res.status(200).json({ success: true, message: 'Worker deleted successfully' });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};
