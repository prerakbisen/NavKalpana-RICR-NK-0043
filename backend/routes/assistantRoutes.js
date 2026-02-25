import express from 'express';
import * as assistantController from '../controllers/assistantController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

router.use(authMiddleware);

router.post('/ask', assistantController.askAssistant);

export default router;
