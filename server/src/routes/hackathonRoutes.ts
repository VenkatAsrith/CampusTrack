import { Router } from 'express';
import {
  getHackathons,
  createHackathon,
  updateHackathon,
  submitHackathon,
  deleteHackathon
} from '../controllers/hackathonController';
import { protect, restrictTo } from '../middlewares/auth';

const router = Router();

router.use(protect);

router.get('/', getHackathons);
router.post('/', restrictTo('student'), createHackathon);
router.patch('/:id', restrictTo('student'), updateHackathon);
router.post('/:id/submit', restrictTo('student'), submitHackathon);
router.delete('/:id', restrictTo('student'), deleteHackathon);

export default router;
