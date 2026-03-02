import Product, { IProduct } from '../models/Product';
import { BaseRepository } from './baseRepository';

export class ProductRepository extends BaseRepository<IProduct> {
    constructor() {
        super(Product);
    }

    // Add specific queries if needed
    async findBySku(sku: string, tenantId: string): Promise<IProduct | null> {
        return await this.model.findOne({ sku, tenantId });
    }
}

export const productRepository = new ProductRepository();
