import express from 'express';
import * as workoutController from '../controllers/workoutController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authMiddleware);

router.post('/', workoutController.generateWorkoutPlan);
router.get('/latest', workoutController.getLatestWorkout);
router.get('/week/:week_number', workoutController.getWorkoutByWeek);
router.get('/', workoutController.getAllWorkouts);

export default router;
