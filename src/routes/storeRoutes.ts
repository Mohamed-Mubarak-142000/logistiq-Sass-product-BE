import express from 'express';
import * as storeController from '../controllers/storeController';
import { auth } from '../middlewares/auth';

const router = express.Router();

router.use(auth);

router.post('/', storeController.createStore);
router.get('/', storeController.getStores);
router.get('/:id', storeController.getStoreById);
router.put('/:id', storeController.updateStore);
router.delete('/:id', storeController.deleteStore);

export default router;
