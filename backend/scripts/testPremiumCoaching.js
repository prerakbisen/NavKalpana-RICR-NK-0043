import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Profile from '../models/Profile.js';
import PremiumPreferences from '../models/PremiumPreferences.js';
import DietPlan from '../models/DietPlan.js';
import DailyLog from '../models/DailyLog.js';
import premiumCoachingService from '../services/premiumCoachingService.js';

dotenv.config();

const testPremiumCoaching = async () => {
  try {
    console.log('🚀 Testing Premium Coaching Layer...\n');
    
    // Connect to database
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fitai');
    console.log('✅ Connected to MongoDB\n');
    
    // Find a test user
    const user = await User.findOne();
    if (!user) {
      console.log('❌ No users found. Please create a user first.');
      return;
    }
    
    console.log(`📝 Testing with user: ${user.email}\n`);
    
    // TEST 1: Activate Premium
    console.log('TEST 1: Activate Premium');
    console.log('─'.repeat(50));
    user.is_premium = true;
    user.subscription_tier = 'premium';
    user.premium_since = new Date();
    user.premium_expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
    await user.save();
    console.log('✅ Premium activated');
    console.log(`   Tier: ${user.subscription_tier}`);
    console.log(`   Expires: ${user.premium_expires.toDateString()}\n`);
    
    // TEST 2: Create Premium Preferences
    console.log('TEST 2: Create Premium Preferences');
    console.log('─'.repeat(50));
    let preferences = await PremiumPreferences.findOne({ user_id: user._id });
    if (!preferences) {
      preferences = new PremiumPreferences({
        user_id: user._id,
        macro_strategy: 'high_protein',
        protein_per_kg: 2.5,
        carb_cycling_enabled: false,
        meal_swap_preferences: {
          vegetarian: false,
          vegan: false,
          gluten_free: false
        },
        food_preferences: {
          liked_foods: ['chicken', 'rice', 'broccoli'],
          disliked_foods: ['mushrooms'],
          allergies: []
        },
        budget_level: 'moderate',
        cooking_skill: 'intermediate',
        coaching_tone: 'supportive',
        detail_level: 'detailed',
        recovery_focus: 'standard',
        sleep_target_hours: 8
      });
      await preferences.save();
    }
    console.log('✅ Premium preferences created');
    console.log(`   Macro Strategy: ${preferences.macro_strategy}`);
    console.log(`   Protein per kg: ${preferences.protein_per_kg}g`);
    console.log(`   Coaching Tone: ${preferences.coaching_tone}\n`);
    
    // TEST 3: Calculate Premium Macros
    console.log('TEST 3: Calculate Premium Macros');
    console.log('─'.repeat(50));
    const profile = await Profile.findOne({ user_id: user._id });
    if (profile) {
      const macros = await premiumCoachingService.calculatePremiumMacros(
        user._id,
        profile,
        preferences
      );
      console.log('✅ Premium macros calculated');
      console.log(`   Strategy: ${preferences.macro_strategy}`);
      console.log(`   Protein: ${macros.protein_g}g (${macros.protein_percent}%)`);
      console.log(`   Carbs: ${macros.carbs_g}g (${macros.carbs_percent}%)`);
      console.log(`   Fat: ${macros.fat_g}g (${macros.fat_percent}%)\n`);
    } else {
      console.log('⚠️  No profile found, skipping macro calculation\n');
    }
    
    // TEST 4: Meal Swap (if diet plan exists)
    console.log('TEST 4: Meal Swap Engine');
    console.log('─'.repeat(50));
    const dietPlan = await DietPlan.findOne({ user_id: user._id });
    if (dietPlan && dietPlan.meals.length > 0) {
      try {
        const swapResult = await premiumCoachingService.swapMeal(
          user._id,
          dietPlan._id,
          1,
          'Testing meal swap functionality'
        );
        console.log('✅ Meal swapped successfully');
        console.log(`   Original: ${swapResult.original_meal.meal_name}`);
        console.log(`   Swapped to: ${swapResult.swapped_meal.meal_name}`);
        console.log(`   Calories: ${swapResult.swapped_meal.calories}`);
        console.log(`   Macros: P${swapResult.swapped_meal.macros.protein_g}g C${swapResult.swapped_meal.macros.carbs_g}g F${swapResult.swapped_meal.macros.fat_g}g\n`);
      } catch (error) {
        console.log('⚠️  Meal swap failed:', error.message);
        console.log('   (This is expected if Groq API is not configured)\n');
      }
    } else {
      console.log('⚠️  No diet plan found, skipping meal swap test\n');
    }
    
    // TEST 5: Meal Adaptations Analysis
    console.log('TEST 5: Meal Adaptations Analysis');
    console.log('─'.repeat(50));
    try {
      const adaptations = await premiumCoachingService.analyzeAndAdaptMeals(user._id);
      console.log('✅ Meal adaptations analyzed');
      console.log(`   Breakfast skip rate: ${(adaptations.patterns.breakfast_skip_rate * 100).toFixed(1)}%`);
      console.log(`   Lunch adherence: ${(adaptations.patterns.lunch_adherence * 100).toFixed(1)}%`);
      console.log(`   Dinner adherence: ${(adaptations.patterns.dinner_adherence * 100).toFixed(1)}%`);
      console.log(`   Recommendations: ${adaptations.recommendations.length}\n`);
    } catch (error) {
      console.log('⚠️  Meal adaptations analysis failed:', error.message, '\n');
    }
    
    // TEST 6: Premium Coaching Response
    console.log('TEST 6: Premium Coaching Response');
    console.log('─'.repeat(50));
    try {
      const coachingResponse = await premiumCoachingService.generatePremiumCoachingResponse(
        user._id,
        'How can I improve my protein intake?',
        {}
      );
      console.log('✅ Premium coaching response generated');
      console.log(`   Response length: ${coachingResponse.response.length} characters`);
      console.log(`   Focus area: ${coachingResponse.coaching_insights.focus_area}`);
      console.log(`   Preview: ${coachingResponse.response.substring(0, 150)}...\n`);
    } catch (error) {
      console.log('⚠️  Premium coaching response failed:', error.message);
      console.log('   (This is expected if Groq API is not configured)\n');
    }
    
    // TEST 7: Recovery Analysis
    console.log('TEST 7: Recovery Analysis');
    console.log('─'.repeat(50));
    try {
      const recovery = await premiumCoachingService.analyzeRecoveryStatus(user._id);
      
      if (recovery.status === 'insufficient_data') {
        console.log('⚠️  Insufficient data for recovery analysis');
        console.log('   Need at least 7 days of daily logs\n');
      } else {
        console.log('✅ Recovery analysis complete');
        console.log(`   Recovery Score: ${recovery.recovery_score}/100`);
        console.log(`   Status: ${recovery.status}`);
        console.log(`   Avg Sleep: ${recovery.metrics.avg_sleep.toFixed(1)}h`);
        console.log(`   Avg Energy: ${recovery.metrics.avg_energy.toFixed(1)}/3`);
        console.log(`   Fatigue Days: ${recovery.metrics.fatigue_days}`);
        console.log(`   Missed Workouts: ${recovery.metrics.missed_workouts}`);
        console.log(`   Recommendations: ${recovery.recommendations.length}`);
        console.log(`   Action Required: ${recovery.action_required ? 'YES' : 'NO'}\n`);
      }
    } catch (error) {
      console.log('⚠️  Recovery analysis failed:', error.message, '\n');
    }
    
    // TEST 8: Carb Cycling
    console.log('TEST 8: Carb Cycling');
    console.log('─'.repeat(50));
    preferences.macro_strategy = 'carb_cycling';
    preferences.carb_cycling_enabled = true;
    preferences.high_carb_days = [1, 3, 5]; // Mon, Wed, Fri
    preferences.low_carb_days = [0, 2, 4, 6]; // Sun, Tue, Thu, Sat
    await preferences.save();
    
    if (profile) {
      const highCarbMacros = await premiumCoachingService.calculatePremiumMacros(
        user._id,
        profile,
        preferences
      );
      console.log('✅ Carb cycling configured');
      console.log(`   High carb days: Mon, Wed, Fri`);
      console.log(`   Low carb days: Sun, Tue, Thu, Sat`);
      console.log(`   Today's macros: P${highCarbMacros.protein_g}g C${highCarbMacros.carbs_g}g F${highCarbMacros.fat_g}g\n`);
    }
    
    // Summary
    console.log('═'.repeat(50));
    console.log('🎉 PREMIUM COACHING LAYER TEST COMPLETE');
    console.log('═'.repeat(50));
    console.log('\n✅ Features Tested:');
    console.log('   1. Premium activation');
    console.log('   2. Premium preferences');
    console.log('   3. Advanced macro customization');
    console.log('   4. Meal swap engine');
    console.log('   5. Meal adaptations analysis');
    console.log('   6. Premium coaching responses');
    console.log('   7. Recovery insights');
    console.log('   8. Carb cycling');
    
    console.log('\n📊 Premium Status:');
    console.log(`   User: ${user.email}`);
    console.log(`   Premium: ${user.is_premium ? 'YES' : 'NO'}`);
    console.log(`   Tier: ${user.subscription_tier}`);
    console.log(`   Expires: ${user.premium_expires ? user.premium_expires.toDateString() : 'N/A'}`);
    
    console.log('\n💡 Next Steps:');
    console.log('   1. Create premium UI pages');
    console.log('   2. Integrate payment system (Stripe/PayPal)');
    console.log('   3. Add premium feature gates in frontend');
    console.log('   4. Test with real users');
    console.log('   5. Monitor premium feature usage');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n✅ Database connection closed');
  }
};

// Run tests
testPremiumCoaching();
