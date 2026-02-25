import ProgressLog from '../models/ProgressLog.js';
import HabitScore from '../models/HabitScore.js';
import EnergyLog from '../models/EnergyLog.js';
import { estimateWeeksToGoal, detectDropoffRisk } from '../utils/calculationUtils.js';

export const logProgress = async (user_id, progressData, week_number) => {
  const workoutCompletions = progressData.daily_logs?.map(log => log.workout_completion) || [];
  const dietAdherences = progressData.daily_logs?.map(log => log.diet_adherence) || [];
  
  const workoutAdherence = calculateAdherence(workoutCompletions);
  const dietAdherence = calculateAdherence(dietAdherences);
  
  const progressLog = new ProgressLog({
    user_id,
    week_number,
    ...progressData,
    workout_adherence_percent: workoutAdherence,
    diet_adherence_percent: dietAdherence
  });
  
  await progressLog.save();
  
  await calculateAndSaveHabitScore(user_id, week_number, workoutAdherence, dietAdherence);
  
  return progressLog;
};

export const getProgressByWeek = async (user_id, week_number) => {
  return await ProgressLog.findOne({ user_id, week_number });
};

export const getAllProgress = async (user_id) => {
  return await ProgressLog.find({ user_id }).sort({ week_number: 1 });
};

export const getRecentProgress = async (user_id, weeksToFetch = 12) => {
  return await ProgressLog.find({ user_id })
    .sort({ week_number: -1 })
    .limit(weeksToFetch);
};

const calculateAdherence = (completionArray) => {
  if (!completionArray || completionArray.length === 0) return 0;
  
  const scores = {
    'Completed': 100,
    'Followed': 100,
    'Partial': 50,
    'Mostly': 75,
    'Skipped': 0,
    'Deviated': 0
  };
  
  const total = completionArray.reduce((sum, completion) => sum + (scores[completion] || 0), 0);
  return Math.round(total / completionArray.length);
};

const calculateAndSaveHabitScore = async (user_id, week_number, workoutAdherence, dietAdherence) => {
  // Formula: (Workout Adherence × 0.60) + (Diet Adherence × 0.40)
  const habitScore = Math.round((workoutAdherence * 0.60) + (dietAdherence * 0.40));
  
  const previousScore = await HabitScore.findOne({ user_id }).sort({ week_number: -1 });
  let streak = 1;
  
  if (previousScore && previousScore.habit_score >= 70) {
    streak = previousScore.streak_count + 1;
  }
  
  const score = new HabitScore({
    user_id,
    week_number,
    workout_adherence_percent: workoutAdherence,
    diet_adherence_percent: dietAdherence,
    habit_score: habitScore,
    streak_count: streak
  });
  
  await score.save();
  return score;
};

export const getHabitScores = async (user_id) => {
  return await HabitScore.find({ user_id }).sort({ week_number: 1 });
};

export const getCurrentHabitScore = async (user_id) => {
  return await HabitScore.findOne({ user_id }).sort({ created_at: -1 });
};

export const logEnergy = async (user_id, energy_level, notes = '') => {
  const energyLog = new EnergyLog({
    user_id,
    energy_level,
    notes
  });
  
  await energyLog.save();
  return energyLog;
};

export const getRecentEnergyLogs = async (user_id, days = 7) => {
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);
  
  return await EnergyLog.find({
    user_id,
    created_at: { $gte: startDate }
  }).sort({ created_at: -1 });
};

export const checkDropoffRisk = async (user_id) => {
  // Import daily log service
  const DailyLog = (await import('../models/DailyLog.js')).default;
  
  const recentLogs = await DailyLog.find({ user_id })
    .sort({ date: -1 })
    .limit(14);
  
  const habitScore = await getCurrentHabitScore(user_id);
  
  let streak = 0;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  for (let i = 0; i < recentLogs.length; i++) {
    const logDate = new Date(recentLogs[i].date);
    logDate.setHours(0, 0, 0, 0);
    
    const expectedDate = new Date(today);
    expectedDate.setDate(expectedDate.getDate() - i);
    expectedDate.setHours(0, 0, 0, 0);
    
    if (logDate.getTime() !== expectedDate.getTime()) {
      break;
    }
    
    if (recentLogs[i].workout_completed && recentLogs[i].diet_followed) {
      streak++;
    } else {
      break;
    }
  }
  
  return detectDropoffRisk(recentLogs, habitScore?.habit_score, streak);
};

