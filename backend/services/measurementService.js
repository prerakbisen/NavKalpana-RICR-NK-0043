import BodyMeasurement from '../models/BodyMeasurement.js';
import Profile from '../models/Profile.js';
import DietPlan from '../models/DietPlan.js';
import WorkoutPlanV2 from '../models/WorkoutPlanV2.js';
import Groq from 'groq-sdk';

// Initialize Groq client
const getGroqClient = () => {
  const apiKey = process.env.GROQ_API_KEY || 
                 process.env.GROQ_API_KEY_DIET ||
                 process.env.GROQ_API_KEY_WORKOUT;
  
  if (!apiKey || apiKey.includes('your_groq')) {
    console.warn('⚠️  Groq API key not configured');
    return null;
  }
  
  return new Groq({ apiKey });
};

// Call Groq API
const callGroqAPI = async (prompt, context = 'measurement_analysis') => {
  const client = getGroqClient();
  if (!client) {
    throw new Error('Groq API not configured');
  }

  const completion = await client.chat.completions.create({
    messages: [
      {
        role: "system",
        content: "You are an expert fitness coach analyzing body measurements. Provide detailed, actionable insights."
      },
      {
        role: "user",
        content: prompt
      }
    ],
    model: "llama-3.1-8b-instant",
    temperature: 0.7,
    max_tokens: 1000
  });

  return completion.choices[0]?.message?.content || '';
};

export const saveInitialMeasurements = async (user_id, measurements) => {
  try {
    const profile = await Profile.findOne({ user_id });
    if (!profile) {
      throw new Error('Profile not found');
    }

    // Save to profile's initial_measurements with new field names
    profile.initial_measurements = {
      waist_cm: measurements.waist_cm || null,
      chest_cm: measurements.chest_cm || null,
      hips_cm: measurements.hips_cm || null,
      left_arm_cm: measurements.left_arm_cm || null,
      right_arm_cm: measurements.right_arm_cm || null,
      left_thigh_cm: measurements.left_thigh_cm || null,
      right_thigh_cm: measurements.right_thigh_cm || null,
      measured_at: new Date()
    };
    
    profile.last_measurement_reminder = new Date();
    
    await profile.save();

    const bodyMeasurement = new BodyMeasurement({
      user_id,
      date: new Date(),
      measurements: {
        waist_cm: measurements.waist_cm || null,
        chest_cm: measurements.chest_cm || null,
        hips_cm: measurements.hips_cm || null,
        left_arm_cm: measurements.left_arm_cm || null,
        right_arm_cm: measurements.right_arm_cm || null,
        left_thigh_cm: measurements.left_thigh_cm || null,
        right_thigh_cm: measurements.right_thigh_cm || null
      },
      notes: 'Initial measurements'
    });

    await bodyMeasurement.save();

    return {
      profile_measurements: profile.initial_measurements,
      body_measurement: bodyMeasurement
    };
  } catch (error) {
    throw new Error(`Failed to save initial measurements: ${error.message}`);
  }
};

export const addMeasurement = async (user_id, measurements, notes = '') => {
  try {
    const bodyMeasurement = new BodyMeasurement({
      user_id,
      date: new Date(),
      measurements,
      notes
    });

    await bodyMeasurement.save();

    await Profile.findOneAndUpdate(
      { user_id },
      { last_measurement_reminder: new Date() }
    );

    return bodyMeasurement;
  } catch (error) {
    throw new Error(`Failed to add measurement: ${error.message}`);
  }
};

export const getAllMeasurements = async (user_id) => {
  try {
    const measurements = await BodyMeasurement.find({ user_id }).sort({ date: 1 });
    return measurements;
  } catch (error) {
    throw new Error(`Failed to get measurements: ${error.message}`);
  }
};

export const getLatestMeasurement = async (user_id) => {
  try {
    const measurement = await BodyMeasurement.findOne({ user_id }).sort({ date: -1 });
    return measurement;
  } catch (error) {
    throw new Error(`Failed to get latest measurement: ${error.message}`);
  }
};

