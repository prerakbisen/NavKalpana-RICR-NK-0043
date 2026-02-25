import * as dailyLogService from '../services/dailyLogService.js';


export const logDaily = async (req, res) => {
  try {
    const user_id = req.user_id;
    const { date, ...logData } = req.body;
    
    const dailyLog = await dailyLogService.createOrUpdateDailyLog(
      user_id,
      date || new Date(),
      logData
    );
    
    res.json(dailyLog);
  } catch (error) {
    console.error('Error logging daily activity:', error);
    res.status(500).json({ error: error.message });
  }
};


export const getDailyLog = async (req, res) => {
  try {
    const user_id = req.user_id;
    const { date } = req.params;
    
    const dailyLog = await dailyLogService.getDailyLog(user_id, date);
    
    if (!dailyLog) {
      return res.json({ message: 'No log found for this date' });
    }
    
    res.json(dailyLog);
  } catch (error) {
    console.error('Error fetching daily log:', error);
    res.status(500).json({ error: error.message });
  }
};


export const getLogsInRange = async (req, res) => {
  try {
    const user_id = req.user_id;
    const { startDate, endDate } = req.query;
    
    const logs = await dailyLogService.getLogsInRange(user_id, startDate, endDate);
    
    res.json(logs);
  } catch (error) {
    console.error('Error fetching logs:', error);
    res.status(500).json({ error: error.message });
  }
};


export const getRecentLogs = async (req, res) => {
  try {
    const user_id = req.user_id;
    const days = parseInt(req.query.days) || 30;
    
    const logs = await dailyLogService.getRecentLogs(user_id, days);
    
    res.json(logs);
  } catch (error) {
    console.error('Error fetching recent logs:', error);
    res.status(500).json({ error: error.message });
  }
};


export const getStreak = async (req, res) => {
  try {
    const user_id = req.user_id;
    
    const streak = await dailyLogService.calculateStreak(user_id);
    
    res.json({ streak });
  } catch (error) {
    console.error('Error calculating streak:', error);
    res.status(500).json({ error: error.message });
  }
};

export const getDailyStats = async (req, res) => {
  try {
    const user_id = req.user_id;
    
    const stats = await dailyLogService.getDailyStats(user_id);
    
    res.json(stats);
  } catch (error) {
    console.error('Error fetching daily stats:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get weekly adherence
export const getWeeklyAdherence = async (req, res) => {
  try {
    const user_id = req.user_id;
    const { weekNumber } = req.params;
    
    const adherence = await dailyLogService.calculateWeeklyAdherence(
      user_id,
      parseInt(weekNumber)
    );
    
    res.json(adherence);
  } catch (error) {
    console.error('Error calculating weekly adherence:', error);
    res.status(500).json({ error: error.message });
  }
};