export const forecastGoalAchievement = async (user_id) => {
  const allProgress = await getAllProgress(user_id);
  
  if (allProgress.length < 2) {
    return {
      estimated_weeks: null,
      confidence: 'Low - Need more data'
    };
  }
  
  const weights = allProgress.map(p => p.weight_kg).filter(Boolean);
  
  if (weights.length < 2) {
    return {
      estimated_weeks: null,
      confidence: 'Low - Need weight tracking data'
    };
  }
  
  const weeklyChanges = [];
  for (let i = 1; i < weights.length; i++) {
    weeklyChanges.push(weights[i] - weights[i - 1]);
  }
  
  const avgWeeklyChange = weeklyChanges.reduce((a, b) => a + b, 0) / weeklyChanges.length;
  
  const lastProgress = allProgress[allProgress.length - 1];
  const currentWeight = lastProgress.weight_kg;
  
  return {
    estimated_weeks: Math.abs(avgWeeklyChange) > 0 ? Math.ceil(Math.abs(5 / avgWeeklyChange)) : null,
    avg_weekly_change: Math.round(avgWeeklyChange * 10) / 10,
    confidence: 'Medium'
  };
};

// Get goal progress with real-time weight data from daily logs
export const getGoalProgress = async (user_id) => {
  const Profile = (await import('../models/Profile.js')).default;
  const DailyLog = (await import('../models/DailyLog.js')).default;
  
  try {
    // Get user profile
    const profile = await Profile.findOne({ user_id });
    
    if (!profile) {
      throw new Error('Profile not found');
    }
    
    // Get latest weight from daily logs (most recent entry with weight_kg)
    const latestDailyLog = await DailyLog.findOne({ user_id, weight_kg: { $exists: true, $ne: null } })
      .sort({ date: -1 });
    
    const currentWeight = latestDailyLog?.weight_kg || profile.weight_kg;
    const startingWeight = profile.weight_kg;
    const targetWeight = profile.target_weight_kg;
    const goal = profile.goal;
    const goalTimeframe = profile.goal_timeframe || '12 weeks';
    
    // Calculate weight change
    const totalWeightChange = startingWeight - currentWeight;
    const targetWeightChange = startingWeight - targetWeight;
    
    // Calculate progress percentage (0-100%)
    let progressPercentage = 0;
    if (goal === 'Weight Loss') {
      progressPercentage = targetWeightChange !== 0 ? Math.max(0, Math.min(100, (totalWeightChange / targetWeightChange) * 100)) : 0;
    } else if (goal === 'Muscle Gain') {
      progressPercentage = targetWeightChange !== 0 ? Math.max(0, Math.min(100, ((currentWeight - startingWeight) / (targetWeight - startingWeight)) * 100)) : 0;
    } else {
      // Maintenance - stay within a range
      progressPercentage = Math.abs(currentWeight - startingWeight) < 2 ? 100 : 50;
    }
    
    // Get weight history (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const weightHistory = await DailyLog.find({
      user_id,
      date: { $gte: thirtyDaysAgo },
      weight_kg: { $exists: true, $ne: null }
    }).sort({ date: 1 });
    
    // Calculate remaining distance and time
    let remainingDistance = 0;
    if (goal === 'Weight Loss') {
      remainingDistance = Math.max(0, currentWeight - targetWeight);
    } else if (goal === 'Muscle Gain') {
      remainingDistance = Math.max(0, targetWeight - currentWeight);
    }
    
    // Count logs to estimate days of data
    const logsCount = await DailyLog.countDocuments({ user_id });
    const avgLogsPerWeek = logsCount / (logsCount > 0 ? Math.ceil(logsCount / 7) : 1);
    
    return {
      goal_type: goal,
      goal_timeframe: goalTimeframe,
      starting_weight: Math.round(startingWeight * 10) / 10,
      current_weight: Math.round(currentWeight * 10) / 10,
      target_weight: Math.round(targetWeight * 10) / 10,
      total_weight_change: Math.round(totalWeightChange * 10) / 10,
      target_weight_change: Math.round(targetWeightChange * 10) / 10,
      remaining_distance: Math.round(remainingDistance * 10) / 10,
      progress_percentage: Math.round(progressPercentage),
      weight_history: weightHistory.map(log => ({
        date: log.date,
        weight: log.weight_kg
      })),
      logs_tracking: logsCount,
      has_recent_weight: !!latestDailyLog
    };
  } catch (error) {
    console.error('Error calculating goal progress:', error);
    throw error;
  }
};

