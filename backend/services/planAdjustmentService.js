import DailyLog from '../models/DailyLog.js';
import Profile from '../models/Profile.js';
import WorkoutPlanV2 from '../models/WorkoutPlanV2.js';
import DietPlan from '../models/DietPlan.js';
import { generateAIPlanAdjustment, isAIAvailable, API_KEY_TYPES } from './groqService.js';

/**
 * Smart Plan Adjustment Engine
 * Automatically evaluates weekly progress and adjusts plans based on triggers
 * Uses AI when available for intelligent recommendations
 */

// Evaluate weekly progress and determine if adjustments are needed
export const evaluateWeeklyProgress = async (userId) => {
  try {
    const profile = await Profile.findOne({ user_id: userId });
    if (!profile) {
      throw new Error('Profile not found');
    }

    // Get last 28 days (4 weeks) of logs
    const twentyEightDaysAgo = new Date();
    twentyEightDaysAgo.setDate(twentyEightDaysAgo.getDate() - 28);
    
    const fourWeeksLogs = await DailyLog.find({
      user_id: userId,
      date: { $gte: twentyEightDaysAgo }
    }).sort({ date: 1 });

    // Get last 7 days for fatigue count
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const weekLogs = await DailyLog.find({
      user_id: userId,
      date: { $gte: sevenDaysAgo }
    }).sort({ date: 1 });

    // Calculate weekly averages
    const weekWeights = getWeeklyAverageWeights(fourWeeksLogs);
    const avgWeeklyChange = calculateAverageWeeklyChange(weekWeights);
    const workoutAdherence = calculateWorkoutAdherence(fourWeeksLogs);
    const dietAdherence = calculateDietAdherence(fourWeeksLogs);
    const habitScore = calculateHabitScore(fourWeeksLogs);
    const fatigueCount = countFatigueFlags(weekLogs);
    const avgCalories = calculateAverageCalories(fourWeeksLogs);

    // Get current plans
    const latestWorkout = await WorkoutPlanV2.findOne({ user_id: userId }).sort({ created_at: -1 });
    const latestDiet = await DietPlan.findOne({ user_id: userId }).sort({ created_at: -1 });

    const setsPerWeek = latestWorkout ? calculateTotalSets(latestWorkout) : 0;
    const splitType = latestWorkout?.workouts?.[0]?.type || 'Full Body';

    // Try AI-powered evaluation first
    if (isAIAvailable(API_KEY_TYPES.PLAN_ADJUSTMENT)) {
      try {
        console.log('🤖 Using AI for plan adjustment evaluation...');
        
        const aiResult = await generateAIPlanAdjustment({
          age: profile.age,
          gender: profile.gender,
          goal: profile.goal,
          currentWeight: weekWeights[3] || profile.current_weight,
          targetWeight: profile.target_weight,
          activityLevel: profile.activity_level,
          experienceLevel: profile.experience_level,
          weekWeights: weekWeights,
          avgWeeklyChange: avgWeeklyChange,
          workoutAdherence: workoutAdherence,
          dietAdherence: dietAdherence,
          habitScore: habitScore,
          fatigueCount: fatigueCount,
          currentCalories: latestDiet?.daily_calories || avgCalories,
          currentMacros: {
            protein: latestDiet ? Math.round((latestDiet.protein_grams * 4 / latestDiet.daily_calories) * 100) : 30,
            carbs: latestDiet ? Math.round((latestDiet.carbs_grams * 4 / latestDiet.daily_calories) * 100) : 40,
            fat: latestDiet ? Math.round((latestDiet.fat_grams * 9 / latestDiet.daily_calories) * 100) : 30
          },
          setsPerWeek: setsPerWeek,
          splitType: splitType
        });

        // Convert AI response to our format
        return {
          needs_adjustment: aiResult.adjustmentRequired,
          ai_powered: true,
          triggers: aiResult.adjustmentRequired ? [{
            type: 'ai_recommendation',
            message: aiResult.reason,
            severity: 'medium'
          }] : [],
          recommendations: aiResult.adjustmentRequired ? [{
            action: 'ai_adjustment',
            description: aiResult.explanation,
            new_calories: aiResult.newCalorieTarget,
            new_macros: aiResult.newMacroSplit,
            workout_changes: aiResult.workoutChanges,
            dashboard_notification: aiResult.dashboardNotification
          }] : [],
          weight_change_kg: avgWeeklyChange,
          adherence_rate: (workoutAdherence + dietAdherence) / 2,
          current_calories: avgCalories,
          week_weights: weekWeights,
          ai_response: aiResult
        };
      } catch (aiError) {
        console.error('❌ AI evaluation failed, falling back to rule-based:', aiError.message);
        // Fall through to rule-based evaluation
      }
    }

    // Rule-based evaluation (fallback or when AI not available)
    console.log('📊 Using rule-based plan adjustment evaluation...');
    
    const adjustments = {
      needs_adjustment: false,
      ai_powered: false,
      triggers: [],
      recommendations: [],
      weight_change_kg: avgWeeklyChange,
      adherence_rate: (workoutAdherence + dietAdherence) / 2,
      current_calories: avgCalories,
      week_weights: weekWeights
    };

    // TRIGGER 1: Weight loss too slow (< 0.3 kg/week)
    if (profile.goal === 'Weight Loss' && weightChange < 0.3 && weightChange >= 0) {
      adjustments.needs_adjustment = true;
      adjustments.triggers.push({
        type: 'slow_weight_loss',
        message: 'Weight loss slower than target (< 0.3 kg/week)',
        current_rate: weightChange.toFixed(2)
      });
      adjustments.recommendations.push({
        action: 'increase_deficit',
        description: 'Slightly increase calorie deficit by 10%',
        new_calories: Math.round(avgCalories * 0.9),
        reason: 'To accelerate weight loss to healthy target of 0.3-0.5 kg/week'
      });
    }

    // TRIGGER 2: Weight loss too fast (> 1 kg/week) - SAFETY
    if (profile.goal === 'Weight Loss' && weightChange > 1.0) {
      adjustments.needs_adjustment = true;
      adjustments.triggers.push({
        type: 'rapid_weight_loss',
        message: '⚠️ Weight loss too rapid (> 1 kg/week) - Safety concern',
        current_rate: weightChange.toFixed(2),
        severity: 'high'
      });
      adjustments.recommendations.push({
        action: 'reduce_deficit',
        description: 'Increase calorie intake by 15% for safety',
        new_calories: Math.round(avgCalories * 1.15),
        reason: 'Rapid weight loss can be unhealthy. Slowing down to 0.5-0.8 kg/week'
      });
    }

    // TRIGGER 3: Muscle gain stagnant
    if (profile.goal === 'Muscle Gain' && Math.abs(weightChange) < 0.2) {
      adjustments.needs_adjustment = true;
      adjustments.triggers.push({
        type: 'stagnant_muscle_gain',
        message: 'Muscle gain progress stagnant (< 0.2 kg/week)',
        current_rate: weightChange.toFixed(2)
      });
      adjustments.recommendations.push({
        action: 'increase_volume',
        description: 'Increase workout volume by 20% (more sets/reps)',
        reason: 'Progressive overload needed to stimulate muscle growth'
      });
      adjustments.recommendations.push({
        action: 'increase_calories',
        description: 'Increase calorie intake by 10% (caloric surplus)',
        new_calories: Math.round(avgCalories * 1.1),
        reason: 'Muscle building requires caloric surplus'
      });
    }

    // TRIGGER 4: Low adherence (< 60%) - Simplify plan
    if (adherenceRate < 60) {
      adjustments.needs_adjustment = true;
      adjustments.triggers.push({
        type: 'low_adherence',
        message: 'Low adherence rate (< 60%)',
        current_rate: adherenceRate.toFixed(1),
        severity: 'medium'
      });
      adjustments.recommendations.push({
        action: 'simplify_plan',
        description: 'Simplify workout and diet plan for better adherence',
        reason: 'Complex plans are harder to follow. Simplification improves consistency'
      });
    }

    // TRIGGER 5: No weight change and low adherence
    if (Math.abs(weightChange) < 0.1 && adherenceRate < 70) {
      adjustments.needs_adjustment = true;
      adjustments.triggers.push({
        type: 'no_progress_low_adherence',
        message: 'No progress with low adherence',
        severity: 'high'
      });
      adjustments.recommendations.push({
        action: 'reset_plan',
        description: 'Reset to beginner-friendly plan with easier goals',
        reason: 'Current plan may be too challenging. Starting fresh with achievable targets'
      });
    }

    return adjustments;
  } catch (error) {
    console.error('Error evaluating weekly progress:', error);
    throw error;
  }
};

