import Profile from '../models/Profile.js';
import DailyLog from '../models/DailyLog.js';
import BodyMeasurement from '../models/BodyMeasurement.js';
import HabitScore from '../models/HabitScore.js';
import ProgressLog from '../models/ProgressLog.js';

class ReportingService {
  
  /**
   * Generate Monthly Fitness Report
   * Analyzes last 30 days of user data
   * Always fetches fresh data from database
   */
  async generateMonthlyReport(userId) {
    try {
      console.log(`📊 Generating monthly report for user: ${userId}`);
      
      const profile = await Profile.findOne({ user_id: userId });
      if (!profile) {
        throw new Error('Profile not found');
      }

      // Calculate date range (last 30 days) - always fresh
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - 30);

      console.log(`📅 Date range: ${startDate.toISOString()} to ${endDate.toISOString()}`);

      // Fetch all data for the period - fresh from database
      const [dailyLogs, measurements, habitScores, progressLogs] = await Promise.all([
        DailyLog.find({
          user_id: userId,
          date: { $gte: startDate, $lte: endDate }
        }).sort({ date: 1 }),
        BodyMeasurement.find({
          user_id: userId,
          date: { $gte: startDate, $lte: endDate }
        }).sort({ date: 1 }),
        HabitScore.find({
          user_id: userId,
          week_start_date: { $gte: startDate, $lte: endDate }
        }).sort({ week_start_date: 1 }),
        ProgressLog.find({
          user_id: userId,
          created_at: { $gte: startDate, $lte: endDate }
        }).sort({ created_at: 1 })
      ]);

      console.log(`📊 Data fetched - Logs: ${dailyLogs.length}, Measurements: ${measurements.length}, Habits: ${habitScores.length}, Progress: ${progressLogs.length}`);

      // Calculate weight change
      const weightChange = this._calculateWeightChange(dailyLogs, profile);
      
      // Calculate measurement changes
      const measurementChanges = this._calculateMeasurementChanges(measurements, profile);
      
      // Calculate habit score average
      const habitScoreAverage = this._calculateHabitScoreAverage(habitScores);
      
      // Calculate workout adherence
      const workoutAdherence = this._calculateWorkoutAdherence(dailyLogs);
      
      // Calculate diet adherence
      const dietAdherence = this._calculateDietAdherence(dailyLogs);
      
      // Calculate goal progress
      const goalProgress = this._calculateGoalProgress(profile, weightChange);
      
      // Generate insights
      const insights = this._generateInsights({
        weightChange,
        workoutAdherence,
        dietAdherence,
        habitScoreAverage,
        profile
      });

      console.log(`✅ Report generated successfully with ${insights.length} insights`);

      return {
        period: {
          start: startDate,
          end: endDate,
          days: 30
        },
        summary: {
          weight_change: weightChange,
          measurement_changes: measurementChanges,
          habit_score_average: habitScoreAverage,
          workout_adherence: workoutAdherence,
          diet_adherence: dietAdherence,
          goal_progress: goalProgress
        },
        details: {
          total_workouts: dailyLogs.filter(l => l.workout_completed).length,
          total_logs: dailyLogs.length,
          avg_sleep: this._calculateAverage(dailyLogs, 'sleep_hours'),
          avg_water: this._calculateAverage(dailyLogs, 'water_intake_liters'),
          avg_calories: this._calculateAverage(dailyLogs, 'calories_consumed'),
          measurements_taken: measurements.length
        },
        insights,
        generated_at: new Date()
      };
    } catch (error) {
      console.error('❌ Generate monthly report error:', error);
      throw error;
    }
  }

  /**
   * Calculate weight change over period
   */
  _calculateWeightChange(dailyLogs, profile) {
    if (dailyLogs.length === 0) {
      return {
        start_weight: profile.weight_kg,
        end_weight: profile.weight_kg,
        change: 0,
        change_percent: 0,
        trend: 'stable'
      };
    }

    // Get weights from logs
    const weightsWithData = dailyLogs.filter(l => l.weight_kg).map(l => ({
      date: l.date,
      weight: l.weight_kg
    }));

    if (weightsWithData.length === 0) {
      return {
        start_weight: profile.weight_kg,
        end_weight: profile.weight_kg,
        change: 0,
        change_percent: 0,
        trend: 'stable'
      };
    }

    const startWeight = weightsWithData[0].weight;
    const endWeight = weightsWithData[weightsWithData.length - 1].weight;
    const change = endWeight - startWeight;
    const changePercent = ((change / startWeight) * 100).toFixed(2);

    let trend = 'stable';
    if (change > 0.5) trend = 'increasing';
    else if (change < -0.5) trend = 'decreasing';

    return {
      start_weight: startWeight,
      end_weight: endWeight,
      change: parseFloat(change.toFixed(2)),
      change_percent: parseFloat(changePercent),
      trend,
      data_points: weightsWithData.length
    };
  }

  /**
   * Calculate measurement changes
   */
  _calculateMeasurementChanges(measurements, profile) {
    if (measurements.length < 2) {
      return {
        has_data: false,
        message: 'Need at least 2 measurements to calculate changes'
      };
    }

    const first = measurements[0].measurements;
    const last = measurements[measurements.length - 1].measurements;

    const changes = {};
    const fields = ['waist_cm', 'chest_cm', 'hips_cm', 'left_arm_cm', 'right_arm_cm', 'left_thigh_cm', 'right_thigh_cm'];

    fields.forEach(field => {
      if (first[field] && last[field]) {
        const change = last[field] - first[field];
        changes[field] = {
          start: first[field],
          end: last[field],
          change: parseFloat(change.toFixed(2)),
          change_percent: parseFloat(((change / first[field]) * 100).toFixed(2))
        };
      }
    });

    return {
      has_data: true,
      changes,
      measurements_count: measurements.length
    };
  }

  /**
   * Calculate habit score average
   */
  _calculateHabitScoreAverage(habitScores) {
    if (habitScores.length === 0) {
      return {
        average: 0,
        count: 0,
        trend: 'no_data'
      };
    }

    const scores = habitScores.map(h => h.habit_score);
    const average = scores.reduce((a, b) => a + b, 0) / scores.length;

    // Calculate trend
    let trend = 'stable';
    if (scores.length >= 2) {
      const firstHalf = scores.slice(0, Math.floor(scores.length / 2));
      const secondHalf = scores.slice(Math.floor(scores.length / 2));
      const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
      const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
      
      if (secondAvg > firstAvg + 5) trend = 'improving';
      else if (secondAvg < firstAvg - 5) trend = 'declining';
    }

    return {
      average: Math.round(average),
      count: habitScores.length,
      trend,
      highest: Math.max(...scores),
      lowest: Math.min(...scores)
    };
  }

  /**
   * Calculate workout adherence
   */
  _calculateWorkoutAdherence(dailyLogs) {
    if (dailyLogs.length === 0) {
      return {
        percentage: 0,
        completed: 0,
        total: 0,
        rating: 'no_data'
      };
    }

    const completed = dailyLogs.filter(l => l.workout_completed).length;
    const total = dailyLogs.length;
    const percentage = Math.round((completed / total) * 100);

    let rating = 'poor';
    if (percentage >= 90) rating = 'excellent';
    else if (percentage >= 75) rating = 'good';
    else if (percentage >= 60) rating = 'fair';

    return {
      percentage,
      completed,
      total,
      rating
    };
  }

  /**
   * Calculate diet adherence
   */
  _calculateDietAdherence(dailyLogs) {
    if (dailyLogs.length === 0) {
      return {
        percentage: 0,
        followed: 0,
        total: 0,
        rating: 'no_data'
      };
    }

    const followed = dailyLogs.filter(l => l.diet_followed).length;
    const total = dailyLogs.length;
    const percentage = Math.round((followed / total) * 100);

    let rating = 'poor';
    if (percentage >= 90) rating = 'excellent';
    else if (percentage >= 75) rating = 'good';
    else if (percentage >= 60) rating = 'fair';

    return {
      percentage,
      followed,
      total,
      rating
    };
  }

  /**
   * Calculate goal progress
   */
  _calculateGoalProgress(profile, weightChange) {
    const currentWeight = weightChange.end_weight || profile.weight_kg;
    const targetWeight = profile.target_weight_kg;
    const startWeight = profile.weight_kg;

    const totalNeeded = Math.abs(targetWeight - startWeight);
    const achieved = Math.abs(currentWeight - startWeight);
    const percentage = totalNeeded > 0 ? Math.round((achieved / totalNeeded) * 100) : 0;

    const remaining = Math.abs(targetWeight - currentWeight);

    return {
      current_weight: currentWeight,
      target_weight: targetWeight,
      start_weight: startWeight,
      total_needed: parseFloat(totalNeeded.toFixed(2)),
      achieved: parseFloat(achieved.toFixed(2)),
      remaining: parseFloat(remaining.toFixed(2)),
      percentage: Math.min(percentage, 100),
      on_track: this._isOnTrack(profile.goal, weightChange.change)
    };
  }

  /**
   * Check if user is on track for their goal
   */
  _isOnTrack(goal, monthlyChange) {
    // Expected monthly changes
    const targets = {
      'Weight Loss': { min: -2, max: -0.5 },
      'Muscle Gain': { min: 0.5, max: 2 },
      'Maintenance': { min: -0.5, max: 0.5 }
    };

    const target = targets[goal] || targets['Maintenance'];
    return monthlyChange >= target.min && monthlyChange <= target.max;
  }

  /**
   * Calculate average of a field
   */
  _calculateAverage(logs, field) {
    const values = logs.map(l => l[field]).filter(v => v != null && v > 0);
    if (values.length === 0) return 0;
    return parseFloat((values.reduce((a, b) => a + b, 0) / values.length).toFixed(2));
  }

  /**
   * Generate insights based on data
   */
  _generateInsights(data) {
    const insights = [];

    // Weight insights
    if (data.weightChange.trend === 'increasing' && data.profile.goal === 'Weight Loss') {
      insights.push({
        type: 'warning',
        category: 'weight',
        message: 'Weight is increasing while your goal is weight loss. Consider reviewing your calorie intake.',
        priority: 'high'
      });
    } else if (data.weightChange.trend === 'decreasing' && data.profile.goal === 'Muscle Gain') {
      insights.push({
        type: 'warning',
        category: 'weight',
        message: 'Weight is decreasing while your goal is muscle gain. Consider increasing calorie intake.',
        priority: 'high'
      });
    }

    // Workout adherence insights
    if (data.workoutAdherence.percentage >= 80) {
      insights.push({
        type: 'success',
        category: 'workout',
        message: `Excellent workout consistency at ${data.workoutAdherence.percentage}%! Keep it up!`,
        priority: 'medium'
      });
    } else if (data.workoutAdherence.percentage < 60) {
      insights.push({
        type: 'warning',
        category: 'workout',
        message: `Workout adherence is low at ${data.workoutAdherence.percentage}%. Try to be more consistent.`,
        priority: 'high'
      });
    }

    // Diet adherence insights
    if (data.dietAdherence.percentage >= 80) {
      insights.push({
        type: 'success',
        category: 'diet',
        message: `Great diet adherence at ${data.dietAdherence.percentage}%!`,
        priority: 'medium'
      });
    } else if (data.dietAdherence.percentage < 60) {
      insights.push({
        type: 'warning',
        category: 'diet',
        message: `Diet adherence needs improvement at ${data.dietAdherence.percentage}%.`,
        priority: 'high'
      });
    }

    // Habit score insights
    if (data.habitScoreAverage.trend === 'improving') {
      insights.push({
        type: 'success',
        category: 'habits',
        message: 'Your habits are improving! Great progress!',
        priority: 'low'
      });
    } else if (data.habitScoreAverage.trend === 'declining') {
      insights.push({
        type: 'warning',
        category: 'habits',
        message: 'Habit score is declining. Focus on consistency.',
        priority: 'medium'
      });
    }

    return insights;
  }
}

export default new ReportingService();
