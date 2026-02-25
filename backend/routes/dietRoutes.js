import express from 'express';
import * as dietController from '../controllers/dietController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authMiddleware);

router.post('/', dietController.generateDietPlan);
router.get('/latest', dietController.getLatestDiet);
router.get('/week/:week_number', dietController.getDietByWeek);
router.get('/', dietController.getAllDiets);

export default router;
