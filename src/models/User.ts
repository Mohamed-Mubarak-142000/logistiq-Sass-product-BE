import mongoose, { Schema, Document } from 'mongoose';

export enum UserRole {
    SUPER_ADMIN = 'SUPER_ADMIN',
    COMPANY_ADMIN = 'COMPANY_ADMIN',
    WAREHOUSE_OWNER = 'WAREHOUSE_OWNER',
    WAREHOUSE_MANAGER = 'WAREHOUSE_MANAGER',
    DRIVER = 'DRIVER',
    SHOP_OWNER = 'SHOP_OWNER',
    SUPERMARKET_OWNER = 'SUPERMARKET_OWNER',
}

export interface IUser extends Document {
    name: string;
    email: string;
    password: string;
    role: UserRole;
    tenantId: mongoose.Types.ObjectId;
    location?: {
        lat: number;
        lng: number;
        address?: string;
    };
    mustResetPassword: boolean; // Flag to force password reset on first login
    warehouseId?: mongoose.Types.ObjectId;
    vehicleId?: mongoose.Types.ObjectId;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const UserSchema: Schema = new Schema(
    {
        name: { type: String, required: true },
        email: { type: String, required: true },
        password: { type: String, required: true },
        role: {
            type: String,
            enum: Object.values(UserRole),
            default: UserRole.COMPANY_ADMIN,
        },
        tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true },
        warehouseId: { type: Schema.Types.ObjectId, ref: 'Warehouse' },
        vehicleId: { type: Schema.Types.ObjectId, ref: 'Vehicle' },
        location: {
            lat: { type: Number },
            lng: { type: Number },
            address: { type: String },
        },
        mustResetPassword: { type: Boolean, default: false },
        isActive: { type: Boolean, default: true },
    },
    { timestamps: true }
);

// Ensure email is unique per tenant
UserSchema.index({ email: 1, tenantId: 1 }, { unique: true });

export default mongoose.model<IUser>('User', UserSchema);
