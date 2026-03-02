import express from 'express';
import * as orderController from '../controllers/orderController';
import { auth } from '../middlewares/auth';

const router = express.Router();

router.use(auth);

router.get('/dashboard/stats', orderController.getDashboardStats);
router.post('/', orderController.createOrder);
router.get('/', orderController.getOrders);
router.get('/:id', orderController.getOrderById);
router.put('/:id', orderController.updateOrder);
router.delete('/:id', orderController.deleteOrder);

export default router;
