import Groq from 'groq-sdk';
import { gatherCompleteUserContext, formatUserContextForAI } from './userContextService.js';

/**
 * Multi-API Key Management System
 * Distributes load across different Groq API keys for different features
 * Prevents rate limiting and improves reliability
 */

// API Key Types
const API_KEY_TYPES = {
  WORKOUT: 'WORKOUT',
  DIET: 'DIET',
  ASSISTANT: 'ASSISTANT',
  PLAN_ADJUSTMENT: 'PLAN_ADJUSTMENT',
  FALLBACK: 'FALLBACK'
};

// Groq client instances (lazy initialization)
const groqClients = {
  [API_KEY_TYPES.WORKOUT]: null,
  [API_KEY_TYPES.DIET]: null,
  [API_KEY_TYPES.ASSISTANT]: null,
  [API_KEY_TYPES.PLAN_ADJUSTMENT]: null,
  [API_KEY_TYPES.FALLBACK]: null
};

// API key usage statistics (for monitoring)
const apiKeyStats = {
  [API_KEY_TYPES.WORKOUT]: { calls: 0, errors: 0, lastUsed: null },
  [API_KEY_TYPES.DIET]: { calls: 0, errors: 0, lastUsed: null },
  [API_KEY_TYPES.ASSISTANT]: { calls: 0, errors: 0, lastUsed: null },
  [API_KEY_TYPES.PLAN_ADJUSTMENT]: { calls: 0, errors: 0, lastUsed: null },
  [API_KEY_TYPES.FALLBACK]: { calls: 0, errors: 0, lastUsed: null }
};

/**
 * Get API key for specific feature type
 */
const getApiKeyForType = (type) => {
  const keyMap = {
    [API_KEY_TYPES.WORKOUT]: process.env.GROQ_API_KEY_WORKOUT,
    [API_KEY_TYPES.DIET]: process.env.GROQ_API_KEY_DIET,
    [API_KEY_TYPES.ASSISTANT]: process.env.GROQ_API_KEY_ASSISTANT,
    [API_KEY_TYPES.PLAN_ADJUSTMENT]: process.env.GROQ_API_KEY_PLAN_ADJUSTMENT,
    [API_KEY_TYPES.FALLBACK]: process.env.GROQ_API_KEY
  };
  
  const key = keyMap[type];
  
  // Check if key is valid
  if (key && key !== 'your_groq_api_key_here' && key !== 'your_groq_api_key_for_workout_here' 
      && key !== 'your_groq_api_key_for_diet_here' && key !== 'your_groq_api_key_for_assistant_here'
      && key !== 'your_groq_api_key_for_plan_adjustment_here') {
    return key;
  }
  
  return null;
};

/**
 * Get Groq client for specific feature type with automatic fallback
 */
const getGroqClient = (type = API_KEY_TYPES.FALLBACK) => {
  // Try to get dedicated key for this type
  let apiKey = getApiKeyForType(type);
  let actualType = type;
  
  // If dedicated key not available, try fallback
  if (!apiKey && type !== API_KEY_TYPES.FALLBACK) {
    console.log(`⚠️  Dedicated API key for ${type} not found, using fallback key`);
    apiKey = getApiKeyForType(API_KEY_TYPES.FALLBACK);
    actualType = API_KEY_TYPES.FALLBACK;
  }
  
  // If no key available at all
  if (!apiKey) {
    console.log('❌ No Groq API key available');
    return null;
  }
  
  // Create client if not exists
  if (!groqClients[actualType]) {
    groqClients[actualType] = new Groq({ apiKey });
    console.log(`✅ Groq client initialized for ${actualType}`);
  }
  
  // Update stats
  apiKeyStats[actualType].calls++;
  apiKeyStats[actualType].lastUsed = new Date();
  
  return groqClients[actualType];
};

/**
 * Check if AI is available for specific feature type
 */
