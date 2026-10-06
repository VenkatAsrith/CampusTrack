import { Router } from 'express';
import { login, registerStudent, getMe, checkAndParseRoll } from '../controllers/authController';
import { protect } from '../middlewares/auth';
import { loginLimiter } from '../middlewares/rateLimiter';

const router = Router();

router.get('/check-roll/:rollNumber', checkAndParseRoll);
router.post('/register', registerStudent);
router.post('/login', loginLimiter, login);
router.get('/me', protect, getMe);

export default router;