export const checkMeasurementReminder = async (user_id) => {
  try {
    const profile = await Profile.findOne({ user_id });
    if (!profile) {
      console.log('⚠️ No profile found for user');
      return { reminder_due: false, days_until_next: 28 };
    }

    // Determine the last measurement date
    let lastMeasurementDate = profile.last_measurement_reminder;
    
    // If no last_measurement_reminder, use initial_measurements.measured_at
    if (!lastMeasurementDate && profile.initial_measurements?.measured_at) {
      lastMeasurementDate = profile.initial_measurements.measured_at;
    }
    
    // If still no date, return default
    if (!lastMeasurementDate) {
      console.log('⚠️ No measurement date found, returning default');
      return { 
        reminder_due: false, 
        days_until_next: 28,
        last_measurement_date: null,
        next_due_date: null
      };
    }

    const MEASUREMENT_REMINDER_DAYS = 28; // 4 weeks
    const daysSinceLastMeasurement = Math.floor(
      (Date.now() - new Date(lastMeasurementDate)) / (1000 * 60 * 60 * 24)
    );
    const daysUntilNext = Math.max(0, MEASUREMENT_REMINDER_DAYS - daysSinceLastMeasurement);
    const reminderDue = daysSinceLastMeasurement >= MEASUREMENT_REMINDER_DAYS;
    
    const nextDueDate = new Date(lastMeasurementDate);
    nextDueDate.setDate(nextDueDate.getDate() + MEASUREMENT_REMINDER_DAYS);

    console.log('📊 Measurement Reminder Check:', {
      lastMeasurementDate,
      daysSinceLastMeasurement,
      daysUntilNext,
      reminderDue
    });

    return {
      reminder_due: reminderDue,
      days_until_next: daysUntilNext,
      last_measurement_date: lastMeasurementDate,
      next_due_date: nextDueDate
    };
  } catch (error) {
    console.error('❌ Error checking measurement reminder:', error);
    throw new Error(`Failed to check measurement reminder: ${error.message}`);
  }
};

export const compareMeasurements = async (user_id) => {
  try {
    const profile = await Profile.findOne({ user_id });
    if (!profile || !profile.initial_measurements) {
      return null;
    }

    const latestMeasurement = await getLatestMeasurement(user_id);
    if (!latestMeasurement) {
      return null;
    }

    const initial = profile.initial_measurements;
    const current = latestMeasurement.measurements;

    const changes = {
      waist_change: current.waist_cm ? (current.waist_cm - (initial.waist_cm || 0)).toFixed(1) : null,
      chest_change: current.chest_cm ? (current.chest_cm - (initial.chest_cm || 0)).toFixed(1) : null,
      hips_change: current.hips_cm ? (current.hips_cm - (initial.hips_cm || 0)).toFixed(1) : null,
      arms_change: current.left_arm_cm ? (current.left_arm_cm - (initial.arms_cm || 0)).toFixed(1) : null,
      thighs_change: current.left_thigh_cm ? (current.left_thigh_cm - (initial.thighs_cm || 0)).toFixed(1) : null
    };

    const analysis = analyzeMeasurementProgress(profile.goal, changes);

    return {
      initial_measurements: initial,
      current_measurements: current,
      changes,
      analysis,
      measurement_date: latestMeasurement.date
    };
  } catch (error) {
    throw new Error(`Failed to compare measurements: ${error.message}`);
  }
};

