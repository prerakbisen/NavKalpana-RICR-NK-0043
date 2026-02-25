import { checkRecoveryNeeded, getWorkoutAdjustment } from '../services/recoveryService.js';

export const getRecoveryStatus = async (req, res) => {
  try {
    const userId = req.user_id;
    const recoveryStatus = await checkRecoveryNeeded(userId);
    
    res.json({
      success: true,
      data: recoveryStatus
    });
  } catch (error) {
    console.error('Error getting recovery status:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get recovery status'
    });
  }
};

export const getWorkoutRecommendation = async (req, res) => {
  try {
    const { energy_level } = req.query;
    
    if (!energy_level) {
      return res.status(400).json({
        success: false,
        error: 'Energy level is required'
      });
    }
    
    const adjustment = getWorkoutAdjustment(energy_level);
    
    res.json({
      success: true,
      data: adjustment
    });
  } catch (error) {
    console.error('Error getting workout recommendation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get workout recommendation'
    });
  }
};

export default {
  getRecoveryStatus,
  getWorkoutRecommendation
};
