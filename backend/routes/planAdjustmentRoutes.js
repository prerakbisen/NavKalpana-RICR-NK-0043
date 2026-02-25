import express from 'express';
import { getWeeklyEvaluation, triggerAutoAdjustment } from '../controllers/planAdjustmentController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// Get weekly progress evaluation
router.get('/evaluate', authMiddleware, getWeeklyEvaluation);

// Trigger automatic plan adjustments
router.post('/auto-adjust', authMiddleware, triggerAutoAdjustment);

export default router;
