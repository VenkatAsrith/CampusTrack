import { Router } from 'express';
import {
  verifyRecord,
  getStudents,
  getStudentProfile,
  getDashboardStats,
  getAnalytics,
  getAuditLogs,
  getYearStats,
  getAcademicHierarchy,
  promoteSemester,
  changeStudentPassword,
  getBatchesSummary,
  graduateBatch,
} from '../controllers/adminController';
import { protect, restrictTo } from '../middlewares/auth';

const router = Router();

// Secure all admin routes
router.use(protect);
router.use(restrictTo('admin'));

router.get('/students', getStudents);
router.get('/students/:id', getStudentProfile);
router.post('/students/:id/change-password', changeStudentPassword);
router.post('/verify/:module/:id', verifyRecord);
router.get('/dashboard-stats', getDashboardStats);
router.get('/analytics', getAnalytics);
router.get('/audit-logs', getAuditLogs);
router.get('/year-stats', getYearStats);
router.get('/hierarchy', getAcademicHierarchy);
router.post('/promote-semester', promoteSemester);
router.get('/batches', getBatchesSummary);
router.post('/batches/:batch/graduate', graduateBatch);

export default router;
