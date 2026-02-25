import express from 'express';
import * as dailyLogController from '../controllers/dailyLogController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authMiddleware);

router.post('/log', dailyLogController.logDaily);

router.get('/date/:date', dailyLogController.getDailyLog);

router.get('/range', dailyLogController.getLogsInRange);

router.get('/recent', dailyLogController.getRecentLogs);

router.get('/streak', dailyLogController.getStreak);

router.get('/stats', dailyLogController.getDailyStats);

router.get('/adherence/:weekNumber', dailyLogController.getWeeklyAdherence);

export default router;
