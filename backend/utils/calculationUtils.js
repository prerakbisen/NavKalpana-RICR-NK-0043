export const calculateBMI = (weight_kg, height_cm) => {
  const height_m = height_cm / 100;
  return Math.round((weight_kg / (height_m * height_m)) * 10) / 10;
};

export const calculateBMR = (weight_kg, height_cm, age, gender) => {
  let bmr;
  
  const sex = gender || 'Male';
  
  if (sex === 'Male') {
    // Men: (10 × weight) + (6.25 × height) − (5 × age) + 5
    bmr = (10 * weight_kg) + (6.25 * height_cm) - (5 * age) + 5;
  } else {
    bmr = (10 * weight_kg) + (6.25 * height_cm) - (5 * age) - 161;
  }
  
  return Math.round(bmr);
};

export const getActivityFactor = (activity_level) => {
  const factors = {
    'Sedentary': 1.2,
    'Light': 1.375,
    'Moderate': 1.55,
    'Active': 1.725
  };
  return factors[activity_level] || 1.2;
};

export const calculateDailyCalorieTarget = (bmr, activity_factor, goal, gender) => {
  let tdee = bmr * activity_factor;
  let target;
  
  const sex = gender || 'Male';
  
  if (goal === 'Weight Loss') {
    target = Math.round(tdee - 400);
  } else if (goal === 'Muscle Gain') {
    target = Math.round(tdee + 300);
  } else {
    target = Math.round(tdee);
  }
  
  const floor = sex === 'Male' ? 1500 : 1200;
  return Math.max(target, floor);
};

export const getMacroSplit = (goal) => {
  if (goal === 'Weight Loss') {
    return { protein: 40, carbs: 30, fat: 30 };
  } else if (goal === 'Muscle Gain') {
    return { protein: 30, carbs: 50, fat: 20 };
  } else {
    
    return { protein: 30, carbs: 50, fat: 20 };
  }
};

export const calculateMacros = (daily_calorie_target, goal) => {
  const split = getMacroSplit(goal);
  

  return {
    protein_grams: Math.round((split.protein / 100 * daily_calorie_target) / 4),
    carbs_grams: Math.round((split.carbs / 100 * daily_calorie_target) / 4),
    fat_grams: Math.round((split.fat / 100 * daily_calorie_target) / 9),
    protein_percent: split.protein,
    carbs_percent: split.carbs,
    fat_percent: split.fat
  };
};

export const estimateWeeksToGoal = (current_weight, target_weight, avg_weekly_change) => {
  if (avg_weekly_change === 0 || !avg_weekly_change) return null;
  
  const weight_difference = Math.abs(target_weight - current_weight);
  const weeks = Math.ceil(weight_difference / Math.abs(avg_weekly_change));
  
  return {
    estimated_weeks: weeks,
    estimated_date: new Date(Date.now() + weeks * 7 * 24 * 60 * 60 * 1000),
    confidence: 'Medium'
  };
};

