import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import Tenant from '../models/Tenant';
import User, { UserRole } from '../models/User';
import Warehouse from '../models/Warehouse';
import Product from '../models/Product';
import Store from '../models/Store';
import Vehicle from '../models/Vehicle';
import Order, { OrderStatus } from '../models/Order';

import connectDB from '../config/db';

dotenv.config();

const seed = async () => {
    try {
        await connectDB();
        console.log('Connected to MongoDB for seeding...');

        // Clear existing data
        await Tenant.deleteMany({});
        await User.deleteMany({});
        await Warehouse.deleteMany({});
        await Product.deleteMany({});
        await Store.deleteMany({});
        await Vehicle.deleteMany({});
        await Order.deleteMany({});

        console.log('Database cleared.');

        // 1. Create Tenant
        const tenant = await Tenant.create({
            name: 'Logistiq Demo Company',
            plan: 'pro',
            isActive: true,
        });
        
        // Create a dedicated system tenant or use a dummy one for Super Admin if required by schema
        // Since User model requires tenantId, we'll assign Super Admin to the first tenant or a system one
        console.log('Tenant created.');

        // 2. Create Users
        const hashedPassword = await bcrypt.hash('password123', 10);

        // Super Admin
        const superAdmin = await User.create({
            name: 'Super Admin',
            email: 'superadmin@gmail.com',
            password: hashedPassword,
            role: UserRole.SUPER_ADMIN,
            tenantId: tenant._id, // Assigning to first tenant for schema compliance
        });

        const companyAdmin = await User.create({
            name: 'Mohamed Admin',
            email: 'admin@logistiq.com',
            password: hashedPassword,
            role: UserRole.COMPANY_ADMIN,
            tenantId: tenant._id,
        });

        const warehouseManager = await User.create({
            name: 'Ahmed Manager',
            email: 'manager@logistiq.com',
            password: hashedPassword,
            role: UserRole.WAREHOUSE_MANAGER,
            tenantId: tenant._id,
        });

        const driver = await User.create({
            name: 'Sameh Driver',
            email: 'driver@logistiq.com',
            password: hashedPassword,
            role: UserRole.DRIVER,
            tenantId: tenant._id,
        });

        console.log('Users created.');

        // 3. Create Warehouses
        const warehouse1 = await Warehouse.create({
            name: 'مستودع القاهرة الرئيسي',
            location: 'مدينة نصر، القاهرة',
            tenantId: tenant._id,
            managerId: warehouseManager._id,
        });

        const warehouse2 = await Warehouse.create({
            name: 'مستودع الإسكندرية',
            location: 'سموحة، الإسكندرية',
            tenantId: tenant._id,
        });

        console.log('Warehouses created.');

        // 4. Create Products
        const products = await Product.insertMany([
            {
                name: 'كوكا كولا 330 مل',
                sku: 'COKE-330',
                category: 'مشروبات',
                unitType: 'piece',
                purchasePrice: 10,
                sellingPrice: 15,
                minStockAlert: 100,
                tenantId: tenant._id,
            },
            {
                name: 'شيبسي عائلي - ملح',
                sku: 'CHIPS-XL-SALT',
                category: 'سناكس',
                unitType: 'piece',
                purchasePrice: 5,
                sellingPrice: 8,
                minStockAlert: 50,
                tenantId: tenant._id,
            },
            {
                name: 'مياه معدنية 1.5 لتر',
                sku: 'WATER-1.5L',
                category: 'مشروبات',
                unitType: 'box',
                purchasePrice: 40,
                sellingPrice: 60,
                minStockAlert: 20,
                tenantId: tenant._id,
            }
        ]);

        console.log('Products created.');

        // 5. Create Stores
        const store = await Store.create({
            name: 'سوبر ماركت الأمل',
            ownerName: 'محمود حسن',
            phone: '01012345678',
            address: 'المعادي، القاهرة',
            creditLimit: 5000,
            paymentType: 'credit',
            tenantId: tenant._id,
        });

        console.log('Store created.');

        // 6. Create Vehicles
        const vehicle = await Vehicle.create({
            name: 'فان توصيل 1',
            plateNumber: 'أ ب ج 123',
            driverId: driver._id,
            capacity: 1000,
            tenantId: tenant._id,
        });

        console.log('Vehicle created.');

        // 7. Create Orders
        await Order.create({
            orderNumber: 'ORD-001',
            storeId: store._id,
            warehouseId: warehouse1._id,
            vehicleId: vehicle._id,
            items: [
                { productId: products[0]._id, quantity: 50, price: 15 },
                { productId: products[1]._id, quantity: 20, price: 8 }
            ],
            totalAmount: (50 * 15) + (20 * 8),
            status: OrderStatus.PENDING,
            tenantId: tenant._id,
        });

        console.log('Order created.');

        console.log('Seeding completed successfully!');
        process.exit(0);
    } catch (err) {
        console.error('Seeding error:', err);
        process.exit(1);
    }
};

seed();
