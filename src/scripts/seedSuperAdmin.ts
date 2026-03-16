import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import Tenant from '../models/Tenant';
import User, { UserRole } from '../models/User';
import connectDB from '../config/db';

dotenv.config();

const seedSuperAdmin = async () => {
    try {
        await connectDB();
        console.log('Connected to MongoDB for Super Admin seeding...');

        const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL || 'superadmin@logistiq.com';
        const SUPER_ADMIN_PASSWORD = process.env.SUPER_ADMIN_PASSWORD || 'Admin@123';
        const SUPER_ADMIN_NAME = 'Super Admin';
        const SYSTEM_TENANT_NAME = 'Logistiq Systems';

        // 1. Find or Create System Tenant
        let systemTenant = await Tenant.findOne({ name: SYSTEM_TENANT_NAME });
        if (!systemTenant) {
            systemTenant = await Tenant.create({
                name: SYSTEM_TENANT_NAME,
                isActive: true,
            });
            console.log('System Tenant created.');
        } else {
            console.log('System Tenant already exists.');
        }

        // 2. Check if Super Admin already exists
        const existingSuperAdmin = await User.findOne({ email: SUPER_ADMIN_EMAIL });
        if (existingSuperAdmin) {
            console.log(`Super Admin with email ${SUPER_ADMIN_EMAIL} already exists. Skipping creation.`);
            process.exit(0);
        }

        // 3. Create Super Admin
        const hashedPassword = await bcrypt.hash(SUPER_ADMIN_PASSWORD, 10);
        const superAdmin = await User.create({
            name: SUPER_ADMIN_NAME,
            email: SUPER_ADMIN_EMAIL,
            password: hashedPassword,
            role: UserRole.SUPER_ADMIN,
            tenantId: systemTenant._id,
            isActive: true,
            mustResetPassword: false
        });

        console.log('-----------------------------------------------');
        console.log('Super Admin account created successfully!');
        console.log(`Email: ${SUPER_ADMIN_EMAIL}`);
        console.log(`Password: ${SUPER_ADMIN_PASSWORD}`);
        console.log('Role: SUPER_ADMIN');
        console.log('-----------------------------------------------');

        process.exit(0);
    } catch (error) {
        console.error('Error seeding Super Admin:', error);
        process.exit(1);
    }
};

seedSuperAdmin();