const isAIAvailable = (type = API_KEY_TYPES.FALLBACK) => {
  const apiKey = getApiKeyForType(type);
  if (apiKey) return true;
  
  // Check fallback
  if (type !== API_KEY_TYPES.FALLBACK) {
    return getApiKeyForType(API_KEY_TYPES.FALLBACK) !== null;
  }
  
  return false;
};

/**
 * Get API usage statistics (for monitoring and debugging)
 */
export const getApiKeyStats = () => {
  return {
    stats: apiKeyStats,
    availableKeys: {
      workout: !!getApiKeyForType(API_KEY_TYPES.WORKOUT),
      diet: !!getApiKeyForType(API_KEY_TYPES.DIET),
      assistant: !!getApiKeyForType(API_KEY_TYPES.ASSISTANT),
      planAdjustment: !!getApiKeyForType(API_KEY_TYPES.PLAN_ADJUSTMENT),
      fallback: !!getApiKeyForType(API_KEY_TYPES.FALLBACK)
    }
  };
};

/**
 * Extract and parse JSON from AI response
 * Handles common issues like markdown code blocks, trailing commas, etc.
 */
const extractAndParseJSON = (text) => {
  let cleanText = text.trim();
  cleanText = cleanText.replace(/```json\n?/gi, '').replace(/```\n?/g, '');
  cleanText = cleanText.trim();
  
  const firstBrace = cleanText.indexOf('{');
  const lastBrace = cleanText.lastIndexOf('}');
  
  if (firstBrace === -1 || lastBrace === -1) {
    throw new Error('No JSON object found in response');
  }
  
  cleanText = cleanText.substring(firstBrace, lastBrace + 1);
  
  try {
    return JSON.parse(cleanText);
  } catch (error) {
    cleanText = cleanText.replace(/,(\s*[}\]])/g, '$1');
    
    try {
      return JSON.parse(cleanText);
    } catch (secondError) {
      console.error('Failed to parse JSON after cleanup:');
      console.error('Error:', secondError.message);
      console.error('JSON (first 1000 chars):', cleanText.substring(0, 1000));
      throw new Error('Invalid JSON in AI response');
    }
  }
};

