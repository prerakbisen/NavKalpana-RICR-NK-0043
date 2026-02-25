import { getApiKeyStats } from '../services/groqService.js';

/**
 * Get API Key Usage Statistics
 * Shows which keys are configured and their usage stats
 */
export const getStats = async (req, res) => {
  try {
    const stats = getApiKeyStats();
    
    res.json({
      success: true,
      data: stats,
      message: 'API key statistics retrieved successfully'
    });
  } catch (error) {
    console.error('Error getting API stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve API statistics',
      error: error.message
    });
  }
};

export default {
  getStats
};