const analyzeMeasurementProgress = (goal, changes) => {
  const analysis = {
    overall_progress: 'neutral',
    recommendations: [],
    positive_indicators: [],
    concerns: []
  };

  if (goal === 'Weight Loss') {
    if (changes.waist_change && parseFloat(changes.waist_change) < -2) {
      analysis.positive_indicators.push('Significant waist reduction - excellent progress!');
    } else if (changes.waist_change && parseFloat(changes.waist_change) > 0) {
      analysis.concerns.push('Waist measurement increased - may need diet adjustment');
    }

    if (changes.hips_change && parseFloat(changes.hips_change) < -2) {
      analysis.positive_indicators.push('Hip measurement decreased - good fat loss');
    }

    analysis.overall_progress = analysis.positive_indicators.length > analysis.concerns.length ? 'good' : 'needs_improvement';
    
  } else if (goal === 'Muscle Gain') {
    if (changes.chest_change && parseFloat(changes.chest_change) > 2) {
      analysis.positive_indicators.push('Chest measurement increased - muscle growth detected!');
    }
    
    if (changes.arms_change && parseFloat(changes.arms_change) > 1) {
      analysis.positive_indicators.push('Arm measurement increased - good muscle development');
    }

    if (changes.thighs_change && parseFloat(changes.thighs_change) > 2) {
      analysis.positive_indicators.push('Leg muscles growing - excellent lower body progress');
    }

    if (changes.waist_change && parseFloat(changes.waist_change) > 3) {
      analysis.concerns.push('Waist increased significantly - may be gaining excess fat');
    }

    analysis.overall_progress = analysis.positive_indicators.length >= 2 ? 'excellent' : 'moderate';
    
  } else if (goal === 'Maintenance') {
    const allChanges = Object.values(changes).filter(c => c !== null).map(c => Math.abs(parseFloat(c)));
    const avgChange = allChanges.reduce((a, b) => a + b, 0) / allChanges.length;

    if (avgChange < 1) {
      analysis.positive_indicators.push('Measurements stable - excellent maintenance!');
      analysis.overall_progress = 'excellent';
    } else if (avgChange > 2) {
      analysis.concerns.push('Significant measurement changes - may need plan adjustment');
      analysis.overall_progress = 'needs_adjustment';
    }
  }

  if (analysis.concerns.length > 0) {
    analysis.recommendations.push('Consider regenerating your workout and diet plans');
    analysis.recommendations.push('Consult with AI coach for personalized adjustments');
  } else if (analysis.positive_indicators.length > 0) {
    analysis.recommendations.push('Keep up the excellent work!');
    analysis.recommendations.push('Continue with current plan for another 4 weeks');
  }

  return analysis;
};

export const getMeasurementHistory = async (user_id) => {
  try {
    const measurements = await BodyMeasurement.find({ user_id }).sort({ date: 1 });
    
    const history = measurements.map(m => ({
      date: m.date,
      waist: m.measurements.waist_cm,
      chest: m.measurements.chest_cm,
      hips: m.measurements.hips_cm,
      arms: (m.measurements.left_arm_cm + m.measurements.right_arm_cm) / 2,
      thighs: (m.measurements.left_thigh_cm + m.measurements.right_thigh_cm) / 2
    }));

    return history;
  } catch (error) {
    throw new Error(`Failed to get measurement history: ${error.message}`);
  }
};

export default {
  saveInitialMeasurements,
  addMeasurement,
  getAllMeasurements,
  getLatestMeasurement,
  checkMeasurementReminder,
  compareMeasurements,
  getMeasurementHistory
};


