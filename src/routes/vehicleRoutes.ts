import express from 'express';
import * as vehicleController from '../controllers/vehicleController';
import { auth } from '../middlewares/auth';

const router = express.Router();

router.use(auth);

router.post('/', vehicleController.createVehicle);
router.get('/', vehicleController.getVehicles);
router.get('/:id', vehicleController.getVehicleById);
router.put('/:id', vehicleController.updateVehicle);
router.delete('/:id', vehicleController.deleteVehicle);

export default router;
