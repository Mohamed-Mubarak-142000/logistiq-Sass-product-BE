import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import Tenant from '../models/Tenant';
import User, { UserRole } from '../models/User';
import Warehouse from '../models/Warehouse';
import Product from '../models/Product';
import Store from '../models/Store';
import Vehicle, { VehicleStatus } from '../models/Vehicle';
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

        const hashedPassword = await bcrypt.hash('password123', 10);

        // 1. Create System Tenant for Super Admin
        const systemTenant = await Tenant.create({
            name: 'Logistiq Systems',
            isActive: true,
        });

        // 2. Create Super Admin
        await User.create({
            name: 'Super Admin',
            email: 'superadmin@logistiq.com',
            password: hashedPassword,
            role: UserRole.SUPER_ADMIN,
            tenantId: systemTenant._id,
        });

        // 3. Create 2 Companies (Tenants)
        const companiesSetup = [
            { name: 'Global Logistics Corp' },
            { name: 'Fast Delivery Ltd' }
        ];

        for (let idx = 0; idx < companiesSetup.length; idx++) {
            const companyData = companiesSetup[idx];
            const tenant = await Tenant.create({
                name: companyData.name,
                isActive: true,
            });

            console.log('Created Company: ' + tenant.name);

            // 4. Create Company Admin
            const adminEmail = 'admin' + (idx + 1) + '@logistiq.com';
            const companyAdmin = await User.create({
                name: tenant.name + ' Admin',
                email: adminEmail,
                password: hashedPassword,
                role: UserRole.COMPANY_ADMIN,
                tenantId: tenant._id,
            });

            // 5. Create Warehouses
            const warehouses = await Warehouse.insertMany([
                { name: tenant.name + ' - North Warehouse', location: 'North Industrial Area', tenantId: tenant._id, companyId: tenant._id, managerId: companyAdmin._id },
                { name: tenant.name + ' - South Warehouse', location: 'South Business District', tenantId: tenant._id, companyId: tenant._id, managerId: companyAdmin._id }
            ]);

            // 6. Create 10 Products for this tenant
            const categories = ['Electronics', 'Groceries', 'Furniture', 'Apparel'];
            const productData = [];
            for (let i = 1; i <= 10; i++) {
                productData.push({
                    name: 'Product ' + i + ' (' + tenant.name + ')',
                    sku: 'SKU-' + tenant.name.substring(0, 3).toUpperCase() + '-' + i,
                    category: categories[i % categories.length],
                    unitType: i % 2 === 0 ? 'box' : 'piece',
                    purchasePrice: 10 + i * 5,
                    sellingPrice: 20 + i * 5,
                    minStockAlert: 5,
                    tenantId: tenant._id,
                });
            }
            const tenantProductsData = await Product.insertMany(productData);

            // 7. Create Stores assigned to Warehouses
            const storesList = await Store.insertMany([
                { name: tenant.name + ' Shop 1', ownerName: 'John Doe', phone: '12345678', address: 'Main St 1', warehouseId: warehouses[0]._id, tenantId: tenant._id },
                { name: tenant.name + ' Shop 2', ownerName: 'Jane Smith', phone: '87654321', address: 'Market Ave 5', warehouseId: warehouses[1]._id, tenantId: tenant._id }
            ]);

            // 8. Create Cars and Drivers
            const driversList = [];
            for (let i = 1; i <= 3; i++) {
                const driverUser = await User.create({
                    name: 'Driver ' + (idx + 1) + '-' + i + ' (' + tenant.name + ')',
                    email: 'driver' + (idx + 1) + '_' + i + '@logistiq.com',
                    password: hashedPassword,
                    role: UserRole.DRIVER,
                    tenantId: tenant._id,
                });
                driversList.push(driverUser);

                const vehicleData = await Vehicle.create({
                    name: 'Van ' + i,
                    plateNumber: 'PLATE-' + tenant._id.toString().substring(0, 4) + '-' + i,
                    driverId: driverUser._id,
                    capacity: 500,
                    status: VehicleStatus.AVAILABLE,
                    tenantId: tenant._id,
                });

                // Link vehicle to driver
                driverUser.vehicleId = vehicleData._id;
                await driverUser.save();
            }

            // 9. Create Sample Orders
            const orderStatuses = Object.values(OrderStatus);
            for (let i = 0; i < 5; i++) {
                const s = storesList[i % storesList.length];
                const w = warehouses[i % warehouses.length];
                const d = driversList[i % driversList.length];
                const status = orderStatuses[i % orderStatuses.length];

                const orderItems = [
                    { productId: tenantProductsData[0]._id, quantity: 2, price: tenantProductsData[0].sellingPrice },
                    { productId: tenantProductsData[1]._id, quantity: 1, price: tenantProductsData[1].sellingPrice }
                ];
                const totalAmount = orderItems.reduce((sum, item) => sum + (item.quantity * item.price), 0);

                await Order.create({
                    orderNumber: 'ORD-' + tenant.name.substring(0, 3).toUpperCase() + '-' + Date.now() + '-' + i,
                    storeId: s._id,
                    warehouseId: w._id,
                    driverId: status !== OrderStatus.PENDING ? d._id : undefined,
                    vehicleId: status !== OrderStatus.PENDING ? d.vehicleId : undefined,
                    items: orderItems,
                    totalAmount,
                    status: status,
                    tenantId: tenant._id,
                });
            }
        }

        console.log('Seeding completed successfully!');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    }
};

seed();
