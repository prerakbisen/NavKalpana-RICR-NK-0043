import PremiumPreferences from '../models/PremiumPreferences.js';
import MealSwapHistory from '../models/MealSwapHistory.js';
import Profile from '../models/Profile.js';
import DailyLog from '../models/DailyLog.js';
import DietPlan from '../models/DietPlan.js';
import Groq from 'groq-sdk';

// Initialize Groq client
const getGroqClient = () => {
  // Try multiple API keys in order of preference
  const apiKey = process.env.GROQ_API_KEY || 
                 process.env.GROQ_API_KEY_ASSISTANT || 
                 process.env.GROQ_API_KEY_DIET ||
                 process.env.GROQ_API_KEY_WORKOUT;
  
  if (!apiKey || apiKey === 'your_groq_api_key_here' || apiKey.includes('your_groq')) {
    console.warn('⚠️  Groq API key not configured properly');
    return null;
  }
  
  return new Groq({ apiKey });
};

// Generic Groq API call function
const callGroqAPI = async (prompt, context = 'premium_coaching', options = {}) => {
  const client = getGroqClient();
  if (!client) {
    throw new Error('Groq API not configured');
  }

  const completion = await client.chat.completions.create({
    messages: [
      {
        role: "system",
        content: "You are an expert fitness and nutrition coach. Always respond with valid JSON only, no markdown."
      },
      {
        role: "user",
        content: prompt
      }
    ],
    model: options.model || "llama-3.1-8b-instant",
    temperature: options.temperature || 0.7,
    max_tokens: options.max_tokens || 1000
  });

  const text = completion.choices[0]?.message?.content || '';
  
  // Clean up markdown and extract JSON
  let cleanText = text.trim();
  cleanText = cleanText.replace(/```json\n?/gi, '').replace(/```\n?/g, '');
  cleanText = cleanText.trim();
  
  // Extract JSON object
  const firstBrace = cleanText.indexOf('{');
  const lastBrace = cleanText.lastIndexOf('}');
  
  if (firstBrace === -1 || lastBrace === -1) {
    // If no JSON found, return the text as is
    return text;
  }
  
  cleanText = cleanText.substring(firstBrace, lastBrace + 1);
  
  try {
    return cleanText;
  } catch (error) {
    return text;
  }
};

class PremiumCoachingService {
  
  // 1️⃣ ADVANCED MACRO CUSTOMIZATION - Enhanced with real data
  async calculatePremiumMacros(userId, profile, preferences) {
    const weight = profile.weight_kg;
    const calories = profile.daily_calorie_target;
    
    console.log(`📊 Calculating premium macros for user ${userId}`);
    console.log(`Weight: ${weight}kg, Calories: ${calories}, Strategy: ${preferences.macro_strategy}`);
    
    let macros = {};
    
    switch (preferences.macro_strategy) {
      case 'high_protein':
        macros = {
          protein_g: Math.round(weight * 2.5),
          protein_percent: 35,
          carbs_percent: 35,
          fat_percent: 30
        };
        break;
        
      case 'low_carb':
        macros = {
          protein_g: Math.round(weight * 2.2),
          protein_percent: 35,
          carbs_percent: 20,
          fat_percent: 45
        };
        break;
        
      case 'high_carb':
        macros = {
          protein_g: Math.round(weight * 2.0),
          protein_percent: 25,
          carbs_percent: 55,
          fat_percent: 20
        };
        break;
        
      case 'ketogenic':
        macros = {
          protein_g: Math.round(weight * 2.0),
          protein_percent: 25,
          carbs_percent: 5,
          fat_percent: 70
        };
        break;
        
      case 'carb_cycling':
        // Dynamic based on workout day
        const today = new Date().getDay();
        const isHighCarbDay = preferences.high_carb_days?.includes(today) || [1, 3, 5].includes(today); // Default: Mon, Wed, Fri
        
        if (isHighCarbDay) {
          macros = {
            protein_g: Math.round(weight * 2.2),
            protein_percent: 30,
            carbs_percent: 50,
            fat_percent: 20,
            day_type: 'high_carb'
          };
        } else {
          macros = {
            protein_g: Math.round(weight * 2.2),
            protein_percent: 35,
            carbs_percent: 25,
            fat_percent: 40,
            day_type: 'low_carb'
          };
        }
        break;
        
      case 'custom':
        const proteinPerKg = preferences.protein_per_kg || 2.0;
        macros = {
          protein_g: Math.round(weight * proteinPerKg),
          protein_percent: 30,
          carbs_percent: 40,
          fat_percent: 30
        };
        break;
        
      default: // balanced
        macros = {
          protein_g: Math.round(weight * 2.0),
          protein_percent: 30,
          carbs_percent: 40,
          fat_percent: 30
        };
    }
    
    // Calculate grams from percentages
    macros.carbs_g = Math.round((calories * (macros.carbs_percent / 100)) / 4);
    macros.fat_g = Math.round((calories * (macros.fat_percent / 100)) / 9);
    
    console.log(`✅ Macros calculated:`, macros);
    
    return macros;
  }
  
