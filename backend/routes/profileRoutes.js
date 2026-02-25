import express from 'express';
import * as profileController from '../controllers/profileController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authMiddleware);

router.post('/', profileController.createProfile);
router.get('/', profileController.getProfile);
router.put('/', profileController.updateProfile);

export default router;
