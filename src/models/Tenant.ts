import mongoose, { Schema, Document } from 'mongoose';

export interface ITenant extends Document {
    name: string;
    subdomain?: string;
    plan: 'free' | 'pro' | 'enterprise';
    isActive: boolean;
    location?: {
        lat: number;
        lng: number;
        address?: string;
    };
    createdAt: Date;
    updatedAt: Date;
}

const TenantSchema: Schema = new Schema(
    {
        name: { type: String, required: true },
        subdomain: { type: String, unique: true, sparse: true },
        plan: { type: String, enum: ['free', 'pro', 'enterprise'], default: 'free' },
        isActive: { type: Boolean, default: true },
        location: {
            lat: { type: Number },
            lng: { type: Number },
            address: { type: String },
        },
    },
    { timestamps: true }
);

export default mongoose.model<ITenant>('Tenant', TenantSchema);