// Get energy status with trend
export const getEnergyStatus = async (user_id) => {
  const DailyLog = (await import('../models/DailyLog.js')).default;
  
  try {
    // Get last 7 days of daily logs (primary source of energy data)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentDailyLogs = await DailyLog.find({
      user_id,
      date: { $gte: sevenDaysAgo }
    }).sort({ date: -1 });
    
    if (recentDailyLogs.length === 0) {
      return {
        current_energy: null,
        trend: 'No data',
        last_log_date: null,
        weekly_average: null,
        logs_this_week: 0,
        status_icon: '😴',
        recommendation: 'Start logging your daily energy to track patterns'
      };
    }
    
    const currentLog = recentDailyLogs[0];
    const energyValues = {
      'Very Tired': 1,
      'Slightly Fatigued': 2,
      'Normal': 3,
      'Energized': 4
    };
    
    // Calculate average energy for the week from daily logs
    const energyScores = recentDailyLogs
      .filter(log => log.energy_level)
      .map(log => energyValues[log.energy_level] || 0);
    
    if (energyScores.length === 0) {
      return {
        current_energy: null,
        trend: 'No data',
        last_log_date: null,
        weekly_average: null,
        logs_this_week: recentDailyLogs.length,
        status_icon: '😴',
        recommendation: 'Log your energy level to see insights'
      };
    }
    
    const weeklyAverage = (energyScores.reduce((a, b) => a + b, 0) / energyScores.length).toFixed(1);
    
    // Determine trend from energy progression
    let trend = 'Stable';
    if (recentDailyLogs.length >= 3) {
      const recentAvg = (energyScores.slice(0, 3).reduce((a, b) => a + b, 0) / 3);
      const olderAvg = energyScores.length > 3 ? (energyScores.slice(3).reduce((a, b) => a + b, 0) / (energyScores.length - 3)) : recentAvg;
      
      if (recentAvg > olderAvg + 0.5) {
        trend = 'Improving';
      } else if (recentAvg < olderAvg - 0.5) {
        trend = 'Declining';
      }
    }
    
    // Calculate sleep quality impact
    const sleepHours = recentDailyLogs.filter(log => log.sleep_hours).map(log => log.sleep_hours);
    const avgSleep = sleepHours.length > 0 ? (sleepHours.reduce((a, b) => a + b, 0) / sleepHours.length).toFixed(1) : 0;
    
    // Determine status icon
    const getStatusIcon = (level) => {
      switch(level) {
        case 'Energized': return '⚡';
        case 'Normal': return '😊';
        case 'Slightly Fatigued': return '😴';
        case 'Very Tired': return '😴😴';
        default: return '😴';
      }
    };
    
    // Calculate mood correlation
    const moodValues = { 'Poor': 1, 'Fair': 2, 'Good': 3, 'Great': 4, 'Excellent': 5 };
    const moods = recentDailyLogs.filter(log => log.mood).map(log => moodValues[log.mood] || 0);
    const avgMood = moods.length > 0 ? (moods.reduce((a, b) => a + b, 0) / moods.length).toFixed(1) : 0;
    
    return {
      current_energy: currentLog.energy_level,
      current_date: currentLog.date,
      current_mood: currentLog.mood,
      trend,
      weekly_average: parseFloat(weeklyAverage),
      logs_this_week: recentDailyLogs.filter(log => log.energy_level).length,
      status_icon: getStatusIcon(currentLog.energy_level),
      status_color: currentLog.energy_level === 'Energized' ? 'green' : 
                    currentLog.energy_level === 'Normal' ? 'blue' :
                    currentLog.energy_level === 'Slightly Fatigued' ? 'yellow' : 'red',
      // Additional metrics from daily logs
      avg_sleep: parseFloat(avgSleep),
      avg_mood: parseFloat(avgMood),
      total_logs_this_week: recentDailyLogs.length,
      recommendation: generateEnergyRecommendation(currentLog.energy_level, trend, parseFloat(avgSleep), parseFloat(weeklyAverage))
    };
  } catch (error) {
    console.error('Error getting energy status:', error);
    throw error;
  }
};

