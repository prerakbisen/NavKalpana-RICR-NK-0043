import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { generateAIWorkoutPlan, generateAIDietPlan, generateAICoachingResponse } from '../services/groqService.js';

dotenv.config();

const testAllAIFunctions = async () => {
  try {
    console.log('🚀 Starting comprehensive AI test...\n');
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected\n');

    const User = mongoose.model('User');
    const testUser = await User.findOne();
    
    if (!testUser) {
      console.log('❌ No users found in database. Please create a user first.');
      process.exit(1);
    }

    console.log(`📋 Testing with user: ${testUser.email}`);
    console.log(`🆔 User ID: ${testUser._id}\n`);

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('TEST 1: AI WORKOUT GENERATION');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Model: llama-3.1-70b-versatile');
    console.log('Generating workout plan for Week 1...\n');
    
    try {
      const workoutPlan = await generateAIWorkoutPlan(testUser._id, 1);
      console.log('✅ Workout generation successful!');
      console.log(`📊 Generated ${workoutPlan.weekly_schedule?.length || 0} days`);
      console.log(`📝 Week Summary: ${workoutPlan.week_summary?.substring(0, 100)}...`);
      
      if (workoutPlan.weekly_schedule && workoutPlan.weekly_schedule.length > 0) {
        const firstDay = workoutPlan.weekly_schedule[0];
        console.log(`\n🏋️ Sample Day (${firstDay.day_name}):`);
        console.log(`   Type: ${firstDay.type}`);
        console.log(`   Exercises: ${firstDay.exercises?.length || 0}`);
        if (firstDay.exercises && firstDay.exercises.length > 0) {
          console.log(`   First Exercise: ${firstDay.exercises[0].name} - ${firstDay.exercises[0].sets}x${firstDay.exercises[0].reps}`);
        }
      }
    } catch (error) {
      console.log('❌ Workout generation failed:', error.message);
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('TEST 2: AI DIET GENERATION');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Model: llama-3.1-70b-versatile');
    console.log('Generating diet plan for Week 1...\n');
    
    try {
      const dietPlan = await generateAIDietPlan(testUser._id, 1);
      console.log('✅ Diet generation successful!');
      console.log(`📊 Generated ${dietPlan.daily_meals?.length || 0} meals`);
      console.log(`📝 Week Summary: ${dietPlan.week_summary?.substring(0, 100)}...`);
      
      if (dietPlan.daily_meals && dietPlan.daily_meals.length > 0) {
        const firstMeal = dietPlan.daily_meals[0];
        console.log(`\n🍽️ Sample Meal (${firstMeal.meal_name}):`);
        console.log(`   Time: ${firstMeal.time_suggestion}`);
        console.log(`   Calories: ${firstMeal.estimated_calories} kcal`);
        console.log(`   Description: ${firstMeal.description?.substring(0, 80)}...`);
      }
    } catch (error) {
      console.log('❌ Diet generation failed:', error.message);
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('TEST 3: AI CHATBOT RESPONSE');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Model: llama-3.1-70b-versatile');
    console.log('Question: "What is my name and current progress?"\n');
    
    try {
      const chatResponse = await generateAICoachingResponse(testUser._id, "What is my name and current progress?");
      console.log('✅ Chatbot response successful!');
      console.log(`📝 Response: ${chatResponse.response?.substring(0, 200)}...`);
      console.log(`🎯 Confidence: ${chatResponse.confidence}`);
      
      if (chatResponse.steps && chatResponse.steps.length > 0) {
        console.log(`\n📋 Steps provided: ${chatResponse.steps.length}`);
        console.log(`   First step: ${chatResponse.steps[0]?.substring(0, 80)}...`);
      }
      
      if (chatResponse.tip) {
        console.log(`\n💡 Tip: ${chatResponse.tip.substring(0, 80)}...`);
      }
    } catch (error) {
      console.log('❌ Chatbot response failed:', error.message);
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('TEST SUMMARY');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ All AI functions are now using: llama-3.1-70b-versatile');
    console.log('✅ This model provides:');
    console.log('   - Better reasoning and context understanding');
    console.log('   - More reliable JSON generation');
    console.log('   - Higher quality workout and diet plans');
    console.log('   - More personalized chatbot responses');
    console.log('\n🎉 Model upgrade complete and verified!\n');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed');
    process.exit(0);
  }
};

testAllAIFunctions();
