import { Router } from 'express';
import {
  getProjects,
  createProject,
  updateProject,
  submitProject,
  deleteProject
} from '../controllers/projectController';
import { protect, restrictTo } from '../middlewares/auth';

const router = Router();

router.use(protect);

router.get('/', getProjects);
router.post('/', restrictTo('student'), createProject);
router.patch('/:id', restrictTo('student'), updateProject);
router.post('/:id/submit', restrictTo('student'), submitProject);
router.delete('/:id', restrictTo('student'), deleteProject);

export default router;
