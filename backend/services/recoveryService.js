import DailyLog from '../models/DailyLog.js';
import WorkoutPlanV2 from '../models/WorkoutPlanV2.js';



export const checkRecoveryNeeded = async (userId) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    
    const recentLogs = await DailyLog.find({
      user_id: userId,
      date: { $gte: sevenDaysAgo }
    }).sort({ date: -1 });

    const fatigueFlags = recentLogs.filter(log => 
      log.energy_level === 'Slightly Fatigued' || log.energy_level === 'Very Tired'
    ).length;

    const today = new Date().toISOString().split('T')[0];
    const todayLog = recentLogs.find(log => 
      log.date.toISOString().split('T')[0] === today
    );

    return {
      recovery_needed: fatigueFlags >= 3,
      fatigue_count: fatigueFlags,
      current_energy: todayLog?.energy_level || 'Normal',
      recommendation: getRecoveryRecommendation(fatigueFlags, todayLog?.energy_level)
    };
  } catch (error) {
    console.error('Error checking recovery:', error);
    throw error;
  }
};

export const getWorkoutAdjustment = (energyLevel) => {
  const adjustments = {
    'Energized': {
      intensity_multiplier: 1.1,
      volume_multiplier: 1.0,
      recommendation: 'Great energy! You can push a bit harder today.',
      should_adjust: false
    },
    'Normal': {
      intensity_multiplier: 1.0,
      volume_multiplier: 1.0,
      recommendation: 'Normal energy. Stick to your planned workout.',
      should_adjust: false
    },
    'Slightly Fatigued': {
      intensity_multiplier: 0.8,
      volume_multiplier: 0.85,
      recommendation: 'Reduce intensity by 20% and volume by 15%. Focus on form.',
      should_adjust: true,
      swap_to_mobility: false
    },
    'Very Tired': {
      intensity_multiplier: 0.5,
      volume_multiplier: 0.6,
      recommendation: 'Significantly reduce intensity. Consider mobility work or rest.',
      should_adjust: true,
      swap_to_mobility: true
    }
  };

  return adjustments[energyLevel] || adjustments['Normal'];
};

const getRecoveryRecommendation = (fatigueCount, currentEnergy) => {
  if (fatigueCount >= 3) {
    return {
      level: 'critical',
      message: '⚠️ RECOVERY DAY RECOMMENDED: You\'ve had 3+ fatigue flags in the past week. Your body needs rest.',
      action: 'Take a full rest day or do light mobility work only.'
    };
  }
  
  if (currentEnergy === 'Very Tired') {
    return {
      level: 'high',
      message: '😴 HIGH FATIGUE: Swap today\'s workout for mobility/stretching.',
      action: 'Focus on recovery: stretching, foam rolling, light walking.'
    };
  }
  
  if (currentEnergy === 'Slightly Fatigued') {
    return {
      level: 'moderate',
      message: '😌 MODERATE FATIGUE: Reduce workout intensity and volume.',
      action: 'Lower weights by 20%, reduce sets by 1-2, focus on technique.'
    };
  }
  
  return {
    level: 'normal',
    message: '✅ GOOD TO GO: Your energy levels are optimal for training.',
    action: 'Proceed with your planned workout.'
  };
};

export const adjustWorkoutForRecovery = async (userId, workoutPlan, recoveryStatus) => {
  if (!recoveryStatus.recovery_needed && !recoveryStatus.recommendation.should_adjust) {
    return workoutPlan; 
  }

  const adjustment = getWorkoutAdjustment(recoveryStatus.current_energy);
  
  if (recoveryStatus.recovery_needed) {
    return {
      ...workoutPlan,
      adjusted: true,
      adjustment_reason: 'Recovery day enforced due to accumulated fatigue',
      original_workout: workoutPlan.workouts,
      workouts: workoutPlan.workouts.map(day => ({
        ...day,
        rest_day: true,
        type: 'Recovery',
        exercises: [{
          name: 'Light Stretching',
          sets: 1,
          reps: '10 minutes',
          rest_seconds: 0,
          guidance: 'Gentle full-body stretching routine'
        }, {
          name: 'Foam Rolling',
          sets: 1,
          reps: '10 minutes',
          rest_seconds: 0,
          guidance: 'Focus on tight/sore muscle groups'
        }]
      }))
    };
  }

  if (adjustment.should_adjust) {
    return {
      ...workoutPlan,
      adjusted: true,
      adjustment_reason: `Workout adjusted for ${recoveryStatus.current_energy} energy level`,
      intensity_reduction: Math.round((1 - adjustment.intensity_multiplier) * 100),
      volume_reduction: Math.round((1 - adjustment.volume_multiplier) * 100),
      workouts: workoutPlan.workouts.map(day => {
        if (day.rest_day) return day;
        
        if (adjustment.swap_to_mobility) {
          return {
            ...day,
            type: 'Mobility & Recovery',
            exercises: [{
              name: 'Dynamic Stretching',
              sets: 2,
              reps: '10 movements',
              rest_seconds: 30,
              guidance: 'Gentle dynamic stretches for all major muscle groups'
            }, {
              name: 'Yoga Flow',
              sets: 1,
              reps: '15 minutes',
              rest_seconds: 0,
              guidance: 'Light yoga flow focusing on flexibility and breathing'
            }, {
              name: 'Walking',
              sets: 1,
              reps: '20 minutes',
              rest_seconds: 0,
              guidance: 'Easy-pace walk outdoors or on treadmill'
            }]
          };
        }
        
        return {
          ...day,
          exercises: day.exercises.map(ex => ({
            ...ex,
            sets: Math.max(1, Math.round(ex.sets * adjustment.volume_multiplier)),
            reps: typeof ex.reps === 'number' 
              ? Math.max(1, Math.round(ex.reps * adjustment.volume_multiplier))
              : ex.reps,
            rest_seconds: ex.rest_seconds + 15 
          }))
        };
      })
    };
  }

  return workoutPlan;
};

export default {
  checkRecoveryNeeded,
  getWorkoutAdjustment,
  adjustWorkoutForRecovery
};
