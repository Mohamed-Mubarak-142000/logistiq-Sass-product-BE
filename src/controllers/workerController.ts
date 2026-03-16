import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import User, { UserRole } from '../models/User';
import bcrypt from 'bcryptjs';
import { sendWelcomeEmail } from '../utils/emailService';
import { createActivityLog } from '../services/activityLogService';

export const createWorker = async (req: AuthRequest, res: Response) => {
    try {
        const { name, email, location, tenantId: bodyTenantId, warehouseId, vehicleId, phone, nationalId, password = '123456' } = req.body;
        const role = req.body?.role || (req.baseUrl?.includes('/driver') ? UserRole.DRIVER : undefined);
        const currentUserRole = req.user?.role;
        const currentUserTenantId = req.user?.tenantId;

        // Role-based visibility and restrictions
        let finalTenantId = currentUserTenantId;

        if (!role) {
            return res.status(400).json({ success: false, message: 'Role is required' });
        }

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
            phone,
            nationalId,
            mustResetPassword: true, // New users must reset password
        });

        await createActivityLog({
            action: role === UserRole.DRIVER ? 'DRIVER_CREATED' : 'USER_CREATED',
            tenantId: finalTenantId?.toString(),
            actorId: req.user!.userId,
            actorRole: req.user!.role,
            entityType: 'User',
            entityId: worker._id?.toString(),
            metadata: { name: worker.name, email: worker.email, role: worker.role }
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
                phone: worker.phone,
                nationalId: worker.nationalId,
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
        const isSuperAdmin = req.user?.role === UserRole.SUPER_ADMIN;
        const { role } = req.query;
        const resolvedRole = role || (req.baseUrl?.includes('/driver') ? UserRole.DRIVER : undefined);
        
        const filter: any = {};
        if (!isSuperAdmin && tenantId) {
            filter.tenantId = tenantId;
        }
        if (resolvedRole) {
            filter.role = resolvedRole;
        } else {
            filter.role = { $in: [UserRole.DRIVER, UserRole.WAREHOUSE_MANAGER, UserRole.WAREHOUSE_OWNER, UserRole.SHOP_OWNER, UserRole.SUPERMARKET_OWNER] };
        }

        const selectFields = resolvedRole === UserRole.DRIVER
            ? 'name email role _id warehouseId vehicleId location phone nationalId isActive'
            : '-password';
        let query = User.find(filter).select(selectFields);
        if (resolvedRole === UserRole.DRIVER) {
            query = query
                .populate('warehouseId', 'name location')
                .populate('vehicleId', 'name plateNumber');
        }
        const workers = await query;
        res.status(200).json({ success: true, data: workers });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const getWorkerById = async (req: AuthRequest, res: Response) => {
    try {
        const tenantId = req.user?.tenantId;
        const isSuperAdmin = req.user?.role === UserRole.SUPER_ADMIN;
        const filter = isSuperAdmin ? { _id: req.params.id } : { _id: req.params.id, tenantId };
        let query = User.findOne(filter);
        if (req.baseUrl?.includes('/driver')) {
            query = query
                .populate('warehouseId', 'name location')
                .populate('vehicleId', 'name plateNumber');
        }
        const worker = await query;
        if (!worker) return res.status(404).json({ success: false, message: 'Worker not found' });
        res.status(200).json({ success: true, data: worker });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};

export const updateWorker = async (req: AuthRequest, res: Response) => {
    try {
        const tenantId = req.user?.tenantId;
        const isSuperAdmin = req.user?.role === UserRole.SUPER_ADMIN;
        const filter = isSuperAdmin ? { _id: req.params.id } : { _id: req.params.id, tenantId };
        const worker = await User.findOneAndUpdate(
            filter,
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
        const isSuperAdmin = req.user?.role === UserRole.SUPER_ADMIN;
        const filter = isSuperAdmin ? { _id: req.params.id } : { _id: req.params.id, tenantId };
        const worker = await User.findOneAndDelete(filter);
        if (!worker) return res.status(404).json({ success: false, message: 'Worker not found' });
        res.status(200).json({ success: true, message: 'Worker deleted successfully' });
    } catch (error: any) {
        res.status(500).json({ success: false, message: error.message });
    }
};
