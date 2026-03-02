import { productRepository } from '../repositories/productRepository';

export const createProduct = async (data: any, tenantId: string) => {
    return await productRepository.create({ ...data, tenantId });
};

export const getProducts = async (tenantId: string, options: any, search = '', filters: any = {}) => {
    let query: any = { tenantId, isActive: true };
    if (search) {
        query.$or = [
            { name: { $regex: search, $options: 'i' } },
            { sku: { $regex: search, $options: 'i' } },
            { category: { $regex: search, $options: 'i' } }
        ];
    }

    // Apply any extra filters
    Object.keys(filters).forEach(key => {
        if (filters[key] !== undefined && filters[key] !== '') {
            query[key] = filters[key];
        }
    });

    const products = await productRepository.find(query, options);
    const total = await productRepository.count(query);
    return { products, total };
};

export const getProductById = async (id: string, tenantId: string) => {
    const product = await productRepository.findOne({ _id: id, tenantId });
    if (!product) throw new Error('Product not found');
    return product;
};

export const updateProduct = async (id: string, data: any, tenantId: string) => {
    const product = await productRepository.findOne({ _id: id, tenantId });
    if (!product) throw new Error('Product not found');
    return await productRepository.update(id, data);
};

export const deleteProduct = async (id: string, tenantId: string) => {
    const product = await productRepository.findOne({ _id: id, tenantId });
    if (!product) throw new Error('Product not found');
    return await productRepository.update(id, { isActive: false }); // Soft delete
};
