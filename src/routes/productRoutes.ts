import { Router } from 'express';
import * as productController from '../controllers/productController';
import { auth } from '../middlewares/auth';
import { tenantIsolation } from '../middlewares/tenant';
import { authorize } from '../middlewares/role';
import { UserRole } from '../models/User';
import { upload } from '../config/cloudinary';

const router = Router();

router.use(auth);
router.use(tenantIsolation);

router.post(
    '/',
    authorize([UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN, UserRole.WAREHOUSE_MANAGER]),
    upload.single('image'),
    productController.createProduct
);
router.get('/', productController.getProducts);
router.get('/:id', productController.getProductById);
router.put(
    '/:id',
    authorize([UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN, UserRole.WAREHOUSE_MANAGER]),
    upload.single('image'),
    productController.updateProduct
);
router.delete(
    '/:id',
    authorize([UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN]),
    productController.deleteProduct
);

export default router;
