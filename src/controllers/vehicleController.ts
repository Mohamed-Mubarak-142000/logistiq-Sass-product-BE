import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth';
import * as vehicleService from '../services/vehicleService';

export const createVehicle = async (req: AuthRequest, res: Response) => {
    try {
        const tenantId = req.user!.tenantId;
        const vehicle = await vehicleService.createVehicle(req.body, tenantId.toString());
        res.status(201).json({ success: true, data: vehicle });
    } catch (error: any) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const getVehicles = async (req: AuthRequest, res: Response) => {
    try {
        const tenantId = req.user!.tenantId;
        const { page = 1, limit = 10, search = '' } = req.query;
        const options = {
            skip: (Number(page) - 1) * Number(limit),
            limit: Number(limit),
        };
        const result = await vehicleService.getVehicles(tenantId.toString(), options, search as string);
        res.status(200).json({ success: true, data: result });
    } catch (error: any) {
        res.status(400).json({ success: false, message: error.message });
    }
};

export const getVehicleById = async (req: AuthRequest, res: Response) => {
    try {
        const tenantId = req.user!.tenantId;
        const vehicle = await vehicleService.getVehicleById(req.params.id as string, tenantId.toString());
        res.status(200).json({ success: true, data: vehicle });
    } catch (error: any) {
        res.status(404).json({ success: false, message: error.message });
    }
};

export const updateVehicle = async (req: AuthRequest, res: Response) => {
    try {
        const tenantId = req.user!.tenantId;
        const vehicle = await vehicleService.updateVehicle(req.params.id as string, req.body, tenantId.toString());
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
