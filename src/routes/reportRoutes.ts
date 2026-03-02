import express from 'express';
import * as reportController from '@/controllers/reportController';
import { auth } from '../middlewares/auth';

const router = express.Router();

router.use(auth);

router.get('/', reportController.getReports);
router.get('/details/:reportType', reportController.getReportDetails);

export default router;