// Generate energy recommendation based on multiple factors
const generateEnergyRecommendation = (currentLevel, trend, avgSleep, weeklyAvg) => {
  if (currentLevel === 'Very Tired') {
    if (avgSleep < 7) {
      return '😴 Your sleep is low. Prioritize 7-8 hours tonight';
    }
    return 'Consider taking a rest day or doing light exercise';
  } else if (currentLevel === 'Slightly Fatigued' && trend === 'Declining') {
    return '⚠️ Your energy is dropping - ensure adequate sleep and nutrition';
  } else if (currentLevel === 'Energized') {
    return '⚡ Great energy! Perfect time for an intense workout';
  } else if (trend === 'Improving') {
    return '📈 Your energy is improving - keep up the momentum!';
  }
  
  if (avgSleep < 6.5) {
    return 'Improve sleep quality for better energy levels';
  }
  
  return 'Maintain your current routine';
};

// Get goal forecast with estimated completion date
export const getGoalForecast = async (user_id) => {
  const Profile = (await import('../models/Profile.js')).default;
  const DailyLog = (await import('../models/DailyLog.js')).default;
  
  try {
    const profile = await Profile.findOne({ user_id });
    
    if (!profile) {
      throw new Error('Profile not found');
    }
    
    // Get weight logs from last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const weightLogs = await DailyLog.find({
      user_id,
      date: { $gte: thirtyDaysAgo },
      weight_kg: { $exists: true, $ne: null }
    }).sort({ date: 1 });
    
    if (weightLogs.length < 2) {
      return {
        estimated_completion: null,
        confidence: 'Low - Need at least 2 weeks of weight data',
        weekly_change: null,
        current_weight: profile.weight_kg,
        target_weight: profile.target_weight_kg,
        weeks_remaining: null
      };
    }
    
    // Calculate weekly weight change trend
    const firstWeight = weightLogs[0].weight_kg;
    const lastWeight = weightLogs[weightLogs.length - 1].weight_kg;
    const daysDifference = Math.ceil((weightLogs[weightLogs.length - 1].date - weightLogs[0].date) / (1000 * 60 * 60 * 24));
    const weeksDifference = daysDifference / 7;
    
    const weeklyChange = (lastWeight - firstWeight) / weeksDifference;
    
    // Calculate remaining distance
    const currentWeight = lastWeight;
    const targetWeight = profile.target_weight_kg;
    const remainingDistance = Math.abs(targetWeight - currentWeight);
    
    // Estimate weeks to goal
    let weeksToGoal = null;
    let confidence = 'Low';
    
    if (Math.abs(weeklyChange) > 0.1) {
      weeksToGoal = Math.ceil(remainingDistance / Math.abs(weeklyChange));
      confidence = daysDifference >= 14 ? 'High' : 'Medium';
    }
    
    // Calculate estimated completion date
    let estimatedCompletion = null;
    if (weeksToGoal) {
      estimatedCompletion = new Date();
      estimatedCompletion.setDate(estimatedCompletion.getDate() + (weeksToGoal * 7));
    }
    
    return {
      estimated_completion: estimatedCompletion,
      estimated_weeks: weeksToGoal,
      confidence,
      current_weight: Math.round(currentWeight * 10) / 10,
      target_weight: Math.round(targetWeight * 10) / 10,
      remaining_distance: Math.round(remainingDistance * 10) / 10,
      weekly_change: Math.round(weeklyChange * 100) / 100,
      data_days: daysDifference,
      goal_type: profile.goal,
      message: generateForecastMessage(weeksToGoal, profile.goal, weeklyChange)
    };
  } catch (error) {
    console.error('Error calculating goal forecast:', error);
    throw error;
  }
};

// Generate forecast message
const generateForecastMessage = (weeks, goal, weeklyChange) => {
  if (!weeks) return 'Need more data to forecast';
  
  if (goal === 'Weight Loss') {
    if (weeks <= 4) return `🎉 You're on track! Target in ~${weeks} week${weeks > 1 ? 's' : ''}`;
    if (weeks <= 12) return `💪 Great pace! Target in ~${weeks} weeks`;
    return `⏳ At current pace, ${weeks} weeks remaining`;
  } else if (goal === 'Muscle Gain') {
    if (weeks <= 6) return `🚀 Excellent progress! Goal in ~${weeks} week${weeks > 1 ? 's' : ''}`;
    if (weeks <= 16) return `💪 Good gains! Continue for ~${weeks} weeks`;
    return `⏳ Keep grinding! ~${weeks} weeks to go`;
  } else {
    return `⚖️ Maintaining well! Stay consistent`;
  }
};

