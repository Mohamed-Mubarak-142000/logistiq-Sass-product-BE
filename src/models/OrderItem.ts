import mongoose, { Schema, Document } from 'mongoose';

export interface IOrderItem extends Document {
    orderId: mongoose.Types.ObjectId;
    productId: mongoose.Types.ObjectId;
    quantity: number;
    price: number;
    total: number;
    tenantId: mongoose.Types.ObjectId;
}

const OrderItemSchema: Schema = new Schema(
    {
        orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
        productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
        quantity: { type: Number, required: true },
        price: { type: Number, required: true },
        total: { type: Number, required: true },
        tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true },
    },
    { timestamps: true }
);

export default mongoose.model<IOrderItem>('OrderItem', OrderItemSchema);
