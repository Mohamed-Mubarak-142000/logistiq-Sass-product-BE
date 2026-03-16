import { vehicleRepository } from '../repositories/vehicleRepository';
import User, { UserRole } from '../models/User';
import Warehouse from '../models/Warehouse';

export const createVehicle = async (data: any, tenantId: string, actorRole?: string) => {
    const { 
        name, 
        plateNumber, 
        capacity, 
        driverId,
        warehouseId,
        isActive = true
    } = data;

    if (!driverId) {
        throw new Error('Driver is required');
    }

    if (!warehouseId) {
        throw new Error('Warehouse is required');
    }

    const isSuperAdmin = actorRole === UserRole.SUPER_ADMIN;
    const warehouseLookup = isSuperAdmin ? { _id: warehouseId } : { _id: warehouseId, tenantId };
    const warehouseExists = await Warehouse.findOne(warehouseLookup).select('_id tenantId').lean();
    if (!warehouseExists) {
        throw new Error('Warehouse not found');
    }

    const effectiveTenantId = isSuperAdmin ? warehouseExists.tenantId?.toString() : tenantId;
    const existingDriver = await User.findOne({ _id: driverId, tenantId: effectiveTenantId, role: UserRole.DRIVER }).select('_id name');
    if (!existingDriver) {
        throw new Error('Driver not found');
    }

    const vehicle = await vehicleRepository.create({
        name,
        plateNumber,
        capacity,
        driverId: existingDriver._id,
        warehouseId,
        tenantId: effectiveTenantId,
        isActive
    });

    await User.findByIdAndUpdate(existingDriver._id, { vehicleId: vehicle._id });

    return {
        vehicle,
        driver: {
            id: existingDriver._id,
            name: existingDriver.name
        }
    };
};

export const getVehicles = async (tenantId: string | undefined, options: any, search = '', filters: any = {}) => {
    let query: any = { ...filters };
    if (tenantId) {
        query.tenantId = tenantId;
    }
    if (search) {
        query.$or = [
            { name: { $regex: search, $options: 'i' } },
            { plateNumber: { $regex: search, $options: 'i' } }
        ];
    }
    const { skip = 0, limit = 10, sort = { createdAt: -1 } } = options;
    const vehicles = await vehicleRepository.model
        .find(query)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .populate('driverId', 'name')
        .populate({
            path: 'warehouseId',
            select: 'name companyId',
            populate: { path: 'companyId', select: 'name' },
        });
    const total = await vehicleRepository.count(query);
    return { vehicles, total };
};

export const getVehicleById = async (id: string, tenantId?: string) => {
    const query = tenantId ? { _id: id, tenantId } : { _id: id };
    const vehicle = await vehicleRepository.model
        .findOne(query)
        .populate('driverId', 'name')
        .populate({
            path: 'warehouseId',
            select: 'name companyId',
            populate: { path: 'companyId', select: 'name' },
        });
    if (!vehicle) throw new Error('Vehicle not found');
    return vehicle;
};

export const updateVehicle = async (id: string, data: any, tenantId: string, actorRole?: string) => {
    const isSuperAdmin = actorRole === UserRole.SUPER_ADMIN;
    const vehicleQuery = isSuperAdmin ? { _id: id } : { _id: id, tenantId };
    const vehicle = await vehicleRepository.findOne(vehicleQuery);
    if (!vehicle) throw new Error('Vehicle not found');
    let effectiveTenantId = isSuperAdmin ? vehicle.tenantId?.toString() : tenantId;
    if (data.driverId) {
        const existingDriver = await User.findOne({ _id: data.driverId, tenantId: effectiveTenantId, role: UserRole.DRIVER }).select('_id');
        if (!existingDriver) {
            throw new Error('Driver not found');
        }
    }
    if (data.warehouseId) {
        const warehouseQuery = isSuperAdmin ? { _id: data.warehouseId } : { _id: data.warehouseId, tenantId };
        const warehouseExists = await Warehouse.findOne(warehouseQuery).select('_id tenantId').lean();
        if (!warehouseExists) {
            throw new Error('Warehouse not found');
        }
        if (isSuperAdmin && warehouseExists.tenantId) {
            effectiveTenantId = warehouseExists.tenantId.toString();
        }
    }
    return await vehicleRepository.update(id, { ...data, tenantId: effectiveTenantId });
};

export const deleteVehicle = async (id: string, tenantId: string) => {
    const vehicle = await vehicleRepository.findOne({ _id: id, tenantId });
    if (!vehicle) throw new Error('Vehicle not found');
    return await vehicleRepository.delete(id);
};
