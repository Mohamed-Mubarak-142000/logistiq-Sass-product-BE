import { Router } from 'express';
import * as productController from '../controllers/productController';
import { auth } from '../middlewares/auth';
import { tenantIsolation } from '../middlewares/tenant';
import { authorize } from '../middlewares/role';
import { UserRole } from '../models/User';

const router = Router();

router.use(auth);
router.use(tenantIsolation);

router.post(
    '/',
    authorize([UserRole.COMPANY_ADMIN, UserRole.WAREHOUSE_MANAGER]),
    productController.createProduct
);
router.get('/', productController.getProducts);
router.get('/:id', productController.getProductById);
router.put(
    '/:id',
    authorize([UserRole.COMPANY_ADMIN, UserRole.WAREHOUSE_MANAGER]),
    productController.updateProduct
);
router.delete(
    '/:id',
    authorize([UserRole.COMPANY_ADMIN]),
    productController.deleteProduct
);

export default router;
