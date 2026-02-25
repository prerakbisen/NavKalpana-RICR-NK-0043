import express from 'express';
import {
  getPremiumPreferences,
  updatePremiumPreferences,
  calculatePremiumMacros,
  swapMeal,
  getMealSwapHistory,
  rateMealSwap,
  analyzeMealAdaptations,
  getPremiumCoachingResponse,
  getRecoveryAnalysis,
  checkPremiumStatus,
  activatePremium,
  deactivatePremium
} from '../controllers/premiumCoachingController.js';
import authMiddleware from '../middleware/authMiddleware.js';

const router = express.Router();

// All routes require authentication
router.use(authMiddleware);

// Premium status
router.get('/status', checkPremiumStatus);
router.post('/activate', activatePremium); // For testing/admin
router.post('/deactivate', deactivatePremium); // For testing/admin

// Preferences
router.get('/preferences', getPremiumPreferences);
router.put('/preferences', updatePremiumPreferences);

// Macro customization
router.get('/macros/calculate', calculatePremiumMacros);

// Meal swap engine
router.post('/meals/swap', swapMeal);
router.get('/meals/swap-history', getMealSwapHistory);
router.post('/meals/rate-swap', rateMealSwap);

// Meal adaptations
router.get('/meals/analyze-adaptations', analyzeMealAdaptations);

// AI Coaching
router.post('/coaching/ask', getPremiumCoachingResponse);

// Recovery insights
router.get('/recovery/analyze', getRecoveryAnalysis);

export default router;
