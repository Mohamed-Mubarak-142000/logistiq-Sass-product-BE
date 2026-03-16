import { warehouseRepository } from '../repositories/warehouseRepository';
import User, { UserRole } from '../models/User';
import Tenant from '../models/Tenant';
import bcrypt from 'bcryptjs';
import { sendWelcomeEmail } from '../utils/emailService';

const normalizeText = (value?: string) => (value || '').toLowerCase().replace(/\s+/g, ' ').trim();

const extractGovernorate = (address?: string) => {
    if (!address) return '';
    const parts = address.split(',').map((part) => part.trim()).filter(Boolean);
    return parts.length > 0 ? parts[parts.length - 1] : '';
};

const assertLocationMatchesGovernorate = (warehouseLocation: string, companyAddress?: string) => {
    const governorate = extractGovernorate(companyAddress);
    if (!governorate) return;
    const normalizedGovernorate = normalizeText(governorate);
    const normalizedLocation = normalizeText(warehouseLocation);
    if (!normalizedLocation.includes(normalizedGovernorate)) {
        throw new Error('Warehouse location must match company governorate.');
    }
};

const ensureCompanyLocationMatch = async (warehouseLocation: string, companyId: string) => {
    const company = await Tenant.findById(companyId).select('location').lean();
    if (!company) {
        throw new Error('Company not found.');
    }
    assertLocationMatchesGovernorate(warehouseLocation, company.location?.address);
};

export const createWarehouse = async (data: any, tenantId: string, companyId: string) => {
    const { 
        name, 
        location, 
        lat, 
        lng, 
        storageCapacity,
        managerName, 
        managerEmail, 
        managerPassword = Math.floor(100000 + Math.random() * 900000).toString(),
        isActive = true
    } = data;

    await ensureCompanyLocationMatch(location, companyId);

    // 1. Create the warehouse
    const warehouse = await warehouseRepository.create({ 
        name, 
        location, 
        lat, 
        lng, 
        storageCapacity,
        tenantId, 
        companyId,
        isActive 
    });

    let managerInfo: { id: string; name: string; email?: string } | null = null;

    if (managerName && managerEmail) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(managerPassword, salt);

        const manager = await User.create({
            name: managerName,
            email: managerEmail,
            password: hashedPassword,
            role: UserRole.WAREHOUSE_OWNER,
            tenantId,
            warehouseId: warehouse._id,
            location: { lat, lng, address: location },
            mustResetPassword: true,
            isActive: true
        });

        await warehouseRepository.update(warehouse._id.toString(), { managerId: manager._id });
        await sendWelcomeEmail(managerEmail, managerPassword, managerName);

        managerInfo = {
            id: manager._id.toString(),
            name: manager.name,
            email: manager.email,
        };
    } else {
        const companyAdmin = await User.findOne({ tenantId, role: UserRole.COMPANY_ADMIN }).select('_id name email');
        if (!companyAdmin) {
            throw new Error('Company admin not found to assign as manager.');
        }
        await warehouseRepository.update(warehouse._id.toString(), { managerId: companyAdmin._id });
        managerInfo = {
            id: companyAdmin._id.toString(),
            name: companyAdmin.name,
            email: companyAdmin.email,
        };
    }

    return {
        warehouse,
        manager: managerInfo,
    };
};

export const getWarehouses = async (tenantId: string | undefined, options: any, search = '', filters: any = {}) => {
    let query: any = { ...filters };
    if (tenantId) {
        query.tenantId = tenantId;
    }
    if (search) {
        query.name = { $regex: search, $options: 'i' };
    }
    if (query.isActive === undefined) {
        query.isActive = true;
    }
    const warehouses = await warehouseRepository.find(query, options);
    const total = await warehouseRepository.count(query);
    return { warehouses, total };
};

export const getWarehouseById = async (id: string, tenantId?: string) => {
    const query = tenantId ? { _id: id, tenantId } : { _id: id };
    const warehouse = await warehouseRepository.model
        .findOne(query)
        .populate('managerId', 'name email')
        .populate('companyId', 'name');
    if (!warehouse) throw new Error('Warehouse not found');
    return warehouse;
};

export const updateWarehouse = async (
    id: string,
    data: any,
    tenantId: string,
    companyId: string,
    isSuperAdmin: boolean
) => {
    const query = isSuperAdmin ? { _id: id } : { _id: id, tenantId };
    const warehouse = await warehouseRepository.findOne(query);
    if (!warehouse) throw new Error('Warehouse not found');
    const effectiveCompanyId = companyId || warehouse.companyId?.toString() || tenantId;
    const effectiveLocation = data.location || warehouse.location;

    await ensureCompanyLocationMatch(effectiveLocation, effectiveCompanyId);

    const updateData = {
        ...data,
        companyId: effectiveCompanyId,
        tenantId: isSuperAdmin ? effectiveCompanyId : tenantId,
    };
    return await warehouseRepository.update(id, updateData);
};

export const deleteWarehouse = async (id: string, tenantId: string, isSuperAdmin: boolean = false) => {
    const query = isSuperAdmin ? { _id: id } : { _id: id, tenantId };
    const warehouse = await warehouseRepository.findOne(query);
    if (!warehouse) throw new Error('Warehouse not found');
    return await warehouseRepository.update(id, { isActive: false });
};