// Apply adjustments to workout plan
export const adjustWorkoutPlan = async (userId, adjustmentType) => {
  try {
    const latestPlan = await WorkoutPlanV2.findOne({ user_id: userId }).sort({ created_at: -1 });
    if (!latestPlan) {
      throw new Error('No workout plan found');
    }

    const adjustedPlan = JSON.parse(JSON.stringify(latestPlan.toObject()));
    adjustedPlan.adjusted = true;
    adjustedPlan.adjustment_reason = adjustmentType;

    switch (adjustmentType) {
      case 'increase_volume':
        // Increase sets by 1 for each exercise
        adjustedPlan.workouts = adjustedPlan.workouts.map(day => {
          if (!day.rest_day && day.exercises) {
            day.exercises = day.exercises.map(ex => ({
              ...ex,
              sets: ex.sets + 1,
              guidance: `${ex.guidance} | 📈 VOLUME INCREASED: Added 1 set for progressive overload`
            }));
          }
          return day;
        });
        break;

      case 'simplify_plan':
        // Reduce exercises per day, keep only compound movements
        adjustedPlan.workouts = adjustedPlan.workouts.map(day => {
          if (!day.rest_day && day.exercises && day.exercises.length > 4) {
            day.exercises = day.exercises.slice(0, 4); // Keep only first 4 exercises
            day.notes = 'Simplified plan for better adherence - focus on key compound movements';
          }
          return day;
        });
        break;

      case 'reset_plan':
        // Convert to beginner-friendly 3-day plan
        const beginnerDays = ['Monday', 'Wednesday', 'Friday'];
        adjustedPlan.workouts = adjustedPlan.workouts.map((day, idx) => {
          if (beginnerDays.includes(day.day_name)) {
            return {
              ...day,
              exercises: day.exercises ? day.exercises.slice(0, 3) : [],
              notes: 'Beginner-friendly reset - 3 exercises per session'
            };
          } else {
            return {
              ...day,
              rest_day: true,
              exercises: [],
              notes: 'Rest day for recovery'
            };
          }
        });
        break;
    }

    return adjustedPlan;
  } catch (error) {
    console.error('Error adjusting workout plan:', error);
    throw error;
  }
};

