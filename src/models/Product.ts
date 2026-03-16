import mongoose, { Schema, Document } from 'mongoose';

export interface IProduct extends Document {
    name: string;
    sku: string;
    category: string;
    unitType: 'box' | 'piece';
    purchasePrice: number;
    sellingPrice: number;
    minStockAlert: number;
    stock: number;
    barcode?: string;
    expiryDate?: Date;
    imageUrl?: string;
    storeId?: mongoose.Types.ObjectId;
    tenantId: mongoose.Types.ObjectId;
    isActive: boolean;
}

const ProductSchema: Schema = new Schema(
    {
        name: { type: String, required: true },
        sku: { type: String, required: true },
        category: { type: String, required: true },
        unitType: { type: String, enum: ['box', 'piece'], default: 'piece' },
        purchasePrice: { type: Number, required: true },
        sellingPrice: { type: Number, required: true },
        minStockAlert: { type: Number, default: 10 },
        stock: { type: Number, default: 0 },
        barcode: { type: String },
        expiryDate: { type: Date },
        imageUrl: { type: String },
        storeId: { type: Schema.Types.ObjectId, ref: 'Store' },
        tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true },
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

ProductSchema.index({ sku: 1, tenantId: 1 }, { unique: true });

export default mongoose.model<IProduct>('Product', ProductSchema);
