import express from 'express';
import { auth } from '../middlewares/auth';
import { tenantIsolation } from '../middlewares/tenant';
import { authorize } from '../middlewares/role';
import { UserRole } from '../models/User';
import * as categoryController from '../controllers/categoryController';
import { upload } from '../config/cloudinary';

const router = express.Router();

router.use(auth, tenantIsolation);

router.get('/', categoryController.getCategories);
router.post('/', authorize([UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN]), upload.single('image'), categoryController.createCategory);
router.put('/:id', authorize([UserRole.SUPER_ADMIN, UserRole.COMPANY_ADMIN]), upload.single('image'), categoryController.updateCategory);

export default router;
