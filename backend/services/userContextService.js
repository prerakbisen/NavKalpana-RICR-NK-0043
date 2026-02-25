import Profile from '../models/Profile.js';
import ProgressLog from '../models/ProgressLog.js';
import HabitScore from '../models/HabitScore.js';
import WorkoutPlan from '../models/WorkoutPlanV2.js';
import DietPlan from '../models/DietPlan.js';
import EnergyLog from '../models/EnergyLog.js';
import BodyMeasurement from '../models/BodyMeasurement.js';
import User from '../models/User.js';


export const gatherCompleteUserContext = async (user_id) => {
  try {
    const [
      user,
      profile,
      allProgress,
      allHabitScores,
      allWorkouts,
      allDiets,
      allEnergyLogs,
      allMeasurements
    ] = await Promise.all([
      User.findById(user_id),
      Profile.findOne({ user_id }),
      ProgressLog.find({ user_id }).sort({ week_number: 1 }),
      HabitScore.find({ user_id }).sort({ week_number: 1 }),
      WorkoutPlan.find({ user_id }).sort({ week_number: 1 }),
      DietPlan.find({ user_id }).sort({ week_number: 1 }),
      EnergyLog.find({ user_id }).sort({ logged_at: -1 }).limit(30),
      BodyMeasurement.find({ user_id }).sort({ measured_at: -1 }).limit(10)
    ]);

    if (!profile || !user) {
      return null;
    }

    const stats = calculateUserStats(profile, allProgress, allHabitScores);
    
    const context = {
      user: {
        name: user.name,
        email: user.email
      },

      profile: {
        age: profile.age,
        gender: profile.gender,
        current_weight_kg: profile.weight_kg,
        height_cm: profile.height_cm,
        goal: profile.goal,
        target_weight_kg: profile.target_weight_kg,
        experience_level: profile.experience_level,
        available_days_per_week: profile.available_days_per_week,
        daily_calorie_target: profile.daily_calorie_target,
        dietary_preferences: profile.dietary_preferences,
        allergies: profile.allergies,
        injuries_limitations: profile.injuries_limitations,
        created_at: profile.created_at
      },

      progress_history: allProgress.map(p => ({
        week: p.week_number,
        weight_kg: p.weight_kg,
        weight_change: p.weight_change_kg,
        workout_adherence: p.workout_adherence_percent,
        diet_adherence: p.diet_adherence_percent,
        fatigue_level: p.fatigue_level,
        notes: p.notes,
        daily_logs: p.daily_logs
      })),

      habit_scores: allHabitScores.map(h => ({
        week: h.week_number,
        score: h.habit_score,
        streak: h.streak_count
      })),

      workout_history: allWorkouts.map(w => ({
        week: w.week_number,
        goal: w.goal,
        experience_level: w.experience_level,
        total_workouts: w.workouts.length,
        workout_types: w.workouts.map(d => d.type).filter(t => !d.rest_day)
      })),

      diet_history: allDiets.map(d => ({
        week: d.week_number,
        calorie_target: d.daily_calorie_target,
        protein_grams: d.protein_grams,
        carbs_grams: d.carbs_grams,
        fat_grams: d.fat_grams
      })),

      recent_energy: allEnergyLogs.map(e => ({
        date: e.logged_at,
        energy_level: e.energy_level,
        notes: e.notes
      })),

      measurements: allMeasurements.map(m => ({
        date: m.measured_at,
        measurements: m.measurements,
        notes: m.notes
      })),

      statistics: stats
    };

    return context;
  } catch (error) {
    console.error('Error gathering user context:', error);
    throw error;
  }
};

