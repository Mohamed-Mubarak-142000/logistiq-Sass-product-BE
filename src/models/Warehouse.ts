import mongoose, { Schema, Document } from 'mongoose';

export interface IWarehouse extends Document {
    name: string;
    location: string;
    storageCapacity: number;
    companyId: mongoose.Types.ObjectId;
    tenantId: mongoose.Types.ObjectId;
    managerId?: mongoose.Types.ObjectId;
    isActive: boolean;
}

const WarehouseSchema: Schema = new Schema(
    {
        name: { type: String, required: true },
        location: { type: String, required: true },
        storageCapacity: { type: Number, required: true, min: 0 },
        lat: { type: Number },
        lng: { type: Number },
        companyId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true },
        tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true },
        managerId: { type: Schema.Types.ObjectId, ref: 'User' },
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

export default mongoose.model<IWarehouse>('Warehouse', WarehouseSchema);
