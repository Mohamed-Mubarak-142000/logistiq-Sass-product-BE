import mongoose, { Schema, Document } from 'mongoose';

export interface IStore extends Document {
    name: string;
    ownerName: string;
    phone: string;
    address: string;
    creditLimit: number;
    paymentType: 'cash' | 'credit';
    tenantId: mongoose.Types.ObjectId;
    isActive: boolean;
}

const StoreSchema: Schema = new Schema({
    name: { type: String, required: true },
    ownerName: { type: String, required: true },
    phone: { type: String, required: true },
    address: { type: String, required: true },
    lat: { type: Number },
    lng: { type: Number },
    creditLimit: { type: Number, default: 0 },
    paymentType: { type: String, enum: ['cash', 'credit'], default: 'cash' },
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true },
    isActive: { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.model<IStore>('Store', StoreSchema);
