import Groq from 'groq-sdk';
import { gatherCompleteUserContext, formatUserContextForAI } from './userContextService.js';

let groq = null;

const getGroqClient = () => {
  if (!groq && process.env.GROQ_API_KEY && process.env.GROQ_API_KEY !== 'your_groq_api_key_here') {
    groq = new Groq({
      apiKey: process.env.GROQ_API_KEY
    });
  }
  return groq;
};

const isAIAvailable = () => {
  return process.env.GROQ_API_KEY && process.env.GROQ_API_KEY !== 'your_groq_api_key_here';
};


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
    const groqClient = getGroqClient();
    if (!groqClient) {
      throw new Error('Groq client not available');
    }
    
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
      throw new Error('Failed to generate AI workout plan');
    }
  } catch (error) {
    console.error('Groq API Error:', error);
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
    const groqClient = getGroqClient();
    if (!groqClient) {
      throw new Error('Groq client not available');
    }
    
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
      throw new Error('Failed to generate AI diet plan');
    }
  } catch (error) {
    console.error('Groq API Error:', error);
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

  const contextPrompt = formatUserContextForAI(userContext);
  
  const prompt = `${contextPrompt}

=== USER QUESTION ===
"${question}"

=== TASK ===
You are this user's personal AI fitness coach named "${userContext.user.name}". You have complete knowledge of their entire fitness journey including their personal information. Answer their question with highly personalized advice in a CLEAR, STRUCTURED, STEP-BY-STEP format.

IMPORTANT INSTRUCTIONS:
- If they ask about their NAME, tell them: "Your name is ${userContext.user.name}"
- If they ask about their EMAIL, tell them: "Your email is ${userContext.user.email}"
- If they ask about their AGE, tell them: "You are ${userContext.profile.age} years old"
- If they ask about their WEIGHT, tell them: "Your current weight is ${userContext.profile.current_weight_kg} kg"
- If they ask about their GOAL, tell them: "Your goal is ${userContext.profile.goal}"
- If they ask "who am I" or "what's my name", respond with their name and key details
- Always address them by their name when appropriate
- Reference their specific data in every response

RESPONSE FORMAT REQUIREMENTS:
1. Start with a brief greeting using their name
2. Provide a SHORT summary (2-3 sentences max)
3. Break down your advice into CLEAR, NUMBERED STEPS
4. Each step should be actionable and specific
5. Use bullet points for sub-items within steps
6. Keep paragraphs SHORT (2-3 sentences max)
7. Use line breaks between sections for readability
8. Highlight IMPORTANT information with IMPORTANT: prefix
9. Highlight CRITICAL warnings with CRITICAL: prefix
10. Use NOTE: for helpful tips

ANALYZE THEIR COMPLETE DATA:
1. Review their progress history - what patterns do you see?
2. Check their adherence rates - are they consistent?
3. Look at their weight trend - is it matching their goal?
4. Consider their energy levels and fatigue
5. Review their workout and diet history
6. Remember their personal information (name, age, email, etc.)

Provide a response in JSON format with this EXACT structure:
{
  "response": "Hi ${userContext.user.name}!\\n\\nBrief 2-3 sentence summary of their situation.\\n\\nStep 1: [Action Title]\\nClear explanation with specific numbers (e.g., increase protein to 150g daily).\\n\\nStep 2: [Action Title]\\nClear explanation with specific numbers.\\n\\nStep 3: [Action Title]\\nClear explanation with specific numbers.\\n\\nIMPORTANT: Highlight critical information here.\\n\\nNOTE: Add helpful tips here.",
  "steps": [
    "Increase daily protein intake to 150g (currently at 100g)",
    "Add 2 extra sets to compound exercises",
    "Reduce rest days from 3 to 2 per week",
    "Track weight every Monday morning"
  ],
  "tip": "Meal prep on Sundays to hit your 150g protein target consistently",
  "data_insights": "Your 85% workout adherence is excellent, but diet adherence at 60% needs improvement for your muscle gain goal",
  "confidence": "High"
}

FORMATTING RULES:
- Use Step 1:, Step 2:, etc. for main action items
- Use numbers with units (70kg, 2000 kcal, 85%)
- Use IMPORTANT: for critical information
- Use CRITICAL: for warnings
- Use NOTE: for helpful tips
- Use \\n\\n for paragraph breaks
- Keep sentences short and actionable
- Reference ACTUAL data (their weight, adherence %, etc.)
- Address them by name
- Be specific with numbers and timeframes`;

  try {
    const groqClient = getGroqClient();
    if (!groqClient) {
      throw new Error('Groq client not available');
    }
    
    const completion = await groqClient.chat.completions.create({
      messages: [
        {
          role: "system",
          content: "You are a personal fitness coach. Always respond with valid JSON only, no markdown."
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
      throw new Error('Failed to parse AI response as JSON');
    }
  } catch (error) {
    console.error('Groq API Error:', error);
    throw new Error('Failed to generate AI coaching response');
  }
};

export { isAIAvailable };
