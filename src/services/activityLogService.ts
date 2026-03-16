import ActivityLog from '../models/ActivityLog';

export type ActivityLogPayload = {
    action: string;
    tenantId: string;
    actorId?: string;
    actorRole?: string;
    entityType?: string;
    entityId?: string;
    metadata?: Record<string, unknown>;
};

export const createActivityLog = async (payload: ActivityLogPayload) => {
    return ActivityLog.create({
        action: payload.action,
        tenantId: payload.tenantId,
        actorId: payload.actorId,
        actorRole: payload.actorRole,
        entityType: payload.entityType,
        entityId: payload.entityId,
        metadata: payload.metadata,
    });
};

export const getActivityLogs = async (filters: {
    tenantId?: string;
    from?: Date;
    to?: Date;
    limit?: number;
}) => {
    const query: Record<string, unknown> = {};
    if (filters.tenantId) query.tenantId = filters.tenantId;
    if (filters.from || filters.to) {
        query.createdAt = {
            ...(filters.from ? { $gte: filters.from } : {}),
            ...(filters.to ? { $lte: filters.to } : {}),
        };
    }

    const limit = filters.limit ?? 5000;

    return ActivityLog.find(query)
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();
};
