import express from 'express';
import { getRecoveryStatus, getWorkoutRecommendation } from '../controllers/recoveryController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

router.get('/status', authMiddleware, getRecoveryStatus);

router.get('/recommendation', authMiddleware, getWorkoutRecommendation);

export default router;
