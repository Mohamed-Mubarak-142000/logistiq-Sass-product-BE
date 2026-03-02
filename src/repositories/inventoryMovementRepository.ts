import InventoryMovement, { IInventoryMovement } from '../models/InventoryMovement';
import { BaseRepository } from './baseRepository';

class InventoryMovementRepository extends BaseRepository<IInventoryMovement> {
    constructor() {
        super(InventoryMovement);
    }
}

export const inventoryMovementRepository = new InventoryMovementRepository();
