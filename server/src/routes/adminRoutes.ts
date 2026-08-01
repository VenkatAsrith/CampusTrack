import { Router } from 'express';
import {
  verifyRecord,
  getStudents,
  getStudentProfile,
  getDashboardStats,
  getAnalytics,
  getAuditLogs
} from '../controllers/adminController';
import { protect, restrictTo } from '../middlewares/auth';

const router = Router();

// Secure all admin routes
router.use(protect);
router.use(restrictTo('admin'));

router.get('/students', getStudents);
router.get('/students/:id', getStudentProfile);
router.post('/verify/:module/:id', verifyRecord);
router.get('/dashboard-stats', getDashboardStats);
router.get('/analytics', getAnalytics);
router.get('/audit-logs', getAuditLogs);

export default router;
