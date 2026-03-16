import { storeRepository } from '../repositories/storeRepository';
import User, { UserRole } from '../models/User';
import bcrypt from 'bcryptjs';
import { sendWelcomeEmail } from '../utils/emailService';

export const createStore = async (data: any, tenantId: string) => {
    const { 
        name, 
        ownerName, 
        phone, 
        address, 
        lat, 
        lng, 
        creditLimit, 
        paymentType, 
        warehouseId,
        email,
        password = Math.floor(100000 + Math.random() * 900000).toString(),
        isActive = true
    } = data;

    // 1. Create the store
    const store = await storeRepository.create({ 
        name, 
        ownerName, 
        phone, 
        address, 
        lat, 
        lng, 
        creditLimit, 
        paymentType, 
        warehouseId,
        tenantId, 
        isActive 
    });

    // 2. Create the Shop Owner user
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    const user = await User.create({
        name: ownerName,
        email,
        password: hashedPassword,
        role: UserRole.SHOP_OWNER,
        tenantId,
        location: { lat, lng, address },
        mustResetPassword: true,
        isActive: true
    });

    // 3. Send email
    await sendWelcomeEmail(email, password, ownerName);

    return {
        store,
        user: {
            id: user._id,
            name: user.name,
            email: user.email
        }
    };
};

export const getStores = async (tenantId: string, options: any, search = '', filters: any = {}) => {
    let query: any = { tenantId, ...filters };
    if (search) {
        query.$or = [
            { name: { $regex: search, $options: 'i' } },
            { ownerName: { $regex: search, $options: 'i' } }
        ];
    }
    if (query.isActive === undefined) {
        query.isActive = true;
    }
    const stores = await storeRepository.find(query, options);
    const total = await storeRepository.count(query);
    return { stores, total };
};

export const getStoreById = async (id: string, tenantId: string) => {
    const store = await storeRepository.findOne({ _id: id, tenantId });
    if (!store) throw new Error('Store not found');
    return store;
};

export const updateStore = async (id: string, data: any, tenantId: string) => {
    const store = await storeRepository.findOne({ _id: id, tenantId });
    if (!store) throw new Error('Store not found');
    
    // Explicitly update lat/lng if provided in data
    const updateData = { ...data };
    if (data.lat !== undefined) updateData.lat = data.lat;
    if (data.lng !== undefined) updateData.lng = data.lng;
    
    return await storeRepository.update(id, updateData);
};

export const deleteStore = async (id: string, tenantId: string) => {
    const store = await storeRepository.findOne({ _id: id, tenantId });
    if (!store) throw new Error('Store not found');
    return await storeRepository.update(id, { isActive: false });
};