export const generateAIWorkoutPlan = async (user_id, weekNumber) => {
  const userContext = await gatherCompleteUserContext(user_id);
  if (!userContext) {
    throw new Error('User profile not found');
  }

  const contextPrompt = formatUserContextForAI(userContext);
  
  const prompt = `${contextPrompt}

=== TASK ===
You are an expert fitness coach with complete knowledge of this user's history. Generate a personalized weekly workout plan for Week ${weekNumber}.

ANALYZE THE USER'S DATA:
1. Look at their progress trend - are they improving or plateauing?
2. Check their adherence rates - do they need easier or harder workouts?
3. Review their fatigue levels - do they need more recovery?
4. Consider their goal and current progress toward it
5. Account for their experience level and training days per week: ${userContext.profile.training_days_per_week || userContext.profile.available_days_per_week || 4} days
6. CRITICAL: Check INJURIES/LIMITATIONS - AVOID exercises that could aggravate: ${userContext.profile.injuries_limitations || 'None'}
7. IMPORTANT: Check their GOAL TIMELINE - they need to reach their target in ${userContext.timeline ? userContext.timeline.timeline.optimal_weeks + ' weeks' : 'their planned timeframe'}
8. Adjust workout intensity to match their timeline - if behind schedule, increase intensity; if ahead, maintain current pace

=== PROGRESSIVE ADAPTATION RULES ===
${userContext.workout_history && userContext.workout_history.length > 0 ? `
PREVIOUS WORKOUT ANALYSIS:
${userContext.workout_history.slice(-2).map(w => `
Week ${w.week}: Used ${w.exercises_used.length} exercises including: ${w.exercises_used.slice(0, 5).map(e => `${e.name} (${e.sets}x${e.reps})`).join(', ')}
`).join('')}

CRITICAL PROGRESSION REQUIREMENTS FOR WEEK ${weekNumber}:

1. EXERCISE VARIETY (MANDATORY - 40-50% NEW EXERCISES):
   - You MUST change at least 5-6 exercises from the previous week
   - Keep only 2-3 core compound movements (e.g., Bench Press, Squats, Deadlifts)
   - Replace other exercises with variations:
     * If Week 1 had "Barbell Bench Press", try "Dumbbell Bench Press" or "Push-ups"
     * If Week 1 had "Barbell Rows", try "Dumbbell Rows" or "Cable Rows"
     * If Week 1 had "Squats", try "Goblet Squats", "Bulgarian Split Squats", or "Leg Press"
     * If Week 1 had "Tricep Pushdown", try "Overhead Tricep Extension" or "Dips"
   - Rotate equipment: Barbell → Dumbbell → Cable → Bodyweight → Machines
   
2. VOLUME PROGRESSION (if adherence ≥ 80%):
   - Increase reps by 2-3 per set (e.g., 8-10 → 10-12 → 12-15)
   - OR add 1 more set to key exercises (e.g., 3 sets → 4 sets)
   - Example: Week 1 had "3x8-10", Week 2 should have "3x10-12" or "4x8-10"
   
3. INTENSITY PROGRESSION:
   - For Weight Loss: Increase reps to 12-15 range, reduce rest time by 10-15 seconds
   - For Muscle Gain: Keep reps in 6-10 range, suggest heavier weights in guidance
   - For Body Recomposition: Mix of 6-8 reps (strength) and 10-12 reps (hypertrophy)
   - For Endurance: Increase reps to 15-20, add circuit-style training
   
4. SMART SUBSTITUTIONS (EXAMPLES):
   - Chest: Barbell Bench → Dumbbell Bench → Cable Flyes → Push-ups
   - Back: Barbell Rows → Dumbbell Rows → Cable Rows → Pull-ups
   - Legs: Barbell Squats → Goblet Squats → Bulgarian Split Squats → Leg Press
   - Shoulders: Overhead Press → Dumbbell Shoulder Press → Lateral Raises → Face Pulls
   - Arms: Barbell Curls → Dumbbell Curls → Hammer Curls → Cable Curls
   
5. GOAL-SPECIFIC ADAPTATIONS:
   - Weight Loss: More compound movements, shorter rest (60s), higher reps (12-15)
   - Muscle Gain: Progressive overload focus, moderate reps (6-10), longer rest (90-120s)
   - Body Recomposition: Mix of strength (6-8 reps) and hypertrophy (10-12 reps)
   - Endurance: Higher reps (15-20), circuit-style training, minimal rest (30-45s)

REMEMBER: You MUST introduce at least 40-50% new exercises while keeping 2-3 core movements. This is essential for preventing plateaus and keeping workouts engaging.
` : `
This is Week ${weekNumber}. Create a foundational workout plan appropriate for their goal and experience level.
`}

Generate a workout plan with EXACTLY ${userContext.profile.training_days_per_week || userContext.profile.available_days_per_week || 4} training days and rest days for remaining days.

Generate a workout plan in JSON format with this EXACT structure:
{
  "week_summary": "Personalized overview referencing their specific data and progress",
  "weekly_schedule": [
    {
      "day": 1,
      "day_name": "Monday",
      "type": "Push/Pull/Legs/Full Body/Rest",
      "rest_day": false,
      "exercises": [
        {
          "name": "Exercise name",
          "sets": 3,
          "reps": "8-10",
          "rest_seconds": 90,
          "guidance": "Specific form tips and why this helps THEIR goal",
          "intensity_level": "Light/Moderate/High"
        }
      ]
    }
  ],
  "progression_notes": "How to progress based on THEIR actual performance",
  "recovery_tips": "Personalized recovery advice based on THEIR energy levels",
  "motivation_message": "Encouraging message referencing THEIR specific achievements"
}

IMPORTANT:
- Return ONLY valid JSON, no markdown or extra text
- Reference their actual statistics in your recommendations
- Adapt based on their adherence patterns
- Progress them appropriately based on their experience`;

  try {
    const groqClient = getGroqClient(API_KEY_TYPES.WORKOUT);
    if (!groqClient) {
      throw new Error('Groq client not available for workout generation');
    }
    
    console.log(`🏋️ Using dedicated WORKOUT API key for user ${user_id}, week ${weekNumber}`);
    
    const completion = await groqClient.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are an expert fitness coach. Always respond with valid JSON only, no markdown."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      model: "llama-3.1-8b-instant", 
      temperature: 0.7,
      max_tokens: 2000
    });

    const text = completion.choices[0]?.message?.content || '';
    
    try {
      const parsedData = extractAndParseJSON(text);
      return parsedData;
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError.message);
      console.error('Raw response (first 500 chars):', text.substring(0, 500));
      apiKeyStats[API_KEY_TYPES.WORKOUT].errors++;
      throw new Error('Failed to generate AI workout plan');
    }
  } catch (error) {
    console.error('Groq API Error:', error);
    apiKeyStats[API_KEY_TYPES.WORKOUT].errors++;
    throw new Error('Failed to generate AI workout plan');
  }
};

