import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Tenant from '../models/Tenant';
import User, { UserRole } from '../models/User';

export const registerTenant = async (data: any) => {
    const { companyName, adminName, email, password } = data;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        throw new Error('Email already registered');
    }

    // Create Tenant
    const tenant = await Tenant.create({ name: companyName });

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create Company Admin User
    const user = await User.create({
        name: adminName,
        email,
        password: hashedPassword,
        role: UserRole.COMPANY_ADMIN,
        tenantId: tenant._id,
    });

    const token = jwt.sign(
        { userId: user._id, tenantId: tenant._id, role: user.role },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: '24h' }
    );

    return {
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
        },
        tenant: {
            id: tenant._id,
            name: tenant.name,
        },
        token,
    };
};

export const login = async (email: string, password: any) => {
    const user = await User.findOne({ email }).populate('tenantId');
    if (!user) {
        throw new Error('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        throw new Error('Invalid credentials');
    }

    const token = jwt.sign(
        { userId: user._id, tenantId: user.tenantId._id, role: user.role },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: '24h' }
    );

    return {
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            mustResetPassword: user.mustResetPassword,
        },
        tenant: user.tenantId,
        token,
    };
};

export const resetPassword = async (userId: string, newPassword: any, tenantId: string | null) => {
    const user = await User.findOne({ _id: userId, ...(tenantId && { tenantId }) });
    if (!user) {
        throw new Error('User not found');
    }

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    user.mustResetPassword = false;
    await user.save();

    return { success: true, message: 'Password reset successfully' };
};
