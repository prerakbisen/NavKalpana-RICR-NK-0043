import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../.env') });

import User from '../models/User.js';
import Profile from '../models/Profile.js';
import DietPlan from '../models/DietPlan.js';
import DailyLog from '../models/DailyLog.js';
import PremiumPreferences from '../models/PremiumPreferences.js';
import premiumCoachingService from '../services/premiumCoachingService.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/fitai';

async function testPremiumFeatures() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    // Check Groq API configuration
    console.log('🔑 Checking Groq API configuration...');
    const groqKey = process.env.GROQ_API_KEY || process.env.GROQ_API_KEY_WORKOUT;
    if (groqKey && groqKey.length > 10 && !groqKey.includes('your_groq')) {
      console.log(`✅ Groq API key configured (length: ${groqKey.length})`);
    } else {
      console.log('⚠️  Groq API key not properly configured - AI features will be limited\n');
    }

    // Find or create test user
    let user = await User.findOne({ email: 'premium@fitai.com' });
    
    if (!user) {
      console.log('📝 Creating premium test user...');
      user = await User.create({
        name: 'Premium User',
        email: 'premium@fitai.com',
        password_hash: '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890',
        is_premium: true,
        subscription_tier: 'premium',
        premium_since: new Date(),
        premium_expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
      });
      console.log('✅ Premium test user created\n');
    } else {
      // Ensure user is premium
      user.is_premium = true;
      user.subscription_tier = 'premium';
      user.premium_expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
      await user.save();
      console.log('✅ Using existing premium user\n');
    }

    const userId = user._id;

    // Create or update profile
    let profile = await Profile.findOne({ user_id: userId });
    
    if (!profile) {
      console.log('📝 Creating test profile...');
      profile = await Profile.create({
        user_id: userId,
        age: 28,
        gender: 'Male',
        height_cm: 180,
        weight_kg: 85,
        target_weight_kg: 78,
        goal: 'Weight Loss',
        activity_level: 'Moderate',
        dietary_preference: 'Non-Vegetarian',
        health_conditions: [],
        fitness_level: 'Intermediate',
        experience_level: 'Intermediate',
        daily_calorie_target: 2200,
        initial_measurements: {
          waist_cm: 95,
          chest_cm: 105,
          hips_cm: 100,
          left_arm_cm: 38,
          right_arm_cm: 38,
          left_thigh_cm: 60,
          right_thigh_cm: 60
        }
      });
      console.log('✅ Test profile created\n');
    } else {
      console.log('✅ Profile exists\n');
    }

    // Create premium preferences
    console.log('📝 Creating premium preferences...');
    let preferences = await PremiumPreferences.findOne({ user_id: userId });
    
    if (!preferences) {
      preferences = await PremiumPreferences.create({
        user_id: userId,
        macro_strategy: 'high_protein',
        protein_per_kg: 2.2,
        carb_cycling_enabled: false,
        coaching_tone: 'supportive',
        detail_level: 'detailed',
        meal_swap_preferences: {
          vegetarian: false,
          vegan: false,
          gluten_free: false,
          dairy_free: false
        },
        food_preferences: {
          disliked_foods: ['mushrooms', 'olives'],
          allergies: []
        },
        budget_level: 'moderate',
        cooking_skill: 'intermediate'
      });
      console.log('✅ Premium preferences created\n');
    } else {
      console.log('✅ Premium preferences exist\n');
    }

    // Create sample diet plan
    console.log('📝 Creating sample diet plan...');
    await DietPlan.deleteMany({ user_id: userId });
    
    const dietPlan = await DietPlan.create({
      user_id: userId,
      week_number: 1,
      daily_calorie_target: 2200,
      goal: 'Weight Loss',
      protein_grams: 170,
      carbs_grams: 220,
      fat_grams: 73,
      protein_percent: 30,
      carbs_percent: 40,
      fat_percent: 30,
      meals: [
        {
          meal_number: 1,
          meal_name: 'Breakfast',
          time_suggestion: '7:00 AM',
          description: 'Scrambled eggs with whole wheat toast and avocado',
          estimated_calories: 440,
          macros: { protein_g: 34, carbs_g: 44, fat_g: 15 },
          ingredients: ['3 eggs', '2 slices whole wheat bread', '1/2 avocado', 'olive oil'],
          preparation_tips: 'Scramble eggs in olive oil, toast bread, slice avocado'
        },
        {
          meal_number: 2,
          meal_name: 'Lunch',
          time_suggestion: '12:30 PM',
          description: 'Grilled chicken breast with brown rice and steamed broccoli',
          estimated_calories: 550,
          macros: { protein_g: 45, carbs_g: 55, fat_g: 15 },
          ingredients: ['200g chicken breast', '1 cup brown rice', '2 cups broccoli'],
          preparation_tips: 'Grill chicken, cook rice, steam broccoli'
        },
        {
          meal_number: 3,
          meal_name: 'Snack',
          time_suggestion: '3:30 PM',
          description: 'Greek yogurt with berries and almonds',
          estimated_calories: 300,
          macros: { protein_g: 20, carbs_g: 30, fat_g: 12 },
          ingredients: ['200g Greek yogurt', '1/2 cup mixed berries', '15 almonds'],
          preparation_tips: 'Mix yogurt with berries, top with almonds'
        },
        {
          meal_number: 4,
          meal_name: 'Dinner',
          time_suggestion: '7:00 PM',
          description: 'Baked salmon with quinoa and roasted vegetables',
          estimated_calories: 600,
          macros: { protein_g: 48, carbs_g: 60, fat_g: 20 },
          ingredients: ['200g salmon', '1 cup quinoa', 'mixed vegetables'],
          preparation_tips: 'Bake salmon at 400°F for 15 mins, cook quinoa, roast vegetables'
        },
        {
          meal_number: 5,
          meal_name: 'Evening Snack',
          time_suggestion: '9:00 PM',
          description: 'Protein shake with banana',
          estimated_calories: 310,
          macros: { protein_g: 23, carbs_g: 31, fat_g: 11 },
          ingredients: ['1 scoop whey protein', '1 banana', '1 cup almond milk'],
          preparation_tips: 'Blend all ingredients until smooth'
        }
      ]
    });
    console.log('✅ Sample diet plan created\n');

    // Create sample daily logs for recovery analysis
    console.log('📝 Creating sample daily logs...');
    await DailyLog.deleteMany({ user_id: userId });
    
    const logs = [];
    for (let i = 0; i < 14; i++) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      
      logs.push({
        user_id: userId,
        date: date,
        workout_completed: i % 3 !== 0, // Miss every 3rd workout
        workout_status: i % 3 !== 0 ? 'Completed' : 'Skipped',
        diet_followed: i % 4 !== 0, // Miss every 4th diet day
        diet_adherence: i % 4 !== 0 ? 'Followed' : 'Deviated',
        weight_kg: 85 - (i * 0.2),
        sleep_hours: 6 + Math.random() * 2,
        water_intake_liters: 2 + Math.random() * 1,
        calories_consumed: 2000 + Math.random() * 400,
        energy_level: i < 5 ? 'Slightly Fatigued' : 'Normal',
        mood: 'Good',
        notes: `Day ${i + 1} log`
      });
    }
    await DailyLog.insertMany(logs);
    console.log('✅ Sample daily logs created\n');

    // TEST 1: Advanced Macro Customization
    console.log('=' .repeat(60));
    console.log('TEST 1: ADVANCED MACRO CUSTOMIZATION');
    console.log('='.repeat(60));
    
    const strategies = ['balanced', 'high_protein', 'low_carb', 'high_carb', 'ketogenic', 'carb_cycling'];
    
    for (const strategy of strategies) {
      preferences.macro_strategy = strategy;
      await preferences.save();
      
      const macros = await premiumCoachingService.calculatePremiumMacros(userId, profile, preferences);
      
      console.log(`\n📊 ${strategy.toUpperCase().replace('_', ' ')} Strategy:`);
      console.log(`  Protein: ${macros.protein_g}g (${macros.protein_percent}%)`);
      console.log(`  Carbs: ${macros.carbs_g}g (${macros.carbs_percent}%)`);
      console.log(`  Fat: ${macros.fat_g}g (${macros.fat_percent}%)`);
      if (macros.day_type) console.log(`  Day Type: ${macros.day_type}`);
    }

    // TEST 2: Apply Macros to Diet Plan
    console.log('\n\n' + '='.repeat(60));
    console.log('TEST 2: APPLY MACROS TO DIET PLAN');
    console.log('='.repeat(60));
    
    preferences.macro_strategy = 'high_protein';
    await preferences.save();
    
    const macros = await premiumCoachingService.calculatePremiumMacros(userId, profile, preferences);
    const updatedPlan = await premiumCoachingService.applyMacrosToDietPlan(userId, macros);
    
    if (updatedPlan) {
      console.log('\n✅ Macros applied to diet plan successfully!');
      console.log(`\nDiet Plan Macros:`);
      console.log(`  Protein: ${updatedPlan.protein_grams}g (${updatedPlan.protein_percent}%)`);
      console.log(`  Carbs: ${updatedPlan.carbs_grams}g (${updatedPlan.carbs_percent}%)`);
      console.log(`  Fat: ${updatedPlan.fat_grams}g (${updatedPlan.fat_percent}%)`);
      
      console.log(`\nMeal Distribution:`);
      updatedPlan.meals.forEach(meal => {
        console.log(`  ${meal.meal_name}: ${meal.estimated_calories} cal (P:${meal.macros.protein_g}g C:${meal.macros.carbs_g}g F:${meal.macros.fat_g}g)`);
      });
    }

    // TEST 3: Meal Swap Engine
    console.log('\n\n' + '='.repeat(60));
    console.log('TEST 3: MEAL SWAP ENGINE');
    console.log('='.repeat(60));
    
    console.log('\n🔄 Swapping Breakfast meal...');
    const swapResult = await premiumCoachingService.swapMeal(
      userId,
      dietPlan._id,
      1,
      'Want a vegetarian option'
    );
    
    if (swapResult.success) {
      console.log('\n✅ Meal swapped successfully!');
      console.log(`\nOriginal Meal:`);
      console.log(`  Name: ${swapResult.original_meal.meal_name}`);
      console.log(`  Description: ${swapResult.original_meal.description}`);
      console.log(`  Calories: ${swapResult.original_meal.estimated_calories}`);
      
      console.log(`\nSwapped Meal:`);
      console.log(`  Name: ${swapResult.swapped_meal.meal_name}`);
      console.log(`  Description: ${swapResult.swapped_meal.description}`);
      console.log(`  Calories: ${swapResult.swapped_meal.calories}`);
      console.log(`  Macros: P:${swapResult.swapped_meal.macros.protein_g}g C:${swapResult.swapped_meal.macros.carbs_g}g F:${swapResult.swapped_meal.macros.fat_g}g`);
      console.log(`  Ingredients: ${swapResult.swapped_meal.ingredients.join(', ')}`);
    }

    // TEST 4: Recovery Analysis
    console.log('\n\n' + '='.repeat(60));
    console.log('TEST 4: RECOVERY ANALYSIS');
    console.log('='.repeat(60));
    
    const recovery = await premiumCoachingService.analyzeRecoveryStatus(userId);
    
    console.log(`\n💪 Recovery Score: ${recovery.recovery_score}/100`);
    console.log(`Status: ${recovery.status}`);
    
    console.log(`\nMetrics:`);
    console.log(`  Avg Sleep: ${recovery.metrics.avg_sleep.toFixed(1)} hours`);
    console.log(`  Avg Energy: ${recovery.metrics.avg_energy.toFixed(1)}/3`);
    console.log(`  Fatigue Days: ${recovery.metrics.fatigue_days}`);
    console.log(`  Missed Workouts: ${recovery.metrics.missed_workouts}`);
    console.log(`  Performance Trend: ${recovery.metrics.workout_performance.trend}`);
    
    if (recovery.warnings && recovery.warnings.length > 0) {
      console.log(`\n⚠️  Warnings:`);
      recovery.warnings.forEach(warning => console.log(`  - ${warning}`));
    }
    
    if (recovery.recommendations && recovery.recommendations.length > 0) {
      console.log(`\n💡 Recommendations:`);
      recovery.recommendations.forEach(rec => {
        console.log(`  [${rec.priority.toUpperCase()}] ${rec.title}`);
        console.log(`    ${rec.description}`);
      });
    }

    // TEST 5: Meal Adaptation Analysis
    console.log('\n\n' + '='.repeat(60));
    console.log('TEST 5: MEAL ADAPTATION ANALYSIS');
    console.log('='.repeat(60));
    
    const adaptation = await premiumCoachingService.analyzeAndAdaptMeals(userId);
    
    console.log(`\n📊 Meal Patterns:`);
    console.log(`  Breakfast Skip Rate: ${(adaptation.patterns.breakfast_skip_rate * 100).toFixed(1)}%`);
    console.log(`  Lunch Adherence: ${(adaptation.patterns.lunch_adherence * 100).toFixed(1)}%`);
    console.log(`  Dinner Adherence: ${(adaptation.patterns.dinner_adherence * 100).toFixed(1)}%`);
    
    console.log(`\n🎯 Adaptations:`);
    console.log(`  Skip Breakfast Often: ${adaptation.adaptations.skip_breakfast_often ? 'Yes' : 'No'}`);
    console.log(`  Prefer Larger Dinners: ${adaptation.adaptations.prefer_larger_dinners ? 'Yes' : 'No'}`);
    
    if (adaptation.recommendations && adaptation.recommendations.length > 0) {
      console.log(`\n💡 Recommendations:`);
      adaptation.recommendations.forEach(rec => {
        console.log(`  [${rec.type.toUpperCase()}] ${rec.title}`);
        console.log(`    ${rec.description}`);
      });
    }

    // TEST 6: Premium AI Coaching
    console.log('\n\n' + '='.repeat(60));
    console.log('TEST 6: PREMIUM AI COACHING');
    console.log('='.repeat(60));
    
    const question = "I'm feeling tired after workouts. Should I increase my carbs?";
    console.log(`\n❓ Question: "${question}"`);
    console.log('\n🤖 Generating premium coaching response...');
    
    const coachingResponse = await premiumCoachingService.generatePremiumCoachingResponse(
      userId,
      question,
      { context: 'post_workout_fatigue' }
    );
    
    console.log(`\n💬 Coach Response:`);
    console.log(coachingResponse.response);
    
    if (coachingResponse.coaching_insights) {
      console.log(`\n📊 Insights:`);
      console.log(`  Focus Area: ${coachingResponse.coaching_insights.focus_area}`);
      console.log(`  Urgency: ${coachingResponse.coaching_insights.urgency}`);
    }

    console.log('\n\n' + '='.repeat(60));
    console.log('✅ ALL PREMIUM FEATURES TESTED SUCCESSFULLY!');
    console.log('='.repeat(60));
    
    console.log('\n📝 Test User Credentials:');
    console.log(`Email: premium@fitai.com`);
    console.log(`User ID: ${userId}`);
    console.log(`Premium Status: Active`);
    console.log(`Expires: ${user.premium_expires.toLocaleDateString()}`);
    console.log('\nYou can now test the frontend with this premium user.');

  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error(error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 MongoDB connection closed');
  }
}

testPremiumFeatures();
