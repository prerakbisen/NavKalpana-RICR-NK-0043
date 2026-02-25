import HabitScore from '../models/HabitScore.js';
import ProgressLog from '../models/ProgressLog.js';
import Profile from '../models/Profile.js';
import { generateAICoachingResponse } from './groqService.js';

export const generateAssistantResponse = async (user_id, question) => {
  const profile = await Profile.findOne({ user_id });
  
  if (!profile) {
    return {
      response: 'Please set up your profile first to get personalized advice.',
      confidence: 'Low'
    };
  }
  
  console.log('🔍 Checking Groq API key...');
  console.log('API Key exists:', !!process.env.GROQ_API_KEY);
  
  if (process.env.GROQ_API_KEY && 
      process.env.GROQ_API_KEY !== 'your_groq_api_key_here' && 
      process.env.GROQ_API_KEY.trim() !== '') {
    try {
      console.log(`✅ Groq API key configured! Generating AI coaching response for user ${user_id}...`);
      return await generateAICoachingResponse(user_id, question);
    } catch (error) {
      console.error('❌ Groq AI generation failed, falling back to rule-based:', error.message);
      const recentProgress = await ProgressLog.find({ user_id }).sort({ week_number: -1 }).limit(4);
      const habitScores = await HabitScore.find({ user_id }).sort({ week_number: -1 }).limit(4);
      return generateRuleBasedResponse(profile, recentProgress, habitScores, question);
    }
  } else {
    console.log('⚠️  Using rule-based responses (Groq API not configured)');
    const recentProgress = await ProgressLog.find({ user_id }).sort({ week_number: -1 }).limit(4);
    const habitScores = await HabitScore.find({ user_id }).sort({ week_number: -1 }).limit(4);
    return generateRuleBasedResponse(profile, recentProgress, habitScores, question);
  }
};

const generateRuleBasedResponse = (profile, recentProgress, habitScores, question) => {
  if (recentProgress.length === 0) {
    return {
      response: 'Start tracking your progress consistently. Log weight, workouts, and diet adherence weekly to see patterns and get personalized advice.',
      steps: ['Log weight weekly', 'Track diet adherence', 'Maintain workout consistency'],
      confidence: 'Medium'
    };
  }
  
  const lowerQuestion = question.toLowerCase();
  
  if (lowerQuestion.includes('weight loss') || lowerQuestion.includes('not losing weight') || lowerQuestion.includes('plateau')) {
    return generateWeightLossResponse(profile, recentProgress, habitScores);
  }
  
  if (lowerQuestion.includes('protein') || lowerQuestion.includes('muscle building')) {
    return generateProteinResponse(profile, recentProgress);
  }
  
  if (lowerQuestion.includes('cardio') || lowerQuestion.includes('skip cardio')) {
    return generateCardioResponse(profile, recentProgress);
  }
  
  if (lowerQuestion.includes('tired') || lowerQuestion.includes('fatigue') || lowerQuestion.includes('recovery')) {
    return generateFatigueResponse(profile, recentProgress);
  }
  
  return generateMotivationalResponse(profile, habitScores);
};

const generateWeightLossResponse = (profile, recentProgress, habitScores) => {
  if (!recentProgress || recentProgress.length === 0) {
    return {
      response: 'Start tracking your progress consistently. Log weight, workouts, and diet adherence weekly to see patterns.',
      steps: ['Log weight weekly', 'Track diet adherence', 'Maintain workout consistency'],
      confidence: 'Medium'
    };
  }
  
  const avgDietAdherence = recentProgress.reduce((sum, p) => sum + (p.diet_adherence_percent || 0), 0) / recentProgress.length;
  const avgWorkoutAdherence = recentProgress.reduce((sum, p) => sum + (p.workout_adherence_percent || 0), 0) / recentProgress.length;
  
  if (avgDietAdherence < 60) {
    return {
      response: 'Your diet adherence is below 60%. This is the primary factor in weight loss. Focus on hitting your calorie target consistently.',
      steps: [
        `Your daily target is ${profile.daily_calorie_target} kcal`,
        'Use a food tracking app to monitor calories',
        'Plan meals the night before'
      ],
      confidence: 'High'
    };
  }
  
  if (avgWorkoutAdherence < 60) {
    return {
      response: 'Your workout consistency needs improvement. Even with good diet, you need consistent exercise for sustainable weight loss.',
      steps: [
        'Schedule workouts like appointments',
        'Start with lighter sessions if time is an issue',
        'Track workout completions'
      ],
      confidence: 'High'
    };
  }
  
  return {
    response: 'You\'re doing well with adherence but may need to adjust your calorie target. Consider reducing by 100-200 kcal or adding more cardio.',
    steps: [
      'Try adding 20-30 min of cardio 2x per week',
      'Ensure you\'re at a calorie deficit',
      'Give it 2-3 more weeks before adjusting'
    ],
    disclaimer: 'Consult a nutritionist if plateauing continues',
    confidence: 'Medium'
  };
};

