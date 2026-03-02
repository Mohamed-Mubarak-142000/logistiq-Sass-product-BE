import express from 'express';
import * as warehouseController from '../controllers/warehouseController';
import { auth } from '../middlewares/auth';

const router = express.Router();

router.use(auth);

router.post('/', warehouseController.createWarehouse);
router.get('/', warehouseController.getWarehouses);
router.get('/:id', warehouseController.getWarehouseById);
router.put('/:id', warehouseController.updateWarehouse);
router.delete('/:id', warehouseController.deleteWarehouse);

export default router;
