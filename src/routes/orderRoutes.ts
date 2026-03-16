import express from 'express';
import * as orderController from '../controllers/orderController';
import { auth } from '../middlewares/auth';

const router = express.Router();

router.use(auth);

router.get('/dashboard/stats', orderController.getDashboardStats);
router.post('/', orderController.createOrder);
router.post('/start-trip', orderController.startTrip);
router.get('/', orderController.getOrders);
router.get('/:id', orderController.getOrderById);
router.put('/:id', orderController.updateOrder);
router.patch('/:id/assign', orderController.assignOrder);
router.patch('/:id/deliver', orderController.deliverOrder);
router.patch('/:id/confirm', orderController.confirmDelivery);
router.delete('/:id', orderController.deleteOrder);

export default router;
