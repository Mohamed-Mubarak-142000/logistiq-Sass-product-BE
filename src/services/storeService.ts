import { storeRepository } from '../repositories/storeRepository';

export const createStore = async (data: any, tenantId: string) => {
    return await storeRepository.create({ ...data, tenantId });
};

export const getStores = async (tenantId: string, options: any, search = '') => {
    let query: any = { tenantId, isActive: true };
    if (search) {
        query.$or = [
            { name: { $regex: search, $options: 'i' } },
            { ownerName: { $regex: search, $options: 'i' } }
        ];
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
