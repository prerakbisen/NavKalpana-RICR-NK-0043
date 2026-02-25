import { evaluateWeeklyProgress, autoAdjustPlans } from '../services/planAdjustmentService.js';

// Get weekly progress evaluation
export const getWeeklyEvaluation = async (req, res) => {
  try {
    const userId = req.user_id;
    const evaluation = await evaluateWeeklyProgress(userId);
    
    res.json({
      success: true,
      data: evaluation
    });
  } catch (error) {
    console.error('Error getting weekly evaluation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to evaluate weekly progress'
    });
  }
};

// Trigger automatic plan adjustments
export const triggerAutoAdjustment = async (req, res) => {
  try {
    const userId = req.user_id;
    const results = await autoAdjustPlans(userId);
    
    res.json({
      success: true,
      data: results
    });
  } catch (error) {
    console.error('Error triggering auto adjustment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to adjust plans'
    });
  }
};

export default {
  getWeeklyEvaluation,
  triggerAutoAdjustment
};
