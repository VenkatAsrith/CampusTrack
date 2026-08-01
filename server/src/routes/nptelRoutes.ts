import { Router } from 'express';
import {
  getNPTELRecords,
  createNPTELRecord,
  updateNPTELRecord,
  submitNPTELRecord,
  deleteNPTELRecord
} from '../controllers/nptelController';
import { protect, restrictTo } from '../middlewares/auth';

const router = Router();

router.use(protect);

router.get('/', getNPTELRecords);
router.post('/', restrictTo('student'), createNPTELRecord);
router.patch('/:id', restrictTo('student'), updateNPTELRecord);
router.post('/:id/submit', restrictTo('student'), submitNPTELRecord);
router.delete('/:id', restrictTo('student'), deleteNPTELRecord);

export default router;
