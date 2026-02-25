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
      injuries_limitations
    } = req.body;
    
    if (!age || !gender || !height_cm || !weight_kg || !activity_level || !experience_level || !goal || !target_weight_kg) {
      return res.status(400).json({ error: 'All required profile fields must be provided' });
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
      injuries_limitations: injuries_limitations || ''
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
