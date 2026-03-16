import mongoose, { Schema, Document } from 'mongoose';

export enum CampaignStatus {
    ACTIVE = 'ACTIVE',
    PAUSED = 'PAUSED',
    COMPLETED = 'COMPLETED',
}

export interface ICampaign extends Document {
    name: string;
    description?: string;
    startDate: Date;
    endDate: Date;
    budget: number;
    status: CampaignStatus;
    companyId: mongoose.Types.ObjectId;
    targetAudience?: string;
    tags?: string[];
}

const CampaignSchema: Schema = new Schema(
    {
        name: { type: String, required: true },
        description: { type: String },
        startDate: { type: Date, required: true },
        endDate: { type: Date, required: true },
        budget: { type: Number, required: true, min: 0 },
        status: { type: String, enum: Object.values(CampaignStatus), default: CampaignStatus.ACTIVE },
        companyId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true },
        targetAudience: { type: String },
        tags: [{ type: String }],
    },
    { timestamps: true }
);

export default mongoose.model<ICampaign>('Campaign', CampaignSchema);
