import express from 'express';
import { getStats } from '../controllers/apiStatsController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// Get API key usage statistics (protected route)
router.get('/stats', authMiddleware, getStats);

export default router;
