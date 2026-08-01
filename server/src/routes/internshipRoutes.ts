import { Router } from 'express';
import {
  getInternships,
  createInternship,
  updateInternship,
  submitInternship,
  deleteInternship
} from '../controllers/internshipController';
import { protect, restrictTo } from '../middlewares/auth';

const router = Router();

router.use(protect);

router.get('/', getInternships);
router.post('/', restrictTo('student'), createInternship);
router.patch('/:id', restrictTo('student'), updateInternship);
router.post('/:id/submit', restrictTo('student'), submitInternship);
router.delete('/:id', restrictTo('student'), deleteInternship);

export default router;
