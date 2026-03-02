import mongoose, { Schema, Document } from 'mongoose';

export enum MovementType {
    IN = 'IN',
    OUT = 'OUT',
    TRANSFER = 'TRANSFER',
    ADJUSTMENT = 'ADJUSTMENT'
}

export interface IInventoryMovement extends Document {
    productId: mongoose.Types.ObjectId;
    warehouseId: mongoose.Types.ObjectId;
    quantity: number;
    type: MovementType;
    reason: string;
    userId: mongoose.Types.ObjectId;
    tenantId: mongoose.Types.ObjectId;
    createdAt: Date;
}

const InventoryMovementSchema: Schema = new Schema({
    productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    warehouseId: { type: Schema.Types.ObjectId, ref: 'Warehouse', required: true },
    quantity: { type: Number, required: true },
    type: { type: String, enum: Object.values(MovementType), required: true },
    reason: { type: String, required: true },
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true },
}, { timestamps: true });

export default mongoose.model<IInventoryMovement>('InventoryMovement', InventoryMovementSchema);
