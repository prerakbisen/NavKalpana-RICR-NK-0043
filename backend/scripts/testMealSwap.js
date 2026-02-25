import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '../.env') });

import User from '../models/User.js';
import DietPlan from '../models/DietPlan.js';
import premiumCoachingService from '../services/premiumCoachingService.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/fitai';

async function testMealSwap() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find premium user
    const user = await User.findOne({ email: 'premium@fitai.com' });
    if (!user) {
      console.error('❌ Premium user not found. Run testPremiumFeatures.js first.');
      return;
    }

    console.log(`✅ Found user: ${user.email}`);
    const userId = user._id;

    // Find diet plan
    const dietPlan = await DietPlan.findOne({ user_id: userId }).sort({ created_at: -1 });
    if (!dietPlan) {
      console.error('❌ No diet plan found. Create a diet plan first.');
      return;
    }

    console.log(`✅ Found diet plan with ${dietPlan.meals.length} meals\n`);

    // Test different swap reasons
    const testReasons = [
      'I need more protein',
      'Want a vegetarian option',
      'Need something quick and easy',
      'Lower carb version please',
      ''
    ];

    for (const reason of testReasons) {
      console.log('='.repeat(60));
      console.log(`TEST: Swapping meal with reason: "${reason || '(no reason)'}"`);
      console.log('='.repeat(60));

      try {
        const result = await premiumCoachingService.swapMeal(
          userId,
          dietPlan._id,
          1, // Breakfast
          reason
        );

        console.log('\n✅ SWAP SUCCESSFUL!');
        console.log(`\nOriginal: ${result.original_meal.meal_name}`);
        console.log(`  Calories: ${result.original_meal.estimated_calories}`);
        console.log(`  Macros: P:${result.original_meal.macros.protein_g}g C:${result.original_meal.macros.carbs_g}g F:${result.original_meal.macros.fat_g}g`);
        
        console.log(`\nSwapped: ${result.swapped_meal.meal_name}`);
        console.log(`  Description: ${result.swapped_meal.description}`);
        console.log(`  Calories: ${result.swapped_meal.calories}`);
        console.log(`  Macros: P:${result.swapped_meal.macros.protein_g}g C:${result.swapped_meal.macros.carbs_g}g F:${result.swapped_meal.macros.fat_g}g`);
        console.log(`  Ingredients: ${result.swapped_meal.ingredients.join(', ')}`);
        console.log(`  Prep: ${result.swapped_meal.preparation_tips.substring(0, 100)}...`);
        
        console.log('\n✅ Test passed!\n');
        
        // Wait a bit between tests
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error) {
        console.error('\n❌ SWAP FAILED!');
        console.error(`Error: ${error.message}`);
        console.error(`Stack: ${error.stack}\n`);
      }
    }

    console.log('='.repeat(60));
    console.log('✅ ALL MEAL SWAP TESTS COMPLETED');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error(error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 MongoDB connection closed');
  }
}

testMealSwap();
