import Vehicle, { IVehicle } from '../models/Vehicle';
import { BaseRepository } from './baseRepository';

class VehicleRepository extends BaseRepository<IVehicle> {
    constructor() {
        super(Vehicle);
    }
}

export const vehicleRepository = new VehicleRepository();
