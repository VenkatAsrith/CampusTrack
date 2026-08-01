import { Router } from 'express';
import {
  getCertifications,
  createCertification,
  updateCertification,
  submitCertification,
  deleteCertification
} from '../controllers/certificationController';
import { protect, restrictTo } from '../middlewares/auth';

const router = Router();

router.use(protect);

router.get('/', getCertifications);
router.post('/', restrictTo('student'), createCertification);
router.patch('/:id', restrictTo('student'), updateCertification);
router.post('/:id/submit', restrictTo('student'), submitCertification);
router.delete('/:id', restrictTo('student'), deleteCertification);

export default router;
