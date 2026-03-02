import { Router } from 'express';
import * as authController from '../controllers/authController';
import { auth } from '../middlewares/auth';

const router = Router();

router.post('/register', authController.registerTenant);
router.post('/login', authController.login);
router.post('/reset-password', auth, authController.resetPassword);

export default router;
