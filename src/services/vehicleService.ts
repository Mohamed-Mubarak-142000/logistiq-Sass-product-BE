import { vehicleRepository } from '../repositories/vehicleRepository';

export const createVehicle = async (data: any, tenantId: string) => {
    return await vehicleRepository.create({ ...data, tenantId });
};

export const getVehicles = async (tenantId: string, options: any, search = '') => {
    let query: any = { tenantId };
    if (search) {
        query.$or = [
            { name: { $regex: search, $options: 'i' } },
            { plateNumber: { $regex: search, $options: 'i' } }
        ];
    }
    const vehicles = await vehicleRepository.find(query, options);
    const total = await vehicleRepository.count(query);
    return { vehicles, total };
};

export const getVehicleById = async (id: string, tenantId: string) => {
    const vehicle = await vehicleRepository.findOne({ _id: id, tenantId });
    if (!vehicle) throw new Error('Vehicle not found');
    return vehicle;
};

export const updateVehicle = async (id: string, data: any, tenantId: string) => {
    const vehicle = await vehicleRepository.findOne({ _id: id, tenantId });
    if (!vehicle) throw new Error('Vehicle not found');
    return await vehicleRepository.update(id, data);
};

export const deleteVehicle = async (id: string, tenantId: string) => {
    const vehicle = await vehicleRepository.findOne({ _id: id, tenantId });
    if (!vehicle) throw new Error('Vehicle not found');
    return await vehicleRepository.delete(id);
};
