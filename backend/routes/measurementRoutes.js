import express from 'express';
import * as measurementController from '../controllers/measurementController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authMiddleware);

router.post('/', measurementController.addMeasurement);
router.get('/', measurementController.getAllMeasurements);
router.get('/latest', measurementController.getLatestMeasurement);
router.get('/reminder', measurementController.checkReminder);
router.get('/compare', measurementController.compareMeasurements);
router.get('/history', measurementController.getMeasurementHistory);

export default router;