const calculateUserStats = (profile, progressLogs, habitScores) => {
  const stats = {
    total_weeks_tracked: progressLogs.length,
    average_workout_adherence: 0,
    average_diet_adherence: 0,
    total_weight_change_kg: 0,
    average_weekly_weight_change: 0,
    current_streak: 0,
    best_streak: 0,
    average_habit_score: 0,
    consistency_rating: 'Unknown',
    progress_trend: 'Unknown'
  };

  if (progressLogs.length === 0) {
    return stats;
  }

  const totalWorkoutAdherence = progressLogs.reduce((sum, p) => sum + (p.workout_adherence_percent || 0), 0);
  const totalDietAdherence = progressLogs.reduce((sum, p) => sum + (p.diet_adherence_percent || 0), 0);
  
  stats.average_workout_adherence = Math.round(totalWorkoutAdherence / progressLogs.length);
  stats.average_diet_adherence = Math.round(totalDietAdherence / progressLogs.length);

  const firstWeight = progressLogs[0].weight_kg;
  const lastWeight = progressLogs[progressLogs.length - 1].weight_kg;
  stats.total_weight_change_kg = (lastWeight - firstWeight).toFixed(1);
  stats.average_weekly_weight_change = (stats.total_weight_change_kg / progressLogs.length).toFixed(2);

  if (habitScores.length > 0) {
    const totalHabitScore = habitScores.reduce((sum, h) => sum + h.habit_score, 0);
    stats.average_habit_score = Math.round(totalHabitScore / habitScores.length);
    stats.current_streak = habitScores[habitScores.length - 1].streak_count;
    stats.best_streak = Math.max(...habitScores.map(h => h.streak_count));
  }

  if (stats.average_workout_adherence >= 80 && stats.average_diet_adherence >= 80) {
    stats.consistency_rating = 'Excellent';
  } else if (stats.average_workout_adherence >= 60 && stats.average_diet_adherence >= 60) {
    stats.consistency_rating = 'Good';
  } else if (stats.average_workout_adherence >= 40 && stats.average_diet_adherence >= 40) {
    stats.consistency_rating = 'Fair';
  } else {
    stats.consistency_rating = 'Needs Improvement';
  }

  if (profile.goal === 'Weight Loss') {
    if (parseFloat(stats.total_weight_change_kg) < -2) {
      stats.progress_trend = 'Excellent - Losing weight steadily';
    } else if (parseFloat(stats.total_weight_change_kg) < 0) {
      stats.progress_trend = 'Good - Losing weight';
    } else if (parseFloat(stats.total_weight_change_kg) === 0) {
      stats.progress_trend = 'Plateau - No change';
    } else {
      stats.progress_trend = 'Gaining weight - Need adjustment';
    }
  } else if (profile.goal === 'Muscle Gain') {
    if (parseFloat(stats.total_weight_change_kg) > 2) {
      stats.progress_trend = 'Excellent - Gaining weight steadily';
    } else if (parseFloat(stats.total_weight_change_kg) > 0) {
      stats.progress_trend = 'Good - Gaining weight';
    } else if (parseFloat(stats.total_weight_change_kg) === 0) {
      stats.progress_trend = 'Plateau - No change';
    } else {
      stats.progress_trend = 'Losing weight - Need adjustment';
    }
  }

  return stats;
};

export const formatUserContextForAI = (context) => {
  if (!context) {
    return 'No user data available.';
  }

  let prompt = `COMPLETE USER PROFILE AND HISTORY:

=== USER INFORMATION ===
- Name: ${context.user.name}
- Email: ${context.user.email}

=== BASIC INFORMATION ===
- Age: ${context.profile.age} years old
- Gender: ${context.profile.gender}
- Current Weight: ${context.profile.current_weight_kg} kg
- Height: ${context.profile.height_cm} cm
- Goal: ${context.profile.goal}
- Target Weight: ${context.profile.target_weight_kg} kg
- Experience Level: ${context.profile.experience_level}
- Available Training Days: ${context.profile.available_days_per_week} days/week
- Daily Calorie Target: ${context.profile.daily_calorie_target} kcal
- Dietary Preferences: ${context.profile.dietary_preferences || 'None'}
- Allergies: ${context.profile.allergies || 'None'}
- Injuries/Limitations: ${context.profile.injuries_limitations || 'None'}
- Member Since: ${new Date(context.profile.created_at).toLocaleDateString()}

=== OVERALL STATISTICS ===
- Total Weeks Tracked: ${context.statistics.total_weeks_tracked}
- Average Workout Adherence: ${context.statistics.average_workout_adherence}%
- Average Diet Adherence: ${context.statistics.average_diet_adherence}%
- Total Weight Change: ${context.statistics.total_weight_change_kg} kg
- Average Weekly Change: ${context.statistics.average_weekly_weight_change} kg/week
- Current Streak: ${context.statistics.current_streak} weeks
- Best Streak: ${context.statistics.best_streak} weeks
- Average Habit Score: ${context.statistics.average_habit_score}/100
- Consistency Rating: ${context.statistics.consistency_rating}
- Progress Trend: ${context.statistics.progress_trend}

=== WEEKLY PROGRESS HISTORY ===
${context.progress_history.map(p => `Week ${p.week}:
  - Weight: ${p.weight_kg} kg (Change: ${p.weight_change || 0} kg)
  - Workout Adherence: ${p.workout_adherence}%
  - Diet Adherence: ${p.diet_adherence}%
  - Fatigue: ${p.fatigue_level}
  - Notes: ${p.notes || 'None'}`).join('\n')}

=== RECENT ENERGY LEVELS ===
${context.recent_energy.slice(0, 7).map(e => `${new Date(e.date).toLocaleDateString()}: ${e.energy_level} ${e.notes ? `- ${e.notes}` : ''}`).join('\n')}

=== BODY MEASUREMENTS ===
${context.measurements.slice(0, 3).map(m => `${new Date(m.date).toLocaleDateString()}: ${JSON.stringify(m.measurements)}`).join('\n')}

=== WORKOUT PLAN HISTORY ===
${context.workout_history.map(w => `Week ${w.week}: ${w.workout_types.join(', ')}`).join('\n')}

=== DIET PLAN HISTORY ===
${context.diet_history.map(d => `Week ${d.week}: ${d.calorie_target} kcal (P: ${d.protein_grams}g, C: ${d.carbs_grams}g, F: ${d.fat_grams}g)`).join('\n')}
`;

  return prompt;
};
