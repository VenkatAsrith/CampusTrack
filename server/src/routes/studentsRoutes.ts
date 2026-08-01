import { Router } from 'express';
import { getMyProfile, updateMyProfile, getDashboardSummary } from '../controllers/studentsController';
import { protect, restrictTo } from '../middlewares/auth';

const router = Router();

// Protect all routes under students profile
router.use(protect);
router.use(restrictTo('student'));

router.get('/profile', getMyProfile);
router.put('/profile', updateMyProfile);
router.get('/dashboard-summary', getDashboardSummary);

export default router;