// Get measurement trends
export const getMeasurementTrends = async (user_id) => {
  const BodyMeasurement = (await import('../models/BodyMeasurement.js')).default;
  const Profile = (await import('../models/Profile.js')).default;
  
  try {
    const profile = await Profile.findOne({ user_id });
    const allMeasurements = await BodyMeasurement.find({ user_id }).sort({ date: 1 });
    
    if (allMeasurements.length < 2) {
      return {
        has_data: false,
        message: 'Add measurements to track trends',
        measurements_count: allMeasurements.length
      };
    }
    
    const firstMeasurement = allMeasurements[0];
    const lastMeasurement = allMeasurements[allMeasurements.length - 1];
    
    // Calculate changes
    const measurements = {
      waist: {
        initial: firstMeasurement.measurements.waist_cm,
        current: lastMeasurement.measurements.waist_cm,
        change: null,
        status: null
      },
      chest: {
        initial: firstMeasurement.measurements.chest_cm,
        current: lastMeasurement.measurements.chest_cm,
        change: null,
        status: null
      },
      hips: {
        initial: firstMeasurement.measurements.hips_cm,
        current: lastMeasurement.measurements.hips_cm,
        change: null,
        status: null
      },
      arms: {
        initial: firstMeasurement.measurements.left_arm_cm,
        current: lastMeasurement.measurements.left_arm_cm,
        change: null,
        status: null
      },
      thighs: {
        initial: firstMeasurement.measurements.left_thigh_cm,
        current: lastMeasurement.measurements.left_thigh_cm,
        change: null,
        status: null
      }
    };
    
    // Calculate changes and assign status
    Object.keys(measurements).forEach(key => {
      const m = measurements[key];
      if (m.initial && m.current) {
        m.change = Math.round((m.current - m.initial) * 10) / 10;
        m.status = m.change < -1 ? 'Decreasing' : m.change > 1 ? 'Increasing' : 'Stable';
      }
    });
    
    // Analyze based on goal
    const goal = profile.goal;
    let overall_assessment = 'On Track';
    let recommendations = [];
    
    if (goal === 'Weight Loss') {
      const decreasingCount = Object.values(measurements).filter(m => m.status === 'Decreasing').length;
      if (decreasingCount >= 3) {
        overall_assessment = 'Excellent';
        recommendations.push('Great fat loss - keep up the diet consistency');
      } else if (decreasingCount > 0) {
        overall_assessment = 'Good Progress';
      } else {
        overall_assessment = 'Needs Adjustment';
        recommendations.push('Consider adjusting diet or increasing cardio');
      }
    } else if (goal === 'Muscle Gain') {
      const increasingCount = Object.values(measurements).filter(m => m.status === 'Increasing' && (m.change > 1)).length;
      if (increasingCount >= 2) {
        overall_assessment = 'Excellent';
        recommendations.push('Muscle growth detected - keep up with protein intake');
      } else if (increasingCount > 0) {
        overall_assessment = 'Good Progress';
      } else {
        overall_assessment = 'Needs Adjustment';
        recommendations.push('Increase protein and progressive overload in workouts');
      }
    }
    
    return {
      has_data: true,
      overall_assessment,
      measurements,
      total_entries: allMeasurements.length,
      last_measurement_date: lastMeasurement.date,
      days_tracked: Math.ceil((lastMeasurement.date - firstMeasurement.date) / (1000 * 60 * 60 * 24)),
      recommendations,
      trend_chart_data: allMeasurements.map(m => ({
        date: m.date,
        waist: m.measurements.waist_cm,
        chest: m.measurements.chest_cm,
        hips: m.measurements.hips_cm,
        arms: m.measurements.left_arm_cm,
        thighs: m.measurements.left_thigh_cm
      }))
    };
  } catch (error) {
    console.error('Error getting measurement trends:', error);
    throw error;
  }
};