export const generateAIDietPlan = async (user_id, weekNumber) => {
  const userContext = await gatherCompleteUserContext(user_id);
  if (!userContext) {
    throw new Error('User profile not found');
  }

  const contextPrompt = formatUserContextForAI(userContext);
  
  const prompt = `${contextPrompt}

=== TASK ===
You are an expert nutritionist with complete knowledge of this user's history. Generate a personalized daily meal plan for Week ${weekNumber}.

ANALYZE THE USER'S DATA:
1. Look at their weight progress - is their calorie target working?
2. Check their diet adherence - do they need simpler meals?
3. Review their energy levels - do they need more carbs or different timing?
4. CRITICAL: Dietary Preference - ${userContext.profile.dietary_preferences || 'No restrictions'} - ONLY include foods matching this preference
5. CRITICAL: Food Allergies - COMPLETELY AVOID: ${userContext.profile.allergies || 'None'}
6. Account for their goal and progress toward it
7. IMPORTANT: Check their GOAL TIMELINE - they need to reach ${userContext.profile.target_weight_kg}kg in ${userContext.timeline ? userContext.timeline.timeline.optimal_weeks + ' weeks' : 'their planned timeframe'}
8. Adjust calorie target if they're behind or ahead of schedule based on their actual weekly rate

=== INDIAN FOOD FOCUS ===
CRITICAL: This meal plan MUST prioritize authentic Indian cuisine. Use these guidelines:

BREAKFAST OPTIONS (Choose from):
- Poha (flattened rice) with vegetables and peanuts
- Upma (semolina) with vegetables
- Idli with sambar and coconut chutney
- Dosa (plain/masala) with sambar
- Paratha (whole wheat) with curd/pickle
- Daliya (broken wheat) porridge
- Besan chilla (gram flour pancake)
- Vegetable sandwich with mint chutney

LUNCH OPTIONS (Must include):
- Dal (Moong/Masoor/Toor/Chana) - ESSENTIAL
- Rice (brown/white based on goal)
- 2 Chapati/Roti (whole wheat)
- Sabzi (seasonal vegetable curry)
- Raita (yogurt with cucumber/boondi)
- Salad (cucumber, tomato, onion, carrot)

DINNER OPTIONS (Must include):
- Dal or Rajma/Chole (protein source)
- 2-3 Chapati/Roti
- Sabzi (different from lunch)
- Salad
- Optional: Small portion of rice

SNACKS (Choose from):
- Roasted chana (chickpeas)
- Makhana (fox nuts)
- Sprouts chaat
- Fruit with chaat masala
- Buttermilk (chaas)
- Roasted peanuts
- Cucumber/carrot sticks with hummus
- Handful of almonds/walnuts

COMMON INDIAN VEGETABLES TO USE:
- Bhindi (okra), Baingan (eggplant), Aloo (potato), Gobi (cauliflower)
- Palak (spinach), Methi (fenugreek), Lauki (bottle gourd)
- Tinda, Tori (ridge gourd), Karela (bitter gourd)
- Beans, Peas, Capsicum, Tomatoes

PROTEIN SOURCES (Vegetarian):
- Dal (all types), Rajma, Chole, Paneer
- Soya chunks, Tofu, Sprouts
- Curd/Dahi, Buttermilk
- Eggs (if not pure vegetarian)

COOKING METHODS:
- Minimize oil (1-2 tsp per meal)
- Use tadka (tempering) for flavor
- Prefer steaming, boiling, roasting
- Use Indian spices: turmeric, cumin, coriander, garam masala

Generate a meal plan in JSON format with this EXACT structure:
{
  "week_summary": "Personalized nutrition overview referencing their specific progress",
  "daily_meals": [
    {
      "meal_number": 1,
      "meal_name": "Breakfast",
      "time_suggestion": "7:00 AM",
      "description": "Detailed INDIAN meal with specific portions for THEIR calorie target",
      "estimated_calories": 500,
      "macros": {
        "protein_g": 30,
        "carbs_g": 50,
        "fat_g": 15
      },
      "ingredients": ["specific Indian ingredient with amount in grams/cups"],
      "preparation_tips": "Easy prep instructions using Indian cooking methods",
      "why_this_meal": "Explain how this helps THEIR specific goal"
    }
  ],
  "hydration_goal": "Specific water intake for their weight",
  "supplement_suggestions": "Based on THEIR diet and goals",
  "meal_prep_tips": "Practical tips for THEIR lifestyle with Indian cooking context",
  "adjustment_notes": "How to adjust based on THEIR progress"
}

IMPORTANT:
- Return ONLY valid JSON, no markdown or extra text
- Total calories should match their target: ${userContext.profile.daily_calorie_target} kcal
- ALL meals MUST be Indian cuisine (Dal, Rice, Chapati, Sabzi, etc.)
- Use Indian measurements and cooking terms
- Reference their actual weight progress in recommendations
- Ensure meals are practical and commonly available in India`;

  try {
    const groqClient = getGroqClient(API_KEY_TYPES.DIET);
    if (!groqClient) {
      throw new Error('Groq client not available for diet generation');
    }
    
    console.log(`🍽️ Using dedicated DIET API key for user ${user_id}, week ${weekNumber}`);
    
    const completion = await groqClient.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are an expert nutritionist. Always respond with valid JSON only, no markdown."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      model: "llama-3.1-8b-instant", 
      temperature: 0.7,
      max_tokens: 1500
    });

    const text = completion.choices[0]?.message?.content || '';
    
    try {
      const parsedData = extractAndParseJSON(text);
      return parsedData;
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError.message);
      console.error('Raw response (first 500 chars):', text.substring(0, 500));
      apiKeyStats[API_KEY_TYPES.DIET].errors++;
      throw new Error('Failed to generate AI diet plan');
    }
  } catch (error) {
    console.error('Groq API Error:', error);
    apiKeyStats[API_KEY_TYPES.DIET].errors++;
    throw new Error('Failed to generate AI diet plan');
  }
};