// AI-Powered Measurement Analysis with Plan Adjustment
export const analyzeMeasurementsWithAI = async (user_id) => {
  try {
    console.log(`🤖 Starting AI measurement analysis for user ${user_id}`);
    
    const profile = await Profile.findOne({ user_id });
    if (!profile || !profile.initial_measurements) {
      throw new Error('No initial measurements found');
    }

    const latestMeasurement = await getLatestMeasurement(user_id);
    if (!latestMeasurement) {
      throw new Error('No current measurements found');
    }

    const initial = profile.initial_measurements;
    const current = latestMeasurement.measurements;

    // Calculate all changes
    const changes = {
      waist: current.waist_cm - (initial.waist_cm || 0),
      chest: current.chest_cm - (initial.chest_cm || 0),
      hips: current.hips_cm - (initial.hips_cm || 0),
      left_arm: current.left_arm_cm - (initial.left_arm_cm || 0),
      right_arm: current.right_arm_cm - (initial.right_arm_cm || 0),
      left_thigh: current.left_thigh_cm - (initial.left_thigh_cm || 0),
      right_thigh: current.right_thigh_cm - (initial.right_thigh_cm || 0)
    };

    // Build AI prompt
    const prompt = `Analyze these body measurement changes for a ${profile.age}-year-old ${profile.gender} with goal: ${profile.goal}

INITIAL MEASUREMENTS (4 weeks ago):
- Waist: ${initial.waist_cm}cm
- Chest: ${initial.chest_cm}cm
- Hips: ${initial.hips_cm}cm
- Arms: ${initial.left_arm_cm}cm / ${initial.right_arm_cm}cm
- Thighs: ${initial.left_thigh_cm}cm / ${initial.right_thigh_cm}cm

CURRENT MEASUREMENTS:
- Waist: ${current.waist_cm}cm (${changes.waist >= 0 ? '+' : ''}${changes.waist.toFixed(1)}cm)
- Chest: ${current.chest_cm}cm (${changes.chest >= 0 ? '+' : ''}${changes.chest.toFixed(1)}cm)
- Hips: ${current.hips_cm}cm (${changes.hips >= 0 ? '+' : ''}${changes.hips.toFixed(1)}cm)
- Arms: ${current.left_arm_cm}cm / ${current.right_arm_cm}cm (${changes.left_arm >= 0 ? '+' : ''}${changes.left_arm.toFixed(1)}cm)
- Thighs: ${current.left_thigh_cm}cm / ${current.right_thigh_cm}cm (${changes.left_thigh >= 0 ? '+' : ''}${changes.left_thigh.toFixed(1)}cm)

USER PROFILE:
- Goal: ${profile.goal}
- Activity Level: ${profile.activity_level}
- Fitness Level: ${profile.fitness_level}
- Current Weight: ${profile.weight_kg}kg
- Target Weight: ${profile.target_weight_kg}kg

Provide a detailed analysis including:
1. Overall progress assessment (excellent/good/moderate/poor)
2. Specific insights about each measurement change
3. Whether diet plan needs adjustment (yes/no with reason)
4. Whether workout plan needs adjustment (yes/no with reason)
5. Specific recommendations for next 4 weeks

Format your response as:
PROGRESS: [excellent/good/moderate/poor]
INSIGHTS: [detailed analysis]
DIET_ADJUSTMENT: [yes/no] - [reason]
WORKOUT_ADJUSTMENT: [yes/no] - [reason]
RECOMMENDATIONS: [specific actionable recommendations]`;

    console.log('📤 Sending prompt to AI...');
    const aiResponse = await callGroqAPI(prompt, 'measurement_analysis');
    console.log('📥 AI response received');

    // Parse AI response
    const analysis = parseAIAnalysis(aiResponse, changes, profile.goal);
    
    // Determine if plans need regeneration
    const needsDietAdjustment = analysis.diet_adjustment_needed;
    const needsWorkoutAdjustment = analysis.workout_adjustment_needed;

    console.log(`📊 Analysis complete - Diet adjustment: ${needsDietAdjustment}, Workout adjustment: ${needsWorkoutAdjustment}`);

    return {
      changes,
      analysis,
      needs_diet_adjustment: needsDietAdjustment,
      needs_workout_adjustment: needsWorkoutAdjustment,
      ai_response: aiResponse
    };

  } catch (error) {
    console.error('❌ AI analysis error:', error);
    
    // Fallback to rule-based analysis
    return await compareMeasurements(user_id);
  }
};

