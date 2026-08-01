import { Router } from 'express';
import {
  getAchievements,
  createAchievement,
  updateAchievement,
  submitAchievement,
  deleteAchievement
} from '../controllers/achievementController';
import { protect, restrictTo } from '../middlewares/auth';

const router = Router();

router.use(protect);

router.get('/', getAchievements);
router.post('/', restrictTo('student'), createAchievement);
router.patch('/:id', restrictTo('student'), updateAchievement);
router.post('/:id/submit', restrictTo('student'), submitAchievement);
router.delete('/:id', restrictTo('student'), deleteAchievement);

export default router;
