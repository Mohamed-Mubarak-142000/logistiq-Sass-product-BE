import express from 'express';
import * as dashboardController from '../controllers/dashboardController';
import { auth } from '../middlewares/auth';
import { authorize } from '../middlewares/role';
import { UserRole } from '../models/User';

const router = express.Router();

router.use(auth);

// Super Admin Endpoints
router.get('/super-admin/summary', authorize([UserRole.SUPER_ADMIN]), dashboardController.getSuperAdminSummary);
router.get('/super-admin/charts', authorize([UserRole.SUPER_ADMIN]), dashboardController.getSuperAdminCharts);
router.get('/super-admin/top-companies', authorize([UserRole.SUPER_ADMIN]), dashboardController.getTopCompanies);

// Tenant Admin Endpoints
router.get('/admin/stats', authorize([UserRole.COMPANY_ADMIN]), dashboardController.getTenantDashboardStats);
router.get('/admin/top-warehouses', authorize([UserRole.COMPANY_ADMIN]), dashboardController.getTopWarehouses);

// Warehouse Staff Endpoints
router.get('/warehouse/stats', authorize([UserRole.COMPANY_ADMIN]), dashboardController.getWarehouseDashboardStats);

export default router;