export const generateAICoachingResponse = async (user_id, question) => {
  const userContext = await gatherCompleteUserContext(user_id);
  if (!userContext) {
    return {
      response: 'Please complete your profile setup first to get personalized advice.',
      confidence: 'Low'
    };
  }

  // No manual keyword filtering; relevancy will be determined by the AI prompt below.

  const contextPrompt = formatUserContextForAI(userContext);
  
  const prompt = `${contextPrompt}

=== USER QUESTION ===
"${question}"

You are a knowledgeable fitness and nutrition coach. Analyze the question above and decide whether it is related to health, workouts, diet, or progress.

- If the user only greets ("hi", "hello", "hey", etc.) without any other intent, respond with a friendly greeting JSON such as:
  {"response":"Hi there! I'm your AI Fitness Coach – ask me any question about workouts, diet, or your progress.","confidence":"High"}
  (this is considered on-topic and should still be valid JSON)

- If the question is unrelated or clearly off-topic, reply with exactly this JSON and nothing else:
  {"response":"Sorry, I can't help with that. I'm your FitAI fitness assistant and can only answer questions related to your health, workouts, diet, and progress.","confidence":"High"}

- If the question is on-topic and not merely a greeting, provide personalized advice using the format described below. Always return valid JSON only, with no extraneous text. The JSON structure should match the one used elsewhere in this file (greeting, steps array, tip, data_insights, confidence), and you may reference userContext fields for specifics.

IMPORTANT INSTRUCTIONS FOR ON-TOPIC QUESTIONS:
- Address the user by name.
- Use their actual stats: age, weight, goal, adherence rates, etc.
- If asked about their name/email/age/weight/goal, give accurate responses.

RESPONSE FORMAT FOR FITNESS QUESTIONS:
{
  "response": "Hi ${userContext.user.name}!\\n\\nBrief 2-3 sentence summary of their situation.\\n\\nStep 1: [Action Title]\\nClear explanation with specific numbers...\\n\\nStep 2: ...\\n\\nStep 3: ...\\n\\nIMPORTANT: ...\\n\\nNOTE: ...",
  "steps": ["...","...","..."],
  "tip": "...",
  "data_insights": "...",
  "confidence": "High"
}

Make sure the AI understands to parse misspellings such as "loose weight" as weight loss and treat them as fitness-related.
`;

  try {
    const groqClient = getGroqClient(API_KEY_TYPES.ASSISTANT);
    if (!groqClient) {
      throw new Error('Groq client not available for assistant');
    }
    
    console.log(`💬 Using dedicated ASSISTANT API key for user ${user_id}`);
    
    const completion = await groqClient.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are a FITNESS-ONLY assistant. Your FIRST task is to determine if the question is fitness-related. If the question is about politics, movies, celebrities, sports scores, coding, general knowledge, or anything NOT related to fitness/health, you MUST respond with ONLY this JSON: {\"response\": \"Sorry, I can't help with that. I'm your FitAI fitness assistant and can only answer questions related to your health, workouts, diet, and progress.\", \"confidence\": \"High\"}. Do NOT try to answer non-fitness questions. Do NOT try to relate them to fitness. Just reject them immediately. Always return valid JSON only, no markdown."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      model: "llama-3.1-8b-instant",
      temperature: 0.8,
      max_tokens: 800
    });

    const text = completion.choices[0]?.message?.content || '';
    
    try {
      const parsedData = extractAndParseJSON(text);
      return parsedData;
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError.message);
      console.error('Raw response (first 500 chars):', text.substring(0, 500));
      apiKeyStats[API_KEY_TYPES.ASSISTANT].errors++;
      throw new Error('Failed to parse AI response as JSON');
    }
  } catch (error) {
    console.error('Groq API Error:', error);
    apiKeyStats[API_KEY_TYPES.ASSISTANT].errors++;
    throw new Error('Failed to generate AI coaching response');
  }
};

