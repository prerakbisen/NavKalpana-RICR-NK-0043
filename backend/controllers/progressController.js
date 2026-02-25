import * as progressService from '../services/progressService.js';
import * as measurementService from '../services/measurementService.js';

export const logProgress = async (req, res) => {
  try {
    const { week_number, weight_kg, daily_logs } = req.body;
    
    if (!week_number || !daily_logs) {
      return res.status(400).json({ error: 'Week number and daily logs are required' });
    }
    
    const progress = await progressService.logProgress(req.user_id, { weight_kg, daily_logs }, week_number);
    res.status(201).json(progress);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const getProgressByWeek = async (req, res) => {
  try {
    const { week_number } = req.params;
    const progress = await progressService.getProgressByWeek(req.user_id, parseInt(week_number));
    res.status(200).json(progress);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
};

export const getAllProgress = async (req, res) => {
  try {
    const progress = await progressService.getAllProgress(req.user_id);
    res.status(200).json(progress);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const getRecentProgress = async (req, res) => {
  try {
    const { weeks = 12 } = req.query;
    const progress = await progressService.getRecentProgress(req.user_id, parseInt(weeks));
    res.status(200).json(progress);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const getHabitScores = async (req, res) => {
  try {
    const scores = await progressService.getHabitScores(req.user_id);
    res.status(200).json(scores);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const getCurrentHabitScore = async (req, res) => {
  try {
    const score = await progressService.getCurrentHabitScore(req.user_id);
    res.status(200).json(score);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
};

export const logEnergy = async (req, res) => {
  try {
    const { energy_level, notes } = req.body;
    
    if (!energy_level) {
      return res.status(400).json({ error: 'Energy level is required' });
    }
    
    const log = await progressService.logEnergy(req.user_id, energy_level, notes);
    res.status(201).json(log);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const getRecentEnergyLogs = async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const logs = await progressService.getRecentEnergyLogs(req.user_id, parseInt(days));
    res.status(200).json(logs);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const logMeasurements = async (req, res) => {
  try {
    const { measurements, notes } = req.body;
    
    if (!measurements) {
      return res.status(400).json({ error: 'Measurements are required' });
    }
    
    const log = await measurementService.logBodyMeasurements(req.user_id, measurements, notes);
    res.status(201).json(log);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const getLatestMeasurements = async (req, res) => {
  try {
    const measurements = await measurementService.getLatestMeasurements(req.user_id);
    res.status(200).json(measurements);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
};

export const getAllMeasurements = async (req, res) => {
  try {
    const measurements = await measurementService.getAllMeasurements(req.user_id);
    res.status(200).json(measurements);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const checkDropoffRisk = async (req, res) => {
  try {
    const risk = await progressService.checkDropoffRisk(req.user_id);
    res.status(200).json(risk);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const forecastGoal = async (req, res) => {
  try {
    const forecast = await progressService.forecastGoalAchievement(req.user_id);
    res.status(200).json(forecast);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get goal progress with real-time data
export const getGoalProgress = async (req, res) => {
  try {
    const goalProgress = await progressService.getGoalProgress(req.user_id);
    res.status(200).json(goalProgress);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get energy status
export const getEnergyStatus = async (req, res) => {
  try {
    const energyStatus = await progressService.getEnergyStatus(req.user_id);
    res.status(200).json(energyStatus);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get goal forecast with estimated completion date
export const getGoalForecast = async (req, res) => {
  try {
    const forecast = await progressService.getGoalForecast(req.user_id);
    res.status(200).json(forecast);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

// Get measurement trends
export const getMeasurementTrends = async (req, res) => {
  try {
    const trends = await progressService.getMeasurementTrends(req.user_id);
    res.status(200).json(trends);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
