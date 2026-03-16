import { categoryRepository } from '../repositories/categoryRepository';
import { storeRepository } from '../repositories/storeRepository';

export const createCategory = async (data: any, tenantId: string) => {
    const { name, storeId, imageUrl, isActive = true } = data;

    if (!name) throw new Error('Category name is required');
    if (!storeId) throw new Error('Store is required');
    if (!imageUrl) throw new Error('Category image is required');

    const store = await storeRepository.findOne({ _id: storeId, tenantId });
    if (!store) throw new Error('Store not found for the selected company');

    const existing = await categoryRepository.findOne({ name, tenantId, storeId });
    if (existing) throw new Error('Category already exists for this store');

    return await categoryRepository.create({ name, storeId, tenantId, imageUrl, isActive });
};

export const getCategories = async (tenantId: string | undefined, filters: any = {}) => {
    const query: any = {};
    if (tenantId) {
        query.tenantId = tenantId;
    }
    if (filters.storeId) query.storeId = filters.storeId;
    if (filters.isActive !== undefined) {
        query.isActive = filters.isActive === 'true' || filters.isActive === true;
    } else {
        query.isActive = true;
    }

    return await categoryRepository.model
        .find(query)
        .populate('storeId', 'name')
        .sort({ createdAt: -1 })
        .lean();
};

export const updateCategory = async (id: string, data: any, tenantId: string, isSuperAdmin = false) => {
    const category = await categoryRepository.findOne(isSuperAdmin ? { _id: id } : { _id: id, tenantId });
    if (!category) throw new Error('Category not found');

    const nextStoreId = data.storeId || category.storeId;
    const nextName = data.name || category.name;
    const nextImageUrl = data.imageUrl || category.imageUrl;

    if (data.storeId) {
        const store = await storeRepository.findOne({ _id: data.storeId, tenantId });
        if (!store) throw new Error('Store not found for the selected company');
    }

    const duplicate = await categoryRepository.findOne({
        _id: { $ne: id },
        tenantId: isSuperAdmin ? (category.tenantId || tenantId) : tenantId,
        storeId: nextStoreId,
        name: nextName,
    });
    if (duplicate) throw new Error('Category already exists for this store');

    return await categoryRepository.update(id, { name: nextName, storeId: nextStoreId, imageUrl: nextImageUrl, tenantId: isSuperAdmin ? (category.tenantId || tenantId) : tenantId });
};
