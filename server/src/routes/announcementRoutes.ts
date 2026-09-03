import { Router } from 'express';
import {
  getPublicAnnouncements,
  getAnnouncementById,
  getTpoAnnouncements,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
  togglePublishAnnouncement,
  updateDeadline,
} from '../controllers/announcementsController';
import { protect, restrictTo } from '../middlewares/auth';

const router = Router();

// Public routes for all authenticated users (students & staff)
router.get('/', getPublicAnnouncements);
router.get('/:id', getAnnouncementById);

// TPO/Admin management routes
router.get('/admin/all', protect, restrictTo('admin'), getTpoAnnouncements);
router.post('/', protect, restrictTo('admin'), createAnnouncement);
router.put('/:id', protect, restrictTo('admin'), updateAnnouncement);
router.delete('/:id', protect, restrictTo('admin'), deleteAnnouncement);
router.patch('/:id/publish', protect, restrictTo('admin'), togglePublishAnnouncement);
router.patch('/:id/deadline', protect, restrictTo('admin'), updateDeadline);

export default router;
