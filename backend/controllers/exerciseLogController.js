import * as exerciseLogService from '../services/exerciseLogService.js';


export const logExercise = async (req, res) => {
  try {
    const user_id = req.user_id;
    const exerciseLog = await exerciseLogService.logExercise(user_id, req.body);
    res.json(exerciseLog);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


export const getExerciseHistory = async (req, res) => {
  try {
    const user_id = req.user_id;
    const { exercise_name } = req.params;
    const limit = parseInt(req.query.limit) || 10;
    
    const history = await exerciseLogService.getExerciseHistory(user_id, exercise_name, limit);
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


export const getWeekExercises = async (req, res) => {
  try {
    const user_id = req.user_id;
    const { week_number } = req.params;
    
    const exercises = await exerciseLogService.getWeekExercises(user_id, parseInt(week_number));
    res.json(exercises);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


export const getProgressiveOverload = async (req, res) => {
  try {
    const user_id = req.user_id;
    const { exercise_name } = req.params;
    
    const recommendation = await exerciseLogService.calculateProgressiveOverload(user_id, exercise_name);
    res.json(recommendation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};


export const getWeeklyAdherence = async (req, res) => {
  try {
    const user_id = req.user_id;
    const { week_number } = req.params;
    
    const adherence = await exerciseLogService.getWeeklyAdherence(user_id, parseInt(week_number));
    res.json({ adherence });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