// Apply adjustments to diet plan
export const adjustDietPlan = async (userId, newCalories, adjustmentReason, newMacros = null) => {
  try {
    const profile = await Profile.findOne({ user_id: userId });
    const latestDiet = await DietPlan.findOne({ user_id: userId }).sort({ created_at: -1 });
    
    if (!latestDiet) {
      throw new Error('No diet plan found');
    }

    // Use AI-provided macros or calculate default
    let proteinGrams, carbsGrams, fatGrams;
    
    if (newMacros) {
      proteinGrams = Math.round((newCalories * (newMacros.protein / 100)) / 4);
      carbsGrams = Math.round((newCalories * (newMacros.carbs / 100)) / 4);
      fatGrams = Math.round((newCalories * (newMacros.fat / 100)) / 9);
    } else {
      // Default macro split
      proteinGrams = Math.round((newCalories * 0.30) / 4);
      carbsGrams = Math.round((newCalories * 0.40) / 4);
      fatGrams = Math.round((newCalories * 0.30) / 9);
    }

    const adjustedDiet = {
      ...latestDiet.toObject(),
      daily_calories: newCalories,
      protein_grams: proteinGrams,
      carbs_grams: carbsGrams,
      fat_grams: fatGrams,
      adjusted: true,
      adjustment_reason: adjustmentReason,
      adjustment_date: new Date()
    };

    return adjustedDiet;
  } catch (error) {
    console.error('Error adjusting diet plan:', error);
    throw error;
  }
};

