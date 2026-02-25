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

export default router;
