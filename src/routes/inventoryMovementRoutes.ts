import express from 'express';
import * as inventoryMovementController from '../controllers/inventoryMovementController';
import { auth } from '../middlewares/auth';

const router = express.Router();

router.use(auth);

router.post('/', inventoryMovementController.createMovement);
router.get('/', inventoryMovementController.getMovements);

export default router;
