import mongoose, { Schema, Document } from 'mongoose';

export interface IActivityLog extends Document {
    action: string;
    tenantId: mongoose.Types.ObjectId;
    actorId?: mongoose.Types.ObjectId;
    actorRole?: string;
    entityType?: string;
    entityId?: mongoose.Types.ObjectId;
    metadata?: Record<string, unknown>;
    createdAt: Date;
    updatedAt: Date;
}

const ActivityLogSchema: Schema = new Schema(
    {
        action: { type: String, required: true },
        tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true },
        actorId: { type: Schema.Types.ObjectId, ref: 'User' },
        actorRole: { type: String },
        entityType: { type: String },
        entityId: { type: Schema.Types.ObjectId },
        metadata: { type: Schema.Types.Mixed },
    },
    { timestamps: true }
);

ActivityLogSchema.index({ tenantId: 1, createdAt: -1 });

export default mongoose.model<IActivityLog>('ActivityLog', ActivityLogSchema);
