import { Router } from 'express';
import * as workerController from '../controllers/workerController';
import { auth } from '../middlewares/auth';
import { authorize } from '../middlewares/role';
import { UserRole } from '../models/User';
import { tenantIsolation } from '../middlewares/tenant';

const router = Router();

// Company Admin and Super Admin can manage workers (createWorker/getAllWorkers etc handled within controller for permissions)
router.use(auth, authorize([UserRole.COMPANY_ADMIN, UserRole.SUPER_ADMIN]), tenantIsolation);

router.post('/', workerController.createWorker);
router.get('/', workerController.getAllWorkers);
router.get('/:id', workerController.getWorkerById);
router.put('/:id', workerController.updateWorker);
router.delete('/:id', workerController.deleteWorker);

export default router;