// Adjust workout plan by percentage (for AI recommendations)
export const adjustWorkoutPlanByPercentage = async (userId, volumeChangePercent, description) => {
  try {
    const latestPlan = await WorkoutPlanV2.findOne({ user_id: userId }).sort({ created_at: -1 });
    if (!latestPlan) {
      throw new Error('No workout plan found');
    }

    const adjustedPlan = JSON.parse(JSON.stringify(latestPlan.toObject()));
    adjustedPlan.adjusted = true;
    adjustedPlan.adjustment_reason = 'ai_volume_adjustment';

    const multiplier = 1 + (volumeChangePercent / 100);

    adjustedPlan.workouts = adjustedPlan.workouts.map(day => {
      if (!day.rest_day && day.exercises) {
        day.exercises = day.exercises.map(ex => ({
          ...ex,
          sets: Math.max(1, Math.round(ex.sets * multiplier)),
          guidance: `${ex.guidance} | 🤖 AI ADJUSTED: ${description}`
        }));
      }
      return day;
    });

    return adjustedPlan;
  } catch (error) {
    console.error('Error adjusting workout plan by percentage:', error);
    throw error;
  }
};

// Helper: Get average weight from logs
const getAverageWeight = (logs) => {
  const weightsWithData = logs.filter(log => log.weight_kg && log.weight_kg > 0);
  if (weightsWithData.length === 0) return 0;
  
  const totalWeight = weightsWithData.reduce((sum, log) => sum + log.weight_kg, 0);
  return totalWeight / weightsWithData.length;
};

// Helper: Get weekly average weights for 4 weeks
const getWeeklyAverageWeights = (logs) => {
  const weeks = [[], [], [], []];
  
  logs.forEach(log => {
    const daysSinceStart = Math.floor((new Date() - new Date(log.date)) / (1000 * 60 * 60 * 24));
    const weekIndex = Math.floor(daysSinceStart / 7);
    
    if (weekIndex >= 0 && weekIndex < 4 && log.weight_kg && log.weight_kg > 0) {
      weeks[3 - weekIndex].push(log.weight_kg); // Reverse order (oldest to newest)
    }
  });
  
  return weeks.map(week => {
    if (week.length === 0) return 0;
    return week.reduce((sum, w) => sum + w, 0) / week.length;
  });
};

// Helper: Calculate average weekly change
const calculateAverageWeeklyChange = (weekWeights) => {
  const validWeights = weekWeights.filter(w => w > 0);
  if (validWeights.length < 2) return 0;
  
  const totalChange = validWeights[validWeights.length - 1] - validWeights[0];
  return totalChange / (validWeights.length - 1);
};

// Helper: Calculate workout adherence
const calculateWorkoutAdherence = (logs) => {
  if (logs.length === 0) return 0;
  const completed = logs.filter(log => log.workout_completed).length;
  return Math.round((completed / logs.length) * 100);
};

// Helper: Calculate diet adherence
const calculateDietAdherence = (logs) => {
  if (logs.length === 0) return 0;
  const followed = logs.filter(log => log.diet_followed).length;
  return Math.round((followed / logs.length) * 100);
};

// Helper: Calculate habit score
const calculateHabitScore = (logs) => {
  if (logs.length === 0) return 0;
  const workoutAdherence = calculateWorkoutAdherence(logs);
  const dietAdherence = calculateDietAdherence(logs);
  return Math.round((workoutAdherence + dietAdherence) / 2);
};

// Helper: Count fatigue flags
const countFatigueFlags = (logs) => {
  return logs.filter(log => 
    log.energy_level === 'Slightly Fatigued' || log.energy_level === 'Very Tired'
  ).length;
};

