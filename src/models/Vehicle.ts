import mongoose, { Schema, Document } from 'mongoose';

export enum VehicleStatus {
    AVAILABLE = 'AVAILABLE',
    BUSY = 'BUSY',
    MAINTENANCE = 'MAINTENANCE',
    INACTIVE = 'INACTIVE'
}

export interface IVehicle extends Document {
    name: string;
    plateNumber: string;
    driverId?: mongoose.Types.ObjectId;
    warehouseId?: mongoose.Types.ObjectId;
    capacity: number;
    status: VehicleStatus;
    tenantId: mongoose.Types.ObjectId;
}

const VehicleSchema: Schema = new Schema({
    name: { type: String, required: true },
    plateNumber: { type: String, required: true },
    driverId: { type: Schema.Types.ObjectId, ref: 'User' },
    warehouseId: { type: Schema.Types.ObjectId, ref: 'Warehouse' },
    capacity: { type: Number, required: true }, // in kg or volume
    status: { type: String, enum: Object.values(VehicleStatus), default: VehicleStatus.AVAILABLE },
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true },
}, { timestamps: true });

export default mongoose.model<IVehicle>('Vehicle', VehicleSchema);
