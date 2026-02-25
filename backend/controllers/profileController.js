import * as profileService from '../services/profileService.js';

export const createProfile = async (req, res) => {
  try {
    const { 
      age, 
      gender, 
      height_cm, 
      weight_kg, 
      activity_level, 
      experience_level, 
      goal, 
      target_weight_kg,
      available_days_per_week,
      dietary_preferences,
      allergies,
      injuries_limitations,
      initial_measurements
    } = req.body;
    
    if (!age || !gender || !height_cm || !weight_kg || !activity_level || !experience_level || !goal || !target_weight_kg) {
      return res.status(400).json({ error: 'All required profile fields must be provided' });
    }
    
    // Validate measurements are provided
    if (!initial_measurements) {
      return res.status(400).json({ error: 'Initial body measurements are required' });
    }
    
    const { waist_cm, chest_cm, hips_cm, left_arm_cm, right_arm_cm, left_thigh_cm, right_thigh_cm } = initial_measurements;
    
    if (!waist_cm || !chest_cm || !hips_cm || !left_arm_cm || !right_arm_cm || !left_thigh_cm || !right_thigh_cm) {
      return res.status(400).json({ 
        error: 'All body measurements are required: waist, chest, hips, left arm, right arm, left thigh, right thigh (in cm)' 
      });
    }
    
    // Validate measurements are positive numbers
    const measurements = [waist_cm, chest_cm, hips_cm, left_arm_cm, right_arm_cm, left_thigh_cm, right_thigh_cm];
    if (measurements.some(m => m <= 0)) {
      return res.status(400).json({ error: 'All measurements must be positive numbers' });
    }
    
    const profile = await profileService.createProfile(req.user_id, {
      age,
      gender,
      height_cm,
      weight_kg,
      activity_level,
      experience_level,
      goal,
      target_weight_kg,
      available_days_per_week: available_days_per_week || 4,
      dietary_preferences: dietary_preferences || '',
      allergies: allergies || '',
      injuries_limitations: injuries_limitations || '',
      initial_measurements: {
        waist_cm,
        chest_cm,
        hips_cm,
        left_arm_cm,
        right_arm_cm,
        left_thigh_cm,
        right_thigh_cm,
        measured_at: new Date()
      }
    });
    
    res.status(201).json(profile);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

export const getProfile = async (req, res) => {
  try {
    const profile = await profileService.getProfile(req.user_id);
    res.status(200).json(profile);
  } catch (error) {
    res.status(404).json({ error: error.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const profile = await profileService.updateProfile(req.user_id, req.body);
    res.status(200).json(profile);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
