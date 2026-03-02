import { inventoryMovementRepository } from '../repositories/inventoryMovementRepository';

export const createMovement = async (data: any, tenantId: string) => {
    return await inventoryMovementRepository.create({ ...data, tenantId });
};

export const getMovements = async (tenantId: string, options: any, filter: any = {}) => {
    let query: any = { tenantId, ...filter };
    const movements = await inventoryMovementRepository.find(query, options);
    const total = await inventoryMovementRepository.count(query);
    return { movements, total };
};
