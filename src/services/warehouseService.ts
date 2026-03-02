import { warehouseRepository } from '../repositories/warehouseRepository';
import User, { UserRole } from '../models/User';
import bcrypt from 'bcryptjs';
import { sendWelcomeEmail } from '../utils/emailService';

export const createWarehouse = async (data: any, tenantId: string) => {
    const { 
        name, 
        location, 
        lat, 
        lng, 
        managerName, 
        managerEmail, 
        managerPassword = Math.floor(100000 + Math.random() * 900000).toString(),
        isActive = true
    } = data;

    // 1. Create the warehouse
    const warehouse = await warehouseRepository.create({ 
        name, 
        location, 
        lat, 
        lng, 
        tenantId, 
        isActive 
    });

    // 2. Create the Warehouse Owner / Manager user
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(managerPassword, salt);

    const manager = await User.create({
        name: managerName,
        email: managerEmail,
        password: hashedPassword,
        role: UserRole.WAREHOUSE_OWNER, // Makzan Manager = Makzan Owner
        tenantId,
        warehouseId: warehouse._id,
        location: { lat, lng, address: location },
        mustResetPassword: true,
        isActive: true
    });

    // 3. Link manager to warehouse
    await warehouseRepository.update(warehouse._id.toString(), { managerId: manager._id });

    // 4. Send email
    await sendWelcomeEmail(managerEmail, managerPassword, managerName);

    return {
        warehouse,
        manager: {
            id: manager._id,
            name: manager.name,
            email: manager.email
        }
    };
};

export const getWarehouses = async (tenantId: string, options: any, search = '') => {
    let query: any = { tenantId, isActive: true };
    if (search) {
        query.name = { $regex: search, $options: 'i' };
    }
    const warehouses = await warehouseRepository.find(query, options);
    const total = await warehouseRepository.count(query);
    return { warehouses, total };
};

export const getWarehouseById = async (id: string, tenantId: string) => {
    const warehouse = await warehouseRepository.findOne({ _id: id, tenantId });
    if (!warehouse) throw new Error('Warehouse not found');
    return warehouse;
};

export const updateWarehouse = async (id: string, data: any, tenantId: string) => {
    const warehouse = await warehouseRepository.findOne({ _id: id, tenantId });
    if (!warehouse) throw new Error('Warehouse not found');
    return await warehouseRepository.update(id, data);
};

export const deleteWarehouse = async (id: string, tenantId: string) => {
    const warehouse = await warehouseRepository.findOne({ _id: id, tenantId });
    if (!warehouse) throw new Error('Warehouse not found');
    return await warehouseRepository.update(id, { isActive: false });
};
