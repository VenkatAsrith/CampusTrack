import { Router } from 'express';
import {
  getCodingProfiles,
  createCodingProfile,
  updateCodingProfile,
  deleteCodingProfile
} from '../controllers/codingProfileController';
import { protect, restrictTo } from '../middlewares/auth';

const router = Router();

router.use(protect);

// Admin can only view (GET)
// Student can view, create, edit, delete
router.get('/', getCodingProfiles);

router.post('/', restrictTo('student'), createCodingProfile);
router.patch('/:id', restrictTo('student'), updateCodingProfile);
router.delete('/:id', restrictTo('student'), deleteCodingProfile);

export default router;
