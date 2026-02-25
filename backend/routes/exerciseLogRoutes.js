import express from 'express';
import * as exerciseLogController from '../controllers/exerciseLogController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authMiddleware);

router.post('/log', exerciseLogController.logExercise);

router.get('/history/:exercise_name', exerciseLogController.getExerciseHistory);

router.get('/week/:week_number', exerciseLogController.getWeekExercises);

router.get('/overload/:exercise_name', exerciseLogController.getProgressiveOverload);

router.get('/adherence/:week_number', exerciseLogController.getWeeklyAdherence);

export default router;
