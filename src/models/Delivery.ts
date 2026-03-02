import mongoose, { Schema, Document } from 'mongoose';

export interface IDelivery extends Document {
    orderId: mongoose.Types.ObjectId;
    vehicleId: mongoose.Types.ObjectId;
    driverId: mongoose.Types.ObjectId;
    status: 'pending' | 'on-the-way' | 'delivered' | 'failed';
    actualDeliveryTime?: Date;
    deliveryNotes?: string;
    tenantId: mongoose.Types.ObjectId;
}

const DeliverySchema: Schema = new Schema(
    {
        orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
        vehicleId: { type: Schema.Types.ObjectId, ref: 'Vehicle', required: true },
        driverId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
        status: {
            type: String,
            enum: ['pending', 'on-the-way', 'delivered', 'failed'],
            default: 'pending',
        },
        actualDeliveryTime: { type: Date },
        deliveryNotes: { type: String },
        tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true },
    },
    { timestamps: true }
);

export default mongoose.model<IDelivery>('Delivery', DeliverySchema);
