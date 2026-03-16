import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import * as vehicleService from '../services/vehicleService';
import { createActivityLog } from '../services/activityLogService';

export const createVehicle = async (req: AuthRequest, res: Response) => {
    try {
        const tenantId = req.user!.tenantId;
        const vehicle = await vehicleService.createVehicle(req.body, tenantId.toString(), req.user!.role);
        await createActivityLog({
            action: 'VEHICLE_CREATED',
            tenantId: vehicle.vehicle?.tenantId?.toString() || tenantId.toString(),
            actorId: req.user!.userId,
            actorRole: req.user!.role,
            entityType: 'Vehicle',
            entityId: vehicle.vehicle?._id?.toString(),
            metadata: { name: vehicle.vehicle?.name, plateNumber: vehicle.vehicle?.plateNumber }
        });
        res.status(201).json({ success: true, data: vehicle });
    } catch (error: any) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const getVehicles = async (req: AuthRequest, res: Response) => {
    try {
        const tenantId = req.user!.tenantId;
        const isSuperAdmin = req.user!.role === 'SUPER_ADMIN';
        const { page = 1, limit = 10, search = '', sortBy = 'createdAt', order = 'desc', ...filters } = req.query;
        const sortByValue = Array.isArray(sortBy) ? sortBy[0] : sortBy;
        const orderValue = Array.isArray(order) ? order[0] : order;
        const sortKey = typeof sortByValue === 'string' && sortByValue.trim() !== '' ? sortByValue : 'createdAt';
        const sortDirection = orderValue === 'asc' ? 1 : -1;
        const options = {
            skip: (Number(page) - 1) * Number(limit),
            limit: Number(limit),
            sort: { [sortKey]: sortDirection },
        };
        const result = await vehicleService.getVehicles(isSuperAdmin ? undefined : tenantId.toString(), options, search as string, filters);
        res.status(200).json({ success: true, data: result });
    } catch (error: any) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const getVehicleById = async (req: AuthRequest, res: Response) => {
    try {
        const tenantId = req.user!.tenantId;
        const isSuperAdmin = req.user!.role === 'SUPER_ADMIN';
        const vehicle = await vehicleService.getVehicleById(
            req.params.id as string,
            isSuperAdmin ? undefined : tenantId.toString()
        );
        res.status(200).json({ success: true, data: vehicle });
    } catch (error: any) {
        res.status(404).json({ success: false, message: error.message });
    }
};

export const updateVehicle = async (req: AuthRequest, res: Response) => {
    try {
        const tenantId = req.user!.tenantId;
        const vehicle = await vehicleService.updateVehicle(req.params.id as string, req.body, tenantId.toString(), req.user!.role);
        await createActivityLog({
            action: 'VEHICLE_UPDATED',
            tenantId: vehicle.tenantId?.toString() || tenantId.toString(),
            actorId: req.user!.userId,
            actorRole: req.user!.role,
            entityType: 'Vehicle',
            entityId: req.params.id as string,
            metadata: { name: vehicle.name, plateNumber: vehicle.plateNumber }
        });
        res.status(200).json({ success: true, data: vehicle });
    } catch (error: any) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const deleteVehicle = async (req: AuthRequest, res: Response) => {
    try {
        const tenantId = req.user!.tenantId;
        await vehicleService.deleteVehicle(req.params.id as string, tenantId.toString());
        res.status(200).json({ success: true, message: 'Vehicle deleted successfully' });
    } catch (error: any) {
        res.status(400).json({ success: false, message: error.message });
    }
};
