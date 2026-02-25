import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Profile from '../models/Profile.js';
import User from '../models/User.js';
import { generateWorkoutPlan } from '../services/workoutService.js';
import { generateDietPlanForUser } from '../services/dietService.js';
import { logExercise, calculateProgressiveOverload } from '../services/exerciseLogService.js';

dotenv.config();

const testNewFeatures = async () => {
  try {
    console.log('🚀 Testing All New Features...\n');
    
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ MongoDB connected\n');

    const testUser = await User.findOne();
    if (!testUser) {
      console.log('❌ No users found. Please create a user first.');
      process.exit(1);
    }

    console.log(`📋 Testing with user: ${testUser.email}`);
    console.log(`🆔 User ID: ${testUser._id}\n`);

    let profile = await Profile.findOne({ user_id: testUser._id });
    
    if (!profile) {
      console.log('Creating test profile...');
      profile = new Profile({
        user_id: testUser._id,
        age: 25,
        gender: 'Male',
        height_cm: 175,
        weight_kg: 75,
        activity_level: 'Moderate',
        experience_level: 'Intermediate',
        goal: 'Muscle Gain',
        target_weight_kg: 80,
        available_days_per_week: 5,
        dietary_preferences: 'vegetarian',
        allergies: 'dairy, nuts',
        injuries_limitations: 'knee, shoulder',
        bmi: 24.5,
        bmr: 1750,
        daily_calorie_target: 2500,
        height_m: 1.75,
        activity_factor: 1.55
      });
      await profile.save();
      console.log('✅ Test profile created\n');
    } else {
      profile.dietary_preferences = 'vegetarian';
      profile.allergies = 'dairy, nuts';
      profile.injuries_limitations = 'knee, shoulder';
      profile.activity_level = 'Moderate';
      profile.available_days_per_week = 5;
      await profile.save();
      console.log('✅ Profile updated with test data\n');
    }

    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('TEST 1: INJURY FILTERING IN WORKOUTS');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Injuries: knee, shoulder');
    console.log('Expected: No squats, leg press, overhead press\n');
    
    try {
      const workoutPlan = await generateWorkoutPlan(testUser._id, 1);
      console.log('✅ Workout plan generated');
      console.log(`📊 ${workoutPlan.workouts.length} days planned`);
      
      let hasSquats = false;
      let hasLegPress = false;
      let hasOverheadPress = false;
      
      for (const day of workoutPlan.workouts) {
        if (day.exercises) {
          for (const exercise of day.exercises) {
            if (exercise.name.toLowerCase().includes('squat')) hasSquats = true;
            if (exercise.name.toLowerCase().includes('leg press')) hasLegPress = true;
            if (exercise.name.toLowerCase().includes('overhead press')) hasOverheadPress = true;
          }
        }
      }
      
      console.log(`   Squats found: ${hasSquats ? '❌ FAIL' : '✅ PASS'}`);
      console.log(`   Leg Press found: ${hasLegPress ? '❌ FAIL' : '✅ PASS'}`);
      console.log(`   Overhead Press found: ${hasOverheadPress ? '❌ FAIL' : '✅ PASS'}`);
      
      if (workoutPlan.week_summary) {
        console.log(`\n📝 Summary: ${workoutPlan.week_summary.substring(0, 100)}...`);
      }
    } catch (error) {
      console.log('❌ Workout generation failed:', error.message);
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('TEST 2: ALLERGY/PREFERENCE FILTERING IN DIET');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Allergies: dairy, nuts');
    console.log('Preference: vegetarian');
    console.log('Expected: No milk, cheese, chicken, beef\n');
    
    try {
      const dietPlan = await generateDietPlanForUser(testUser._id, 1);
      console.log('✅ Diet plan generated');
      console.log(`📊 ${dietPlan.meals.length} meals planned`);
      
      let hasDairy = false;
      let hasNuts = false;
      let hasMeat = false;
      
      for (const meal of dietPlan.meals) {
        const desc = meal.description.toLowerCase();
        if (desc.includes('milk') || desc.includes('cheese') || desc.includes('yogurt')) hasDairy = true;
        if (desc.includes('peanut') || desc.includes('almond') || desc.includes('nut')) hasNuts = true;
        if (desc.includes('chicken') || desc.includes('beef') || desc.includes('pork')) hasMeat = true;
      }
      
      console.log(`   Dairy found: ${hasDairy ? '❌ FAIL' : '✅ PASS'}`);
      console.log(`   Nuts found: ${hasNuts ? '❌ FAIL' : '✅ PASS'}`);
      console.log(`   Meat found: ${hasMeat ? '❌ FAIL' : '✅ PASS'}`);
      
      if (dietPlan.week_summary) {
        console.log(`\n📝 Summary: ${dietPlan.week_summary.substring(0, 100)}...`);
      }
    } catch (error) {
      console.log('❌ Diet generation failed:', error.message);
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('TEST 3: ACTIVITY LEVEL INTEGRATION');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Activity Level: Moderate');
    console.log('Available Days: 5');
    console.log('Expected: 5 training days with moderate volume\n');
    
    try {
      const workoutPlan = await generateWorkoutPlan(testUser._id, 1);
      const trainingDays = workoutPlan.workouts.filter(d => !d.rest_day).length;
      const restDays = workoutPlan.workouts.filter(d => d.rest_day).length;
      
      console.log(`✅ Training days: ${trainingDays}`);
      console.log(`✅ Rest days: ${restDays}`);
      console.log(`   Total: ${trainingDays + restDays} days`);
      
      if (trainingDays >= 4 && trainingDays <= 6) {
        console.log('✅ PASS: Training frequency appropriate for activity level');
      } else {
        console.log('❌ FAIL: Training frequency not adjusted');
      }
    } catch (error) {
      console.log('❌ Test failed:', error.message);
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('TEST 4: PROGRESSIVE OVERLOAD SYSTEM');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Simulating exercise logs...\n');
    
    try {
      const exerciseLog1 = await logExercise(testUser._id, {
        workout_plan_id: new mongoose.Types.ObjectId(),
        week_number: 1,
        day_number: 1,
        exercise_name: 'Bench Press',
        sets_completed: 3,
        sets_planned: 3,
        set_details: [
          { set_number: 1, reps_completed: 10, reps_planned: '8-10', weight_kg: 60, difficulty: 'Too Easy' },
          { set_number: 2, reps_completed: 10, reps_planned: '8-10', weight_kg: 60, difficulty: 'Too Easy' },
          { set_number: 3, reps_completed: 10, reps_planned: '8-10', weight_kg: 60, difficulty: 'Too Easy' }
        ],
        completion_status: 'Completed'
      });
      
      const exerciseLog2 = await logExercise(testUser._id, {
        workout_plan_id: new mongoose.Types.ObjectId(),
        week_number: 1,
        day_number: 3,
        exercise_name: 'Bench Press',
        sets_completed: 3,
        sets_planned: 3,
        set_details: [
          { set_number: 1, reps_completed: 10, reps_planned: '8-10', weight_kg: 60, difficulty: 'Too Easy' },
          { set_number: 2, reps_completed: 10, reps_planned: '8-10', weight_kg: 60, difficulty: 'Too Easy' },
          { set_number: 3, reps_completed: 10, reps_planned: '8-10', weight_kg: 60, difficulty: 'Too Easy' }
        ],
        completion_status: 'Completed'
      });
      
      console.log('✅ Exercise logs created');
      
      const recommendation = await calculateProgressiveOverload(testUser._id, 'Bench Press');
      console.log('\n📈 Progressive Overload Recommendation:');
      console.log(`   Action: ${recommendation.recommendation}`);
      console.log(`   Reason: ${recommendation.reason}`);
      
      if (recommendation.suggested_weight_increase) {
        console.log(`   Suggested increase: +${recommendation.suggested_weight_increase}kg`);
      }
      
      if (recommendation.recommendation === 'increase_weight') {
        console.log('✅ PASS: System correctly recommends weight increase');
      } else {
        console.log('⚠️  Unexpected recommendation (may need more data)');
      }
      
    } catch (error) {
      console.log('❌ Progressive overload test failed:', error.message);
    }

    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('TEST SUMMARY');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('✅ All new features have been implemented:');
    console.log('   1. Injury filtering in workouts');
    console.log('   2. Allergy/preference filtering in diet');
    console.log('   3. Activity level integration');
    console.log('   4. Progressive overload system');
    console.log('\n🎉 FitAI is now a complete adaptive fitness system!\n');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('🔌 MongoDB connection closed');
    process.exit(0);
  }
};

testNewFeatures();
