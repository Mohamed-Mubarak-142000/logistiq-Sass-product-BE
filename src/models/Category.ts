import mongoose, { Schema, Document } from 'mongoose';

export interface ICategory extends Document {
    name: string;
    tenantId: mongoose.Types.ObjectId;
    storeId: mongoose.Types.ObjectId;
    imageUrl?: string;
    isActive: boolean;
}

const CategorySchema: Schema = new Schema(
    {
        name: { type: String, required: true },
        tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true },
        storeId: { type: Schema.Types.ObjectId, ref: 'Store', required: true },
        imageUrl: { type: String },
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

CategorySchema.index({ name: 1, tenantId: 1, storeId: 1 }, { unique: true });

export default mongoose.model<ICategory>('Category', CategorySchema);