// Helper: Calculate total sets per week
const calculateTotalSets = (workoutPlan) => {
  let totalSets = 0;
  workoutPlan.workouts?.forEach(day => {
    if (!day.rest_day && day.exercises) {
      day.exercises.forEach(ex => {
        totalSets += ex.sets || 0;
      });
    }
  });
  return totalSets;
};

// Helper: Calculate adherence rate
const calculateAdherenceRate = (logs) => {
  if (logs.length === 0) return 0;
  
  const completedDays = logs.filter(log => 
    log.workout_completed && log.diet_followed
  ).length;
  
  return (completedDays / logs.length) * 100;
};

// Helper: Calculate average calories
const calculateAverageCalories = (logs) => {
  if (logs.length === 0) return 0;
  
  const totalCalories = logs.reduce((sum, log) => sum + (log.calories_consumed || 0), 0);
  return Math.round(totalCalories / logs.length);
};

// Auto-adjust plans based on evaluation
export const autoAdjustPlans = async (userId) => {
  try {
    const evaluation = await evaluateWeeklyProgress(userId);
    
    if (!evaluation.needs_adjustment) {
      return {
        adjusted: false,
        message: 'No adjustments needed - progress is on track!',
        evaluation
      };
    }

    const results = {
      adjusted: true,
      evaluation,
      workout_adjusted: false,
      diet_adjusted: false,
      changes: [],
      ai_powered: evaluation.ai_powered || false
    };

    // Handle AI-powered adjustments
    if (evaluation.ai_powered && evaluation.ai_response) {
      const aiRec = evaluation.recommendations[0];
      
      // Apply diet adjustments
      if (aiRec.new_calories) {
        const adjustedDiet = await adjustDietPlan(userId, aiRec.new_calories, 'ai_adjustment', aiRec.new_macros);
        results.diet_adjusted = true;
        results.adjusted_diet = adjustedDiet;
        results.changes.push({
          type: 'diet',
          action: 'ai_adjustment',
          description: aiRec.description,
          old_calories: evaluation.current_calories,
          new_calories: aiRec.new_calories,
          new_macros: aiRec.new_macros
        });
      }

      // Apply workout adjustments
      if (aiRec.workout_changes && aiRec.workout_changes.volumeChangePercent !== 0) {
        const adjustedWorkout = await adjustWorkoutPlanByPercentage(
          userId, 
          aiRec.workout_changes.volumeChangePercent,
          aiRec.workout_changes.newWorkoutStructure
        );
        results.workout_adjusted = true;
        results.adjusted_workout = adjustedWorkout;
        results.changes.push({
          type: 'workout',
          action: 'ai_adjustment',
          description: aiRec.workout_changes.newWorkoutStructure,
          volume_change: aiRec.workout_changes.volumeChangePercent
        });
      }

      results.dashboard_notification = aiRec.dashboard_notification;
      return results;
    }

    // Handle rule-based adjustments (original logic)
    for (const rec of evaluation.recommendations) {
      if (rec.action === 'increase_volume' || rec.action === 'simplify_plan' || rec.action === 'reset_plan') {
        const adjustedWorkout = await adjustWorkoutPlan(userId, rec.action);
        results.workout_adjusted = true;
        results.adjusted_workout = adjustedWorkout;
        results.changes.push({
          type: 'workout',
          action: rec.action,
          description: rec.description
        });
      }

      if (rec.action === 'increase_deficit' || rec.action === 'reduce_deficit' || rec.action === 'increase_calories') {
        const adjustedDiet = await adjustDietPlan(userId, rec.new_calories, rec.action);
        results.diet_adjusted = true;
        results.adjusted_diet = adjustedDiet;
        results.changes.push({
          type: 'diet',
          action: rec.action,
          description: rec.description,
          old_calories: evaluation.current_calories,
          new_calories: rec.new_calories
        });
      }
    }

    return results;
  } catch (error) {
    console.error('Error auto-adjusting plans:', error);
    throw error;
  }
};

export default {
  evaluateWeeklyProgress,
  adjustWorkoutPlan,
  adjustDietPlan,
  autoAdjustPlans
};
