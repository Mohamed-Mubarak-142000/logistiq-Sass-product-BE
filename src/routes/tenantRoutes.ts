import { Router } from 'express';
import * as tenantController from '../controllers/tenantController';
import { auth } from '../middlewares/auth';
import { authorize } from '../middlewares/role';
import { UserRole } from '../models/User';

const router = Router();

// Only Super Admin can manage tenants
router.use(auth, authorize([UserRole.SUPER_ADMIN]));

router.post('/', tenantController.createTenant);
router.get('/', tenantController.getAllTenants);
router.get('/:id', tenantController.getTenantById);
router.put('/:id', tenantController.updateTenant);
router.delete('/:id', tenantController.deleteTenant);

export default router;