  // Apply premium macros to diet plan
  async applyMacrosToDietPlan(userId, macros) {
    try {
      const dietPlan = await DietPlan.findOne({ user_id: userId }).sort({ created_at: -1 });
      
      if (!dietPlan) {
        console.log('⚠️  No diet plan found to apply macros');
        return null;
      }
      
      // Update diet plan with new macros
      dietPlan.protein_grams = macros.protein_g;
      dietPlan.carbs_grams = macros.carbs_g;
      dietPlan.fat_grams = macros.fat_g;
      dietPlan.protein_percent = macros.protein_percent;
      dietPlan.carbs_percent = macros.carbs_percent;
      dietPlan.fat_percent = macros.fat_percent;
      
      // Redistribute macros across meals
      const mealsCount = dietPlan.meals.length;
      dietPlan.meals.forEach((meal, index) => {
        const mealProtein = Math.round(macros.protein_g / mealsCount);
        const mealCarbs = Math.round(macros.carbs_g / mealsCount);
        const mealFat = Math.round(macros.fat_g / mealsCount);
        
        meal.macros = {
          protein_g: mealProtein,
          carbs_g: mealCarbs,
          fat_g: mealFat
        };
        
        meal.estimated_calories = (mealProtein * 4) + (mealCarbs * 4) + (mealFat * 9);
      });
      
      await dietPlan.save();
      
      console.log(`✅ Applied macros to diet plan ${dietPlan._id}`);
      
      return dietPlan;
    } catch (error) {
      console.error('❌ Error applying macros to diet plan:', error);
      return null;
    }
  }
  
  // 2️⃣ MEAL SWAP ENGINE
  async swapMeal(userId, dietPlanId, mealNumber, swapReason = '') {
    try {
      console.log(`🔄 Starting meal swap for user ${userId}, meal ${mealNumber}`);
      
      const [dietPlan, preferences, profile] = await Promise.all([
        DietPlan.findById(dietPlanId),
        PremiumPreferences.findOne({ user_id: userId }),
        Profile.findOne({ user_id: userId })
      ]);
      
      if (!dietPlan) {
        console.error('❌ Diet plan not found:', dietPlanId);
        throw new Error('Diet plan not found');
      }
      
      console.log(`✅ Diet plan found with ${dietPlan.meals.length} meals`);
      
      const originalMeal = dietPlan.meals.find(m => m.meal_number === mealNumber);
      if (!originalMeal) {
        console.error('❌ Meal not found:', mealNumber);
        throw new Error(`Meal ${mealNumber} not found in diet plan`);
      }
      
      console.log(`✅ Original meal found: ${originalMeal.meal_name}`);
      
      // Build swap constraints
      const constraints = {
        target_calories: originalMeal.estimated_calories,
        calorie_tolerance: 50,
        target_protein: originalMeal.macros.protein_g,
        target_carbs: originalMeal.macros.carbs_g,
        target_fat: originalMeal.macros.fat_g,
        dietary_restrictions: this._buildDietaryRestrictions(preferences),
        disliked_foods: preferences?.food_preferences?.disliked_foods || [],
        allergies: preferences?.food_preferences?.allergies || [],
        budget_level: preferences?.budget_level || 'moderate',
        cooking_skill: preferences?.cooking_skill || 'intermediate',
        swap_reason: swapReason
      };
      
      console.log('📋 Swap constraints:', constraints);
      
      // Generate swap using AI
      const swappedMeal = await this._generateMealSwap(
        originalMeal,
        constraints,
        profile.goal
      );
      
      console.log(`✅ Swapped meal generated: ${swappedMeal.meal_name}`);
      
      // Save swap history
      const swapHistory = new MealSwapHistory({
        user_id: userId,
        diet_plan_id: dietPlanId,
        original_meal: {
          meal_number: originalMeal.meal_number,
          meal_name: originalMeal.meal_name,
          description: originalMeal.description,
          calories: originalMeal.estimated_calories,
          macros: originalMeal.macros
        },
        swapped_meal: swappedMeal,
        swap_reason: swapReason
      });
      
      await swapHistory.save();
      console.log('✅ Swap history saved');
      
      // Update diet plan
      const mealIndex = dietPlan.meals.findIndex(m => m.meal_number === mealNumber);
      dietPlan.meals[mealIndex] = {
        ...dietPlan.meals[mealIndex].toObject(),
        meal_name: swappedMeal.meal_name,
        description: swappedMeal.description,
        ingredients: swappedMeal.ingredients,
        preparation_tips: swappedMeal.preparation_tips,
        estimated_calories: swappedMeal.calories,
        macros: swappedMeal.macros
      };
      
      await dietPlan.save();
      console.log('✅ Diet plan updated');
      
      return {
        success: true,
        swapped_meal: swappedMeal,
        original_meal: {
          meal_name: originalMeal.meal_name,
          description: originalMeal.description,
          estimated_calories: originalMeal.estimated_calories,
          macros: originalMeal.macros
        }
      };
      
    } catch (error) {
      console.error('❌ Meal swap error:', error.message);
      console.error('Stack:', error.stack);
      throw error;
    }
  }
  
