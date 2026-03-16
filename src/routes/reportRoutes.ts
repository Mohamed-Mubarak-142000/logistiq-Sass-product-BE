import express from 'express';
import * as reportController from '../controllers/reportController';
import { auth } from '../middlewares/auth';
import { authorize } from '../middlewares/role';
import { UserRole } from '../models/User';

const router = express.Router();

router.use(auth);

router.get('/', reportController.getReports);
router.get('/details/:reportType', reportController.getReportDetails);
router.get('/activity', authorize([UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN]), reportController.getActivityReport);

export default router;
