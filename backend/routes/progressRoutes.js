import express from 'express';
import * as progressController from '../controllers/progressController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authMiddleware);

router.post('/', progressController.logProgress);
router.get('/week/:week_number', progressController.getProgressByWeek);
router.get('/recent', progressController.getRecentProgress);
router.get('/', progressController.getAllProgress);

router.get('/habits/current', progressController.getCurrentHabitScore);
router.get('/habits', progressController.getHabitScores);

router.post('/energy', progressController.logEnergy);
router.get('/energy/recent', progressController.getRecentEnergyLogs);

router.post('/measurements', progressController.logMeasurements);
router.get('/measurements/latest', progressController.getLatestMeasurements);
router.get('/measurements', progressController.getAllMeasurements);

router.get('/dropoff/check', progressController.checkDropoffRisk);

router.get('/forecast/goal', progressController.forecastGoal);

// Goal progress
router.get('/goal/progress', progressController.getGoalProgress);

// Energy status
router.get('/energy/status', progressController.getEnergyStatus);

// Goal forecast with estimated date
router.get('/goal/forecast', progressController.getGoalForecast);

// Measurement trends
router.get('/measurements/trends', progressController.getMeasurementTrends);

export default router;
