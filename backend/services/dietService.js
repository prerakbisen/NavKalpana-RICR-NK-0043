import DietPlan from '../models/DietPlan.js';
import ProgressLog from '../models/ProgressLog.js';
import { generateDietPlan, getMealSuggestions } from '../utils/dietGenerator.js';
import { generateAIDietPlan } from './groqService.js';
import Profile from '../models/Profile.js';
import { calculateMacros } from '../utils/calculationUtils.js';

export const generateDietPlanForUser = async (user_id, week_number = 1) => {
  const profile = await Profile.findOne({ user_id });
  
  if (!profile) {
    throw new Error('Profile not found. Please complete profile setup first.');
  }
  
  const macros = calculateMacros(profile.daily_calorie_target, profile.goal);
  
  let meals, weekSummary, hydrationGoal, supplementSuggestions, mealPrepTips, adjustmentNotes;
  
  if (process.env.GROQ_API_KEY && 
      process.env.GROQ_API_KEY !== 'your_groq_api_key_here' && 
      process.env.GROQ_API_KEY.trim() !== '') {
    try {
      console.log(`Generating Groq AI-powered diet plan for user ${user_id}, week ${week_number}...`);
      const aiPlan = await generateAIDietPlan(user_id, week_number);
      meals = aiPlan.daily_meals;
      weekSummary = aiPlan.week_summary;
      hydrationGoal = aiPlan.hydration_goal;
      supplementSuggestions = aiPlan.supplement_suggestions;
      mealPrepTips = aiPlan.meal_prep_tips;
      adjustmentNotes = aiPlan.adjustment_notes;
    } catch (error) {
      console.error('Groq AI generation failed, falling back to template:', error.message);
      meals = generateDietPlan(profile.daily_calorie_target, profile.goal, macros, profile.allergies, profile.dietary_preferences);
      weekSummary = `Week ${week_number} - ${profile.goal} Nutrition Plan`;
      if (profile.allergies || profile.dietary_preferences) {
        weekSummary += ` (${profile.dietary_preferences || 'Custom'} - Allergen-free)`;
      }
    }
  } else {
    console.log('Using template-based diet generation (Groq AI not configured)');
    meals = generateDietPlan(profile.daily_calorie_target, profile.goal, macros, profile.allergies, profile.dietary_preferences);
    weekSummary = `Week ${week_number} - ${profile.goal} Nutrition Plan`;
    if (profile.allergies || profile.dietary_preferences) {
      weekSummary += ` (${profile.dietary_preferences || 'Custom'} - Allergen-free)`;
    }
  }
  
  const dietPlan = new DietPlan({
    user_id,
    week_number,
    daily_calorie_target: profile.daily_calorie_target,
    goal: profile.goal,
    ...macros,
    meals,
    week_summary: weekSummary,
    hydration_goal: hydrationGoal,
    supplement_suggestions: supplementSuggestions,
    meal_prep_tips: mealPrepTips,
    adjustment_notes: adjustmentNotes
  });
  
  await dietPlan.save();
  return dietPlan;
};

export const getLatestDietPlan = async (user_id) => {
  const dietPlan = await DietPlan.findOne({ user_id }).sort({ created_at: -1 });
  
  if (!dietPlan) {
    return await generateDietPlanForUser(user_id, 1);
  }
  
  return dietPlan;
};

export const getDietPlanByWeek = async (user_id, week_number) => {
  const dietPlan = await DietPlan.findOne({ user_id, week_number });
  
  if (!dietPlan) {
    throw new Error('Diet plan not found for this week');
  }
  
  return dietPlan;
};

export const getAllDietPlans = async (user_id) => {
  return await DietPlan.find({ user_id }).sort({ week_number: 1 });
};

export const getMealOptions = async (goal, mealType) => {
  return getMealSuggestions(goal, mealType);
};
