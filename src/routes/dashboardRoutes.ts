import express from 'express';
import * as dashboardController from '../controllers/dashboardController';
import { auth } from '../middlewares/auth';
import { authorize } from '../middlewares/role';
import { UserRole } from '../models/User';

const router = express.Router();

router.use(auth);
router.use(authorize([UserRole.SUPER_ADMIN]));

router.get('/super-admin/summary', dashboardController.getSuperAdminSummary);
router.get('/super-admin/charts', dashboardController.getSuperAdminCharts);

export default router;
