import * as measurementService from '../services/measurementService.js';


export const addMeasurement = async (req, res) => {
  try {
    const { measurements, notes } = req.body;
    
    if (!measurements) {
      return res.status(400).json({ error: 'Measurements are required' });
    }

    const measurement = await measurementService.addMeasurement(req.user_id, measurements, notes);
    res.status(201).json(measurement);
  } catch (error) {
    res.status(400).json({ error: error.message });
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


export const getLatestMeasurement = async (req, res) => {
  try {
    const measurement = await measurementService.getLatestMeasurement(req.user_id);
    res.status(200).json(measurement);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};


export const checkReminder = async (req, res) => {
  try {
    const reminder = await measurementService.checkMeasurementReminder(req.user_id);
    res.status(200).json(reminder);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};


export const compareMeasurements = async (req, res) => {
  try {
    const comparison = await measurementService.compareMeasurements(req.user_id);
    res.status(200).json(comparison);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};


export const getMeasurementHistory = async (req, res) => {
  try {
    const history = await measurementService.getMeasurementHistory(req.user_id);
    res.status(200).json(history);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export default {
  addMeasurement,
  getAllMeasurements,
  getLatestMeasurement,
  checkReminder,
  compareMeasurements,
  getMeasurementHistory
};


// Analyze measurements with AI and optionally regenerate plans
export const analyzeMeasurementsWithAI = async (req, res) => {
  try {
    console.log('🤖 AI measurement analysis requested');
    
    const analysis = await measurementService.analyzeMeasurementsWithAI(req.user_id);
    
    // Check if user wants to auto-regenerate plans
    const { auto_regenerate } = req.query;
    
    let regenerationResults = null;
    if (auto_regenerate === 'true' && (analysis.needs_diet_adjustment || analysis.needs_workout_adjustment)) {
      console.log('🔄 Auto-regenerating plans...');
      regenerationResults = await measurementService.regeneratePlansBasedOnMeasurements(req.user_id, analysis);
    }
    
    res.status(200).json({
      ...analysis,
      regeneration_results: regenerationResults
    });
  } catch (error) {
    console.error('❌ AI analysis error:', error);
    res.status(500).json({ error: error.message });
  }
};

// Regenerate plans based on measurement analysis
export const regeneratePlans = async (req, res) => {
  try {
    console.log('🔄 Manual plan regeneration requested');
    
    // First get the analysis
    const analysis = await measurementService.analyzeMeasurementsWithAI(req.user_id);
    
    // Then regenerate plans
    const results = await measurementService.regeneratePlansBasedOnMeasurements(req.user_id, analysis);
    
    res.status(200).json({
      success: true,
      analysis: analysis.analysis,
      regeneration_results: results
    });
  } catch (error) {
    console.error('❌ Plan regeneration error:', error);
    res.status(500).json({ error: error.message });
  }
};
