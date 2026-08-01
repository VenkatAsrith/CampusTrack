import { Router } from 'express';
import { login, registerStudent, getMe } from '../controllers/authController';
import { protect } from '../middlewares/auth';

const router = Router();

router.post('/register', registerStudent);
router.post('/login', login);
router.get('/me', protect, getMe);

export default router;