// Parse AI response into structured format
const parseAIAnalysis = (aiResponse, changes, goal) => {
  const analysis = {
    progress_level: 'moderate',
    insights: [],
    diet_adjustment_needed: false,
    diet_adjustment_reason: '',
    workout_adjustment_needed: false,
    workout_adjustment_reason: '',
    recommendations: [],
    raw_response: aiResponse
  };

  try {
    // Extract progress level
    const progressMatch = aiResponse.match(/PROGRESS:\s*(excellent|good|moderate|poor)/i);
    if (progressMatch) {
      analysis.progress_level = progressMatch[1].toLowerCase();
    }

    // Extract insights
    const insightsMatch = aiResponse.match(/INSIGHTS:\s*([^\n]+(?:\n(?!DIET_ADJUSTMENT|WORKOUT_ADJUSTMENT|RECOMMENDATIONS)[^\n]+)*)/i);
    if (insightsMatch) {
      analysis.insights = insightsMatch[1].trim().split('\n').filter(line => line.trim());
    }

    // Extract diet adjustment
    const dietMatch = aiResponse.match(/DIET_ADJUSTMENT:\s*(yes|no)\s*-\s*([^\n]+)/i);
    if (dietMatch) {
      analysis.diet_adjustment_needed = dietMatch[1].toLowerCase() === 'yes';
      analysis.diet_adjustment_reason = dietMatch[2].trim();
    }

    // Extract workout adjustment
    const workoutMatch = aiResponse.match(/WORKOUT_ADJUSTMENT:\s*(yes|no)\s*-\s*([^\n]+)/i);
    if (workoutMatch) {
      analysis.workout_adjustment_needed = workoutMatch[1].toLowerCase() === 'yes';
      analysis.workout_adjustment_reason = workoutMatch[2].trim();
    }

    // Extract recommendations
    const recsMatch = aiResponse.match(/RECOMMENDATIONS:\s*([^\n]+(?:\n(?!$)[^\n]+)*)/i);
    if (recsMatch) {
      analysis.recommendations = recsMatch[1].trim().split('\n').filter(line => line.trim());
    }

    // Fallback logic if parsing fails
    if (analysis.insights.length === 0) {
      analysis.insights = [aiResponse.substring(0, 500)];
    }

  } catch (error) {
    console.error('Error parsing AI response:', error);
    analysis.insights = ['Analysis completed. Review your measurements for progress.'];
  }

  return analysis;
};

// Regenerate plans based on measurement analysis
export const regeneratePlansBasedOnMeasurements = async (user_id, analysis) => {
  try {
    console.log(`🔄 Regenerating plans for user ${user_id}`);
    
    const results = {
      diet_regenerated: false,
      workout_regenerated: false,
      messages: []
    };

    // Regenerate diet plan if needed
    if (analysis.needs_diet_adjustment) {
      try {
        const latestDiet = await DietPlan.findOne({ user_id }).sort({ created_at: -1 });
        const newWeekNumber = latestDiet ? latestDiet.week_number + 1 : 1;
        
        // Import diet service dynamically to avoid circular dependency
        const { generateDietPlan } = await import('./dietService.js');
        await generateDietPlan(user_id, newWeekNumber);
        
        results.diet_regenerated = true;
        results.messages.push(`Diet plan regenerated (Week ${newWeekNumber}): ${analysis.analysis.diet_adjustment_reason}`);
        console.log('✅ Diet plan regenerated');
      } catch (error) {
        console.error('❌ Failed to regenerate diet plan:', error);
        results.messages.push('Failed to regenerate diet plan. Please generate manually.');
      }
    }

    // Regenerate workout plan if needed
    if (analysis.needs_workout_adjustment) {
      try {
        const latestWorkout = await WorkoutPlanV2.findOne({ user_id }).sort({ created_at: -1 });
        const newWeekNumber = latestWorkout ? latestWorkout.week_number + 1 : 1;
        
        // Import workout service dynamically
        const { generateWorkoutPlan } = await import('./workoutService.js');
        await generateWorkoutPlan(user_id, newWeekNumber);
        
        results.workout_regenerated = true;
        results.messages.push(`Workout plan regenerated (Week ${newWeekNumber}): ${analysis.analysis.workout_adjustment_reason}`);
        console.log('✅ Workout plan regenerated');
      } catch (error) {
        console.error('❌ Failed to regenerate workout plan:', error);
        results.messages.push('Failed to regenerate workout plan. Please generate manually.');
      }
    }

    if (!results.diet_regenerated && !results.workout_regenerated) {
      results.messages.push('No plan adjustments needed. Continue with current plans.');
    }

    return results;

  } catch (error) {
    console.error('❌ Error regenerating plans:', error);
    throw error;
  }
};
