import Warehouse, { IWarehouse } from '../models/Warehouse';
import { BaseRepository } from './baseRepository';

class WarehouseRepository extends BaseRepository<IWarehouse> {
    constructor() {
        super(Warehouse);
    }
}

export const warehouseRepository = new WarehouseRepository();
