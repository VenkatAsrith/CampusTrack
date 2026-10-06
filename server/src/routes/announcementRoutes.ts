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
  applyToPlacementDrive,
  getMyApplication,
  getDriveApplications,
  updateApplicationStatus,
  bulkUpdateApplicationStatus,
  exportDriveApplicationsExcel,
} from '../controllers/announcementsController';
import { protect, restrictTo } from '../middlewares/auth';

const router = Router();

// Public / Authenticated Announcement routes
router.get('/', getPublicAnnouncements);
router.get('/:id', getAnnouncementById);

// Student Placement Application routes
router.post('/:id/apply', protect, applyToPlacementDrive);
router.get('/:id/my-application', protect, getMyApplication);

// TPO/Admin Announcement management routes
router.get('/admin/all', protect, restrictTo('admin'), getTpoAnnouncements);
router.post('/', protect, restrictTo('admin'), createAnnouncement);
router.put('/:id', protect, restrictTo('admin'), updateAnnouncement);
router.delete('/:id', protect, restrictTo('admin'), deleteAnnouncement);
router.patch('/:id/publish', protect, restrictTo('admin'), togglePublishAnnouncement);
router.patch('/:id/deadline', protect, restrictTo('admin'), updateDeadline);

// TPO/Admin Placement Applications management & Excel export routes
router.get('/:id/applications', protect, restrictTo('admin'), getDriveApplications);
router.patch('/:id/applications/:appId/status', protect, restrictTo('admin'), updateApplicationStatus);
router.post('/:id/applications/bulk-status', protect, restrictTo('admin'), bulkUpdateApplicationStatus);
router.get('/:id/applications/export-excel', protect, restrictTo('admin'), exportDriveApplicationsExcel);

export default router;
