import mongoose, { Schema, Document } from 'mongoose';

export enum OrderStatus {
    PENDING = 'PENDING',
    APPROVED = 'APPROVED',
    PACKED = 'PACKED',
    SHIPPED = 'SHIPPED',
    DELIVERED = 'DELIVERED',
    RETURNED = 'RETURNED',
    CANCELLED = 'CANCELLED'
}

interface IOrderItem {
    productId: mongoose.Types.ObjectId;
    quantity: number;
    price: number;
}

export interface IOrder extends Document {
    orderNumber: string;
    storeId: mongoose.Types.ObjectId;
    warehouseId?: mongoose.Types.ObjectId;
    vehicleId?: mongoose.Types.ObjectId;
    items: IOrderItem[];
    totalAmount: number;
    status: OrderStatus;
    notes?: string;
    tenantId: mongoose.Types.ObjectId;
    createdAt: Date;
    updatedAt: Date;
}

const OrderSchema: Schema = new Schema({
    orderNumber: { type: String, required: true, unique: true },
    storeId: { type: Schema.Types.ObjectId, ref: 'Store', required: true },
    warehouseId: { type: Schema.Types.ObjectId, ref: 'Warehouse' },
    vehicleId: { type: Schema.Types.ObjectId, ref: 'Vehicle' },
    items: [{
        productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
        quantity: { type: Number, required: true },
        price: { type: Number, required: true }
    }],
    totalAmount: { type: Number, required: true },
    status: { type: String, enum: Object.values(OrderStatus), default: OrderStatus.PENDING },
    notes: { type: String },
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true },
}, { timestamps: true });

export default mongoose.model<IOrder>('Order', OrderSchema);
