import express from 'express';
import { getMonthlyReport, getReportSummary } from '../controllers/reportingController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Get full monthly report
router.get('/monthly', getMonthlyReport);

// Get report summary
router.get('/summary', getReportSummary);

export default router;