  async _generateMealSwap(originalMeal, constraints, goal) {
    console.log('🤖 Generating AI meal swap...');
    
    // Build special instructions based on swap reason
    let specialInstructions = '';
    if (constraints.swap_reason) {
      const reason = constraints.swap_reason.toLowerCase();
      if (reason.includes('protein')) {
        specialInstructions = 'Focus on high-protein alternatives. Increase protein by 10-20g if possible.';
      } else if (reason.includes('vegetarian') || reason.includes('vegan')) {
        specialInstructions = 'Provide plant-based alternatives only.';
      } else if (reason.includes('carb') || reason.includes('low carb')) {
        specialInstructions = 'Reduce carbs and increase healthy fats.';
      } else if (reason.includes('quick') || reason.includes('easy')) {
        specialInstructions = 'Provide quick and easy meal options (under 15 minutes prep).';
      }
    }
    
    const prompt = `You are a premium nutrition coach. Generate a meal swap that matches these requirements:

ORIGINAL MEAL:
- Name: ${originalMeal.meal_name}
- Description: ${originalMeal.description}
- Calories: ${originalMeal.estimated_calories}
- Protein: ${originalMeal.macros.protein_g}g
- Carbs: ${originalMeal.macros.carbs_g}g
- Fat: ${originalMeal.macros.fat_g}g

SWAP REQUIREMENTS:
- Target Calories: ${constraints.target_calories} (±${constraints.calorie_tolerance})
- Target Protein: ${constraints.target_protein}g (±5g)
- Target Carbs: ${constraints.target_carbs}g (±10g)
- Target Fat: ${constraints.target_fat}g (±5g)
- Dietary Restrictions: ${constraints.dietary_restrictions.join(', ') || 'None'}
- Avoid: ${constraints.disliked_foods.join(', ') || 'None'}
- Allergies: ${constraints.allergies.join(', ') || 'None'}
- Budget: ${constraints.budget_level}
- Cooking Skill: ${constraints.cooking_skill}
- Goal: ${goal}
${constraints.swap_reason ? `- User Request: ${constraints.swap_reason}` : ''}
${specialInstructions ? `- Special Instructions: ${specialInstructions}` : ''}

Generate a replacement meal that:
1. Matches macros closely (within tolerance)
2. Respects all dietary restrictions
3. Is practical for the user's cooking skill
4. Fits their budget level
5. Provides variety from the original
6. Addresses the user's specific request if provided

IMPORTANT: Return ONLY a valid JSON object with no markdown formatting, no code blocks, no extra text. Use single spaces instead of newlines in strings.

{
  "meal_name": "New meal name",
  "description": "Brief description in one line",
  "calories": number,
  "macros": {
    "protein_g": number,
    "carbs_g": number,
    "fat_g": number
  },
  "ingredients": ["ingredient 1", "ingredient 2", "ingredient 3"],
  "preparation_tips": "Step by step instructions in one paragraph"
}`;

    try {
      const response = await callGroqAPI(prompt, 'meal_swap', {
        temperature: 0.7,
        max_tokens: 800
      });
      
      console.log('📥 Raw AI response received (length:', response.length, ')');
      
      // Clean the response more thoroughly
      let cleanResponse = response.trim();
      
      // Remove markdown code blocks
      cleanResponse = cleanResponse.replace(/```json\s*/gi, '').replace(/```\s*/g, '');
      
      // Remove any text before first { and after last }
      const firstBrace = cleanResponse.indexOf('{');
      const lastBrace = cleanResponse.lastIndexOf('}');
      
      if (firstBrace === -1 || lastBrace === -1) {
        console.error('❌ No JSON object found in response');
        throw new Error('Invalid AI response format');
      }
      
      cleanResponse = cleanResponse.substring(firstBrace, lastBrace + 1);
      
      // Remove control characters but preserve spaces
      cleanResponse = cleanResponse.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, ' ');
      
      // Replace multiple spaces with single space
      cleanResponse = cleanResponse.replace(/\s+/g, ' ');
      
      console.log('🧹 Cleaned response (first 200 chars):', cleanResponse.substring(0, 200));
      
      // Parse JSON
      const parsed = JSON.parse(cleanResponse);
      
      // Validate required fields
      if (!parsed.meal_name || !parsed.description || !parsed.calories || !parsed.macros || !parsed.ingredients || !parsed.preparation_tips) {
        console.error('❌ Missing required fields in parsed response');
        throw new Error('Incomplete meal data from AI');
      }
      
      // Ensure macros are numbers
      parsed.macros.protein_g = Number(parsed.macros.protein_g) || constraints.target_protein;
      parsed.macros.carbs_g = Number(parsed.macros.carbs_g) || constraints.target_carbs;
      parsed.macros.fat_g = Number(parsed.macros.fat_g) || constraints.target_fat;
      parsed.calories = Number(parsed.calories) || constraints.target_calories;
      
      // Ensure ingredients is an array
      if (!Array.isArray(parsed.ingredients)) {
        parsed.ingredients = [parsed.ingredients];
      }
      
      console.log('✅ Meal swap generated successfully:', parsed.meal_name);
      return parsed;
      
    } catch (error) {
      console.error('❌ Error generating meal swap:', error.message);
      
      // Enhanced fallback based on swap reason
      let fallbackMeal = {
        meal_name: `Alternative ${originalMeal.meal_name}`,
        description: `A nutritious alternative to ${originalMeal.meal_name} with similar macros`,
        calories: originalMeal.estimated_calories,
        macros: {
          protein_g: originalMeal.macros.protein_g,
          carbs_g: originalMeal.macros.carbs_g,
          fat_g: originalMeal.macros.fat_g
        },
        ingredients: ['Similar ingredients', 'Adjusted for preferences'],
        preparation_tips: 'Prepare similar to original meal with your preferred ingredients'
      };
      
      // Adjust fallback based on swap reason
      if (constraints.swap_reason && constraints.swap_reason.toLowerCase().includes('protein')) {
        fallbackMeal.meal_name = `High Protein ${originalMeal.meal_name}`;
        fallbackMeal.description = `Higher protein version of ${originalMeal.meal_name}`;
        fallbackMeal.macros.protein_g = Math.round(originalMeal.macros.protein_g * 1.3);
        fallbackMeal.macros.carbs_g = Math.round(originalMeal.macros.carbs_g * 0.9);
        fallbackMeal.ingredients = ['Extra protein source', 'Lean meat or plant protein', 'Reduced carb portions'];
      }
      
      console.log('⚠️  Using fallback meal:', fallbackMeal.meal_name);
      return fallbackMeal;
    }
  }
  
  _buildDietaryRestrictions(preferences) {
    const restrictions = [];
    if (!preferences) return restrictions;
    
    const prefs = preferences.meal_swap_preferences;
    if (prefs.vegetarian) restrictions.push('vegetarian');
    if (prefs.vegan) restrictions.push('vegan');
    if (prefs.pescatarian) restrictions.push('pescatarian');
    if (prefs.gluten_free) restrictions.push('gluten-free');
    if (prefs.dairy_free) restrictions.push('dairy-free');
    if (prefs.halal) restrictions.push('halal');
    if (prefs.kosher) restrictions.push('kosher');
    
    return restrictions;
  }
  
  // 3️⃣ PERSONALIZED MEAL ADJUSTMENTS
  async analyzeAndAdaptMeals(userId) {
    try {
      const [preferences, recentLogs, profile] = await Promise.all([
        PremiumPreferences.findOne({ user_id: userId }),
        DailyLog.find({ user_id: userId }).sort({ date: -1 }).limit(30),
        Profile.findOne({ user_id: userId })
      ]);
      
      // Analyze meal adherence patterns
      const mealPatterns = this._analyzeMealPatterns(recentLogs);
      
      // Generate adaptive recommendations
      const adaptations = {
        skip_breakfast_often: mealPatterns.breakfast_skip_rate > 0.5,
        prefer_larger_dinners: mealPatterns.dinner_adherence > mealPatterns.lunch_adherence,
        snack_preference: mealPatterns.snack_frequency,
        meal_timing_preference: mealPatterns.preferred_times
      };
      
      // Update preferences based on behavior
      if (preferences) {
        if (adaptations.skip_breakfast_often) {
          preferences.meal_prep_preference = 'intermittent_fasting';
        }
        await preferences.save();
      }
      
      return {
        patterns: mealPatterns,
        adaptations,
        recommendations: await this._generateAdaptiveRecommendations(adaptations, profile)
      };
      
    } catch (error) {
      console.error('Meal adaptation error:', error);
      throw error;
    }
  }
  
  _analyzeMealPatterns(logs) {
    let breakfastSkips = 0;
    let lunchAdherence = 0;
    let dinnerAdherence = 0;
    let snackCount = 0;
    
    logs.forEach(log => {
      // Analyze patterns from notes or adherence data
      if (log.diet_adherence === 'Deviated') breakfastSkips++;
      if (log.diet_followed) {
        lunchAdherence++;
        dinnerAdherence++;
      }
    });
    
    return {
      breakfast_skip_rate: breakfastSkips / logs.length,
      lunch_adherence: lunchAdherence / logs.length,
      dinner_adherence: dinnerAdherence / logs.length,
      snack_frequency: snackCount / logs.length,
      preferred_times: {}
    };
  }
  
  async _generateAdaptiveRecommendations(adaptations, profile) {
    const recommendations = [];
    
    if (adaptations.skip_breakfast_often) {
      recommendations.push({
        type: 'meal_timing',
        title: 'Consider Intermittent Fasting',
        description: 'You consistently skip breakfast. An IF approach (16:8) might suit your natural eating pattern better.',
        action: 'adjust_meal_schedule'
      });
    }
    
    if (adaptations.prefer_larger_dinners) {
      recommendations.push({
        type: 'meal_distribution',
        title: 'Adjust Calorie Distribution',
        description: 'You prefer larger dinners. We can redistribute calories: lighter lunch, bigger dinner.',
        action: 'rebalance_meals'
      });
    }
    
    return recommendations;
  }
  
  // 4️⃣ EXTENDED AI CHAT RESPONSES
  async generatePremiumCoachingResponse(userId, question, context = {}) {
    try {
      const [profile, preferences, recentLogs, dietPlan] = await Promise.all([
        Profile.findOne({ user_id: userId }),
        PremiumPreferences.findOne({ user_id: userId }),
        DailyLog.find({ user_id: userId }).sort({ date: -1 }).limit(7),
        DietPlan.findOne({ user_id: userId }).sort({ created_at: -1 })
      ]);
      
      const userContext = {
        goal: profile.goal,
        weight: profile.weight_kg,
        target_weight: profile.target_weight_kg,
        experience: profile.experience_level,
        recent_adherence: this._calculateRecentAdherence(recentLogs),
        macro_strategy: preferences?.macro_strategy || 'balanced',
        coaching_tone: preferences?.coaching_tone || 'supportive',
        detail_level: preferences?.detail_level || 'detailed'
      };
      
      const prompt = this._buildPremiumCoachingPrompt(question, userContext, context);
      
      const response = await callGroqAPI(prompt, 'premium_coaching', {
        max_tokens: 1000, // Extended for premium
        temperature: 0.7
      });
      
      return {
        response,
        coaching_insights: await this._extractCoachingInsights(response, userContext),
        action_items: await this._extractActionItems(response)
      };
      
    } catch (error) {
      console.error('Premium coaching response error:', error);
      throw error;
    }
  }
  
  _buildPremiumCoachingPrompt(question, userContext, additionalContext) {
    return `You are an elite personal trainer and nutritionist with 15+ years of experience. You're coaching a premium client.

CLIENT PROFILE:
- Goal: ${userContext.goal}
- Current Weight: ${userContext.weight}kg → Target: ${userContext.target_weight}kg
- Experience Level: ${userContext.experience}
- Recent Adherence: ${userContext.recent_adherence}%
- Macro Strategy: ${userContext.macro_strategy}
- Preferred Coaching Tone: ${userContext.coaching_tone}
- Detail Level: ${userContext.detail_level}

CLIENT QUESTION:
"${question}"

COACHING GUIDELINES:
1. Provide ${userContext.detail_level} explanations with scientific reasoning
2. Use a ${userContext.coaching_tone} tone
3. Include specific, actionable advice
4. Reference their current progress and goals
5. Explain the "why" behind recommendations
6. Show empathy and understanding
7. Provide motivation when appropriate
8. Include relevant metrics or benchmarks

Respond as their dedicated coach:`;
  }
  
  _calculateRecentAdherence(logs) {
    if (logs.length === 0) return 0;
    const adherent = logs.filter(log => log.workout_completed && log.diet_followed).length;
    return Math.round((adherent / logs.length) * 100);
  }
  
  async _extractCoachingInsights(response, userContext) {
    // Extract key insights from the response
    return {
      focus_area: 'nutrition', // Could be parsed from response
      urgency: 'normal',
      follow_up_needed: false
    };
  }
  
  async _extractActionItems(response) {
    // Extract actionable items from response
    return [];
  }
  
  // 5️⃣ DEEPER RECOVERY INSIGHTS
  async analyzeRecoveryStatus(userId) {
    try {
      const logs = await DailyLog.find({ user_id: userId })
        .sort({ date: -1 })
        .limit(14);
      
      if (logs.length < 7) {
        return {
          status: 'insufficient_data',
          message: 'Need at least 7 days of data for recovery analysis'
        };
      }
      
      // Calculate recovery metrics
      const metrics = {
        avg_sleep: this._calculateAverage(logs, 'sleep_hours'),
        avg_energy: this._calculateEnergyScore(logs),
        fatigue_days: logs.filter(l => l.energy_level === 'Low').length,
        missed_workouts: logs.filter(l => !l.workout_completed).length,
        workout_performance: this._analyzeWorkoutPerformance(logs),
        stress_indicators: this._detectStressIndicators(logs)
      };
      
      // Determine recovery status
      const recoveryScore = this._calculateRecoveryScore(metrics);
      const status = this._determineRecoveryStatus(recoveryScore, metrics);
      
      // Generate recommendations
      const recommendations = await this._generateRecoveryRecommendations(status, metrics);
      
      return {
        recovery_score: recoveryScore,
        status: status.level,
        metrics,
        recommendations,
        warnings: status.warnings,
        action_required: status.action_required
      };
      
    } catch (error) {
      console.error('Recovery analysis error:', error);
      throw error;
    }
  }
  
  _calculateAverage(logs, field) {
    const values = logs.map(l => l[field]).filter(v => v != null);
    return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
  }
  
  _calculateEnergyScore(logs) {
    const energyMap = { 'Low': 1, 'Medium': 2, 'High': 3 };
    const scores = logs.map(l => energyMap[l.energy_level] || 2);
    return scores.reduce((a, b) => a + b, 0) / scores.length;
  }
  
  _analyzeWorkoutPerformance(logs) {
    const recentPerformance = logs.slice(0, 7);
    const olderPerformance = logs.slice(7, 14);
    
    const recentCompletion = recentPerformance.filter(l => l.workout_completed).length / 7;
    const olderCompletion = olderPerformance.filter(l => l.workout_completed).length / 7;
    
    return {
      recent_completion_rate: recentCompletion,
      trend: recentCompletion >= olderCompletion ? 'improving' : 'declining'
    };
  }
  
  _detectStressIndicators(logs) {
    const indicators = [];
    
    const lowEnergyDays = logs.filter(l => l.energy_level === 'Low').length;
    if (lowEnergyDays >= 4) {
      indicators.push('persistent_low_energy');
    }
    
    const poorSleepDays = logs.filter(l => l.sleep_hours < 6).length;
    if (poorSleepDays >= 3) {
      indicators.push('insufficient_sleep');
    }
    
    const missedWorkouts = logs.filter(l => !l.workout_completed).length;
    if (missedWorkouts >= 4) {
      indicators.push('workout_adherence_drop');
    }
    
    return indicators;
  }
  
  _calculateRecoveryScore(metrics) {
    let score = 100;
    
    // Sleep impact
    if (metrics.avg_sleep < 6) score -= 30;
    else if (metrics.avg_sleep < 7) score -= 15;
    
    // Energy impact
    if (metrics.avg_energy < 1.5) score -= 25;
    else if (metrics.avg_energy < 2) score -= 10;
    
    // Fatigue impact
    score -= (metrics.fatigue_days * 3);
    
    // Missed workouts impact
    score -= (metrics.missed_workouts * 5);
    
    // Performance trend
    if (metrics.workout_performance.trend === 'declining') score -= 15;
    
    return Math.max(0, Math.min(100, score));
  }
  
  _determineRecoveryStatus(score, metrics) {
    const warnings = [];
    let action_required = false;
    
    if (score >= 80) {
      return {
        level: 'excellent',
        message: 'Recovery is optimal. You\'re ready for high-intensity training.',
        warnings: [],
        action_required: false
      };
    } else if (score >= 60) {
      return {
        level: 'good',
        message: 'Recovery is adequate. Continue current training load.',
        warnings: ['Monitor sleep quality'],
        action_required: false
      };
    } else if (score >= 40) {
      warnings.push('Consider reducing training intensity');
      if (metrics.avg_sleep < 7) warnings.push('Prioritize sleep (7-9 hours)');
      if (metrics.fatigue_days >= 3) warnings.push('High fatigue detected');
      
      return {
        level: 'moderate',
        message: 'Recovery is compromised. Reduce training intensity.',
        warnings,
        action_required: true
      };
    } else {
      warnings.push('URGENT: Take 2-3 rest days');
      warnings.push('Focus on sleep and nutrition');
      warnings.push('Consider deload week');
      
      return {
        level: 'poor',
        message: 'Overtraining risk detected. Immediate rest required.',
        warnings,
        action_required: true
      };
    }
  }
  
  async _generateRecoveryRecommendations(status, metrics) {
    const recommendations = [];
    
    if (status.level === 'poor' || status.level === 'moderate') {
      recommendations.push({
        type: 'rest',
        priority: 'high',
        title: 'Increase Rest Days',
        description: 'Add 1-2 extra rest days this week to allow full recovery.',
        action: 'reduce_training_frequency'
      });
      
      if (metrics.avg_sleep < 7) {
        recommendations.push({
          type: 'sleep',
          priority: 'high',
          title: 'Improve Sleep Quality',
          description: `Current average: ${metrics.avg_sleep.toFixed(1)}h. Target: 7-9 hours per night.`,
          action: 'increase_sleep_duration'
        });
      }
      
      recommendations.push({
        type: 'nutrition',
        priority: 'medium',
        title: 'Optimize Recovery Nutrition',
        description: 'Increase protein intake to 2.2g/kg and ensure adequate carbs for glycogen replenishment.',
        action: 'adjust_macros'
      });
      
      recommendations.push({
        type: 'training',
        priority: 'high',
        title: 'Reduce Training Intensity',
        description: 'Lower weights by 20% and focus on form and recovery.',
        action: 'deload_week'
      });
    }
    
    return recommendations;
  }
}

export default new PremiumCoachingService();