export { isAIAvailable, API_KEY_TYPES };

/**
 * AI-Powered Smart Plan Adjustment
 * Uses Groq AI to analyze 4 weeks of data and recommend plan adjustments
 */
export const generateAIPlanAdjustment = async (userData) => {
  const client = getGroqClient(API_KEY_TYPES.PLAN_ADJUSTMENT);
  
  if (!client) {
    throw new Error('Groq AI not configured');
  }

  const {
    age,
    gender,
    goal,
    currentWeight,
    targetWeight,
    activityLevel,
    experienceLevel,
    weekWeights, // [w1, w2, w3, w4]
    avgWeeklyChange,
    workoutAdherence,
    dietAdherence,
    habitScore,
    fatigueCount,
    currentCalories,
    currentMacros, // {protein, carbs, fat}
    setsPerWeek,
    splitType
  } = userData;

  const prompt = `You are FitAI Smart Plan Adjustment Engine.

Your role is to:
1. Analyze past 4 weeks user fitness data.
2. Determine if plan adjustment is required.
3. Protect user health and safety.
4. Follow evidence-based fitness principles.
5. Avoid extreme calorie reductions.
6. Avoid unsafe workout overload.
7. Prioritize sustainability and adherence.

Adjustment Rules:

For Weight Loss:
- If weight loss < 0.3 kg/week AND adherence > 75% → Increase deficit slightly (100–150 kcal).
- If weight loss > 1 kg/week → Reduce deficit (increase calories by 150–200 kcal).
- If adherence < 60% → Simplify plan instead of increasing deficit.

For Muscle Gain:
- If weight stagnant for 3 weeks → Increase volume by 5–10%.
- If fatigue high → Reduce intensity.
- If adherence low → Simplify split.

Always return structured JSON output only.

JSON format:
{
  "adjustmentRequired": true/false,
  "reason": "...",
  "newCalorieTarget": number,
  "newMacroSplit": {
    "protein": percentage,
    "carbs": percentage,
    "fat": percentage
  },
  "workoutChanges": {
    "volumeChangePercent": number,
    "newWorkoutStructure": "description"
  },
  "dashboardNotification": "message for user",
  "explanation": "clear short explanation"
}

Do not include extra text outside JSON.

User Profile:
Age: ${age}
Gender: ${gender}
Goal: ${goal}
Current Weight: ${currentWeight} kg
Target Weight: ${targetWeight} kg
Activity Level: ${activityLevel}
Experience Level: ${experienceLevel}

Past 4 Weeks Data:
Week 1 Weight: ${weekWeights[0]} kg
Week 2 Weight: ${weekWeights[1]} kg
Week 3 Weight: ${weekWeights[2]} kg
Week 4 Weight: ${weekWeights[3]} kg
Average Weekly Change: ${avgWeeklyChange} kg
Workout Adherence: ${workoutAdherence}%
Diet Adherence: ${dietAdherence}%
Habit Score: ${habitScore}
Fatigue Reports (last 7 days): ${fatigueCount}

Current Plan:
Calorie Target: ${currentCalories} kcal
Macro Split: ${currentMacros.protein}% protein, ${currentMacros.carbs}% carbs, ${currentMacros.fat}% fat
Workout Volume: ${setsPerWeek} sets per week
Workout Structure: ${splitType}

Evaluate and determine if adjustment required.
Return structured JSON only.`;

  try {
    const client = getGroqClient(API_KEY_TYPES.PLAN_ADJUSTMENT);
    
    if (!client) {
      throw new Error('Groq AI not configured for plan adjustment');
    }

    console.log(`📊 Using dedicated PLAN_ADJUSTMENT API key (70B model)`);

    const completion = await client.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are a professional fitness AI that analyzes user data and provides plan adjustments in strict JSON format. Always return valid JSON only, no extra text."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      model: "llama-3.3-70b-versatile", // Updated to supported 70B model
      temperature: 0.3, // Lower temperature for more consistent, factual responses
      max_tokens: 1000
    });

    const text = completion.choices[0]?.message?.content || '';
    
    // Clean up and extract JSON
    try {
      const parsedData = extractAndParseJSON(text);
      
      // Validate required fields
      if (typeof parsedData.adjustmentRequired !== 'boolean') {
        throw new Error('Invalid response: missing adjustmentRequired field');
      }
      
      return parsedData;
    } catch (parseError) {
      console.error('JSON Parse Error:', parseError.message);
      console.error('Raw response:', text);
      apiKeyStats[API_KEY_TYPES.PLAN_ADJUSTMENT].errors++;
      throw new Error('Failed to parse AI plan adjustment response');
    }
  } catch (error) {
    console.error('Groq API Error:', error);
    apiKeyStats[API_KEY_TYPES.PLAN_ADJUSTMENT].errors++;
    throw new Error('Failed to generate AI plan adjustment');
  }
};