const generateProteinResponse = (profile, recentProgress) => {
  const macros = calculateMacros(profile.daily_calorie_target, profile.goal);
  
  return {
    response: `For your goal of ${profile.goal}, aim for ${macros.protein_grams}g of protein daily.`,
    steps: [
      `That's approximately ${Math.round(macros.protein_grams / 4)}g per meal (4 meals)`,
      'Prioritize protein at each meal',
      'Good sources: chicken, fish, eggs, greek yogurt, legumes'
    ],
    tip: profile.goal === 'Muscle Gain' ? 'Higher protein supports muscle synthesis during training' : 'Protein keeps you full longer',
    confidence: 'High'
  };
};

const generateCardioResponse = (profile, recentProgress) => {
  if (profile.goal === 'Weight Loss') {
    return {
      response: 'For weight loss, cardio is beneficial but not necessary if you maintain a calorie deficit through diet.',
      steps: [
        'Add 20-30 min of cardio 2-3x per week for better results',
        'Can be walking, cycling, swimming, or any moderate activity',
        'Combine with strength training for best fat loss'
      ],
      disclaimer: 'Don\'t rely solely on cardio for fat loss',
      confidence: 'High'
    };
  }
  
  return {
    response: 'For muscle gain, focus on strength training. Light cardio 1-2x per week is fine for heart health.',
    steps: [
      'Keep cardio to 20 min, 1-2x weekly',
      'Don\'t overdo cardio - it can interfere with muscle gains',
      'Prioritize your workout plan'
    ],
    confidence: 'High'
  };
};

const generateFatigueResponse = (profile, recentProgress) => {
  return {
    response: 'Fatigue can come from overtraining, inadequate sleep, or poor nutrition. Let\'s diagnose it.',
    steps: [
      'Ensure you\'re getting 7-9 hours of sleep',
      'Check if you\'re eating enough: your target is ' + profile.daily_calorie_target + ' kcal',
      'Take a full rest day if you\'ve done intense training 6+ days',
      'Consider lighter workouts for 1-2 days'
    ],
    tip: 'Recovery is when your body adapts. Don\'t skip it!',
    confidence: 'Medium'
  };
};

const generateMotivationalResponse = (profile, habitScores) => {
  if (habitScores && habitScores.length > 0) {
    const recentScore = habitScores[0].habit_score;
    
    if (recentScore >= 80) {
      return {
        response: 'Excellent work! Your habit score is ' + recentScore + '/100. Keep up this amazing consistency!',
        steps: ['Maintain your current routine', 'Consider increasing intensity slightly', 'You\'re building lasting habits'],
        confidence: 'High'
      };
    } else if (recentScore >= 60) {
      return {
        response: 'Good progress! Your habit score is ' + recentScore + '/100. A bit more consistency will get you to your goal.',
        steps: ['Focus on one weak area this week', 'Set small daily goals', 'Track your wins'],
        confidence: 'Medium'
      };
    }
  }
  
  return {
    response: 'You\'re on a journey of health transformation. Small consistent actions lead to big results.',
    steps: [
      'Focus on this week\'s plan',
      'Log your progress daily',
      'Celebrate small wins'
    ],
    confidence: 'Medium'
  };
};

// Helper function
const calculateMacros = (daily_calorie_target, goal) => {
  const split = goal === 'Weight Loss' 
    ? { protein: 40, carbs: 30, fat: 30 }
    : { protein: 30, carbs: 50, fat: 20 };
  
  return {
    protein_grams: Math.round((split.protein * daily_calorie_target) / 4),
    carbs_grams: Math.round((split.carbs * daily_calorie_target) / 4),
    fat_grams: Math.round((split.fat * daily_calorie_target) / 9)
  };
};