export const detectDropoffRisk = (dailyLogs, habitScore, streak) => {
  const risk = {
    at_risk: false,
    risk_level: 'low', 
    risk_score: 0, 
    reasons: [],
    recommendations: [],
    positive_notes: []
  };
  
  if (!dailyLogs || dailyLogs.length === 0) {
    risk.at_risk = true;
    risk.risk_level = 'critical';
    risk.risk_score = 100;
    risk.reasons.push('No activity logged yet');
    risk.recommendations.push('Start by logging your first day');
    risk.recommendations.push('Set a daily reminder to log your progress');
    return risk;
  }
  
  const recentLogs = dailyLogs.slice(0, 14);
  const last7Days = dailyLogs.slice(0, 7);
  
  const daysSinceLastLog = Math.floor((Date.now() - new Date(dailyLogs[0].date)) / (24 * 60 * 60 * 1000));
  if (daysSinceLastLog > 3) {
    risk.at_risk = true;
    risk.risk_score += 25;
    risk.reasons.push(`No log for ${daysSinceLastLog} days`);
    risk.recommendations.push('Resume daily logging to maintain momentum');
    risk.recommendations.push('Set a daily reminder at a consistent time');
  } else if (daysSinceLastLog === 0) {
    risk.positive_notes.push('Logged today - great consistency!');
  }
  
  const workoutCompletions = last7Days.filter(log => log.workout_completed).length;
  const workoutRate = (workoutCompletions / Math.min(7, last7Days.length)) * 100;
  
  if (workoutRate < 30) {
    risk.at_risk = true;
    risk.risk_score += 30;
    risk.reasons.push(`Only ${workoutCompletions} workouts in last 7 days (${Math.round(workoutRate)}%)`);
    risk.recommendations.push('Try shorter 15-20 minute workouts');
    risk.recommendations.push('Schedule workouts at your highest energy time');
  } else if (workoutRate >= 70) {
    risk.positive_notes.push(`Strong workout consistency: ${Math.round(workoutRate)}%`);
  }
  
  const dietCompletions = last7Days.filter(log => log.diet_followed).length;
  const dietRate = (dietCompletions / Math.min(7, last7Days.length)) * 100;
  
  if (dietRate < 40) {
    risk.at_risk = true;
    risk.risk_score += 25;
    risk.reasons.push(`Diet adherence at ${Math.round(dietRate)}% (last 7 days)`);
    risk.recommendations.push('Meal prep on Sundays to stay on track');
    risk.recommendations.push('Focus on one meal at a time');
  } else if (dietRate >= 80) {
    risk.positive_notes.push(`Excellent nutrition: ${Math.round(dietRate)}% adherence`);
  }
  
  let consecutiveMissed = 0;
  for (const log of last7Days) {
    if (!log.workout_completed && !log.diet_followed) {
      consecutiveMissed++;
    } else {
      break;
    }
  }
  
  if (consecutiveMissed >= 3) {
    risk.at_risk = true;
    risk.risk_score += 20;
    risk.reasons.push(`${consecutiveMissed} consecutive days with no activity`);
    risk.recommendations.push('Start fresh today - even small progress counts');
    risk.recommendations.push('Talk to AI Coach for motivation');
  }
  
  if (habitScore && habitScore < 50) {
    risk.at_risk = true;
    risk.risk_score += 15;
    risk.reasons.push(`Habit score below 50 (currently ${habitScore})`);
    risk.recommendations.push('Focus on building one habit at a time');
  } else if (habitScore && habitScore >= 80) {
    risk.positive_notes.push(`Outstanding habit score: ${habitScore}/100`);
  }
  
  if (streak === 0) {
    risk.risk_score += 10;
    risk.reasons.push('No active streak');
    risk.recommendations.push('Start a new streak today!');
  } else if (streak >= 7) {
    risk.positive_notes.push(`Amazing ${streak}-day streak! 🔥`);
  }
  
  const lowEnergyDays = last7Days.filter(log => log.energy_level === 'Low').length;
  if (lowEnergyDays >= 4) {
    risk.risk_score += 10;
    risk.reasons.push(`Low energy reported ${lowEnergyDays} days this week`);
    risk.recommendations.push('Review sleep quality and hydration');
    risk.recommendations.push('Consider lighter workout intensity');
  }
  
  const avgSleep = last7Days.reduce((sum, log) => sum + (log.sleep_hours || 0), 0) / last7Days.length;
  if (avgSleep > 0 && avgSleep < 6) {
    risk.risk_score += 10;
    risk.reasons.push(`Average sleep: ${avgSleep.toFixed(1)} hours (below 6)`);
    risk.recommendations.push('Prioritize 7-9 hours of sleep');
    risk.recommendations.push('Sleep is crucial for recovery and results');
  } else if (avgSleep >= 7 && avgSleep <= 9) {
    risk.positive_notes.push(`Great sleep: ${avgSleep.toFixed(1)} hours average`);
  }
  
  if (risk.risk_score >= 75) {
    risk.risk_level = 'critical';
  } else if (risk.risk_score >= 50) {
    risk.risk_level = 'high';
  } else if (risk.risk_score >= 25) {
    risk.risk_level = 'medium';
  } else {
    risk.risk_level = 'low';
  }
  
  if (!risk.at_risk) {
    risk.positive_notes.push('You\'re doing great! Keep up the momentum');
    risk.recommendations.push('Continue your current routine');
    risk.recommendations.push('Consider increasing intensity gradually');
  }
  
  return risk;
};
