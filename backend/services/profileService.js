import Profile from '../models/Profile.js';
import { calculateBMI, calculateBMR, getActivityFactor, calculateDailyCalorieTarget } from '../utils/calculationUtils.js';
import * as measurementService from './measurementService.js';

export const createProfile = async (user_id, profileData) => {
  const existingProfile = await Profile.findOne({ user_id });
  if (existingProfile) {
    throw new Error('Profile already exists for this user');
  }
  
  const height_m = profileData.height_cm / 100;
  const bmi = calculateBMI(profileData.weight_kg, profileData.height_cm);
  const bmr = calculateBMR(profileData.weight_kg, profileData.height_cm, profileData.age, profileData.gender);
  const activity_factor = getActivityFactor(profileData.activity_level);
  const daily_calorie_target = calculateDailyCalorieTarget(bmr, activity_factor, profileData.goal, profileData.gender);
  
  const profile = new Profile({
    user_id,
    ...profileData,
    height_m,
    bmi,
    bmr,
    activity_factor,
    daily_calorie_target
  });
  
  await profile.save();
  
  if (profileData.initial_measurements) {
    try {
      await measurementService.saveInitialMeasurements(user_id, profileData.initial_measurements);
    } catch (error) {
      console.error('Failed to save initial measurements:', error);
    }
  }
  
  return profile;
};

export const getProfile = async (user_id) => {
  const profile = await Profile.findOne({ user_id });
  
  if (!profile) {
    throw new Error('Profile not found');
  }
  
  return profile;
};

export const updateProfile = async (user_id, profileData) => {
  const profile = await Profile.findOneAndUpdate(
    { user_id },
    {
      ...profileData,
      height_m: profileData.height_cm / 100,
      bmi: calculateBMI(profileData.weight_kg, profileData.height_cm),
      bmr: calculateBMR(profileData.weight_kg, profileData.height_cm, profileData.age, profileData.gender),
      activity_factor: getActivityFactor(profileData.activity_level),
      daily_calorie_target: calculateDailyCalorieTarget(
        calculateBMR(profileData.weight_kg, profileData.height_cm, profileData.age, profileData.gender),
        getActivityFactor(profileData.activity_level),
        profileData.goal,
        profileData.gender
      ),
      updated_at: new Date()
    },
    { new: true }
  );
  
  if (!profile) {
    throw new Error('Profile not found');
  }
  
  return profile;
};
