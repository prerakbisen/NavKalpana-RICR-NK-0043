import express from 'express';
import * as authController from '../controllers/authController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

router.post('/register', authController.register);
router.post('/login', authController.login);

router.get('/profile', authMiddleware, authController.getProfile);

export default router;
