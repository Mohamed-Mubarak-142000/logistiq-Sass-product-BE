import { Router } from 'express';
import { auth } from '../middlewares/auth';
import { authorize } from '../middlewares/role';
import { UserRole } from '../models/User';
import {
	getCompanies,
	getCompanyStores,
	getCompanyCampaigns,
	createCompanyCampaign,
	updateCompanyCampaign,
	deleteCompanyCampaign,
} from '../controllers/companyController';

const router = Router();

router.use(auth);

router.get('/', authorize([UserRole.SUPER_ADMIN]), getCompanies);
router.get('/:companyId/stores', getCompanyStores);

router.get('/:companyId/campaigns', authorize([UserRole.COMPANY_ADMIN, UserRole.SUPER_ADMIN]), getCompanyCampaigns);
router.post('/:companyId/campaigns', authorize([UserRole.COMPANY_ADMIN, UserRole.SUPER_ADMIN]), createCompanyCampaign);
router.put('/:companyId/campaigns/:campaignId', authorize([UserRole.COMPANY_ADMIN, UserRole.SUPER_ADMIN]), updateCompanyCampaign);
router.delete('/:companyId/campaigns/:campaignId', authorize([UserRole.COMPANY_ADMIN, UserRole.SUPER_ADMIN]), deleteCompanyCampaign);

export default router;
