import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { 
  generateAIWorkoutPlan, 
  generateAIDietPlan, 
  generateAICoachingResponse,
  generateAIPlanAdjustment,
  getApiKeyStats,
  isAIAvailable,
  API_KEY_TYPES
} from '../services/groqService.js';
import User from '../models/User.js';
import Profile from '../models/Profile.js';

// Load environment variables
dotenv.config();

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

const log = {
  success: (msg) => console.log(`${colors.green}✅ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}❌ ${msg}${colors.reset}`),
  warning: (msg) => console.log(`${colors.yellow}⚠️  ${msg}${colors.reset}`),
  info: (msg) => console.log(`${colors.blue}ℹ️  ${msg}${colors.reset}`),
  header: (msg) => console.log(`\n${colors.bright}${colors.cyan}${'='.repeat(60)}${colors.reset}`),
  title: (msg) => console.log(`${colors.bright}${colors.magenta}${msg}${colors.reset}`),
  divider: () => console.log(`${colors.cyan}${'-'.repeat(60)}${colors.reset}`)
};

/**
 * Test Multi-API Key System
 * Verifies all API keys are configured and working
 */
async function testMultiApiKeys() {
  try {
    log.header();
    log.title('🔑 MULTI-API KEY SYSTEM TEST');
    log.header();

    // Connect to MongoDB
    log.info('Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fitai');
    log.success('MongoDB connected');

    // Step 1: Check API Key Configuration
    log.header();
    log.title('STEP 1: API Key Configuration Check');
    log.divider();

    const keyConfig = {
      WORKOUT: process.env.GROQ_API_KEY_WORKOUT,
      DIET: process.env.GROQ_API_KEY_DIET,
      ASSISTANT: process.env.GROQ_API_KEY_ASSISTANT,
      PLAN_ADJUSTMENT: process.env.GROQ_API_KEY_PLAN_ADJUSTMENT,
      FALLBACK: process.env.GROQ_API_KEY
    };

    let configuredKeys = 0;
    for (const [type, key] of Object.entries(keyConfig)) {
      if (key && key !== 'your_groq_api_key_here' && 
          !key.includes('your_groq_api_key_for')) {
        log.success(`${type}: Configured (${key.substring(0, 10)}...)`);
        configuredKeys++;
      } else {
        log.warning(`${type}: Not configured`);
      }
    }

    log.divider();
    log.info(`Total configured keys: ${configuredKeys}/5`);

    if (configuredKeys === 0) {
      log.error('No API keys configured! Please update backend/.env file');
      process.exit(1);
    }

    // Step 2: Check AI Availability
    log.header();
    log.title('STEP 2: AI Availability Check');
    log.divider();

    const availability = {
      WORKOUT: isAIAvailable(API_KEY_TYPES.WORKOUT),
      DIET: isAIAvailable(API_KEY_TYPES.DIET),
      ASSISTANT: isAIAvailable(API_KEY_TYPES.ASSISTANT),
      PLAN_ADJUSTMENT: isAIAvailable(API_KEY_TYPES.PLAN_ADJUSTMENT)
    };

    for (const [type, available] of Object.entries(availability)) {
      if (available) {
        log.success(`${type}: AI Available`);
      } else {
        log.warning(`${type}: AI Not Available (will use fallback)`);
      }
    }

    // Step 3: Get or Create Test User
    log.header();
    log.title('STEP 3: Test User Setup');
    log.divider();

    let testUser = await User.findOne({ email: 'test@fitai.com' });
    if (!testUser) {
      log.info('Creating test user...');
      testUser = new User({
        name: 'Test User',
        email: 'test@fitai.com',
        password_hash: 'testpassword123'
      });
      await testUser.save();
      log.success('Test user created');
    } else {
      log.info('Using existing test user');
    }

    let testProfile = await Profile.findOne({ user_id: testUser._id });
    if (!testProfile) {
      log.info('Creating test profile...');
      testProfile = new Profile({
        user_id: testUser._id,
        age: 30,
        gender: 'Male',
        height_cm: 175,
        weight_kg: 75,
        current_weight_kg: 75,
        target_weight_kg: 70,
        goal: 'Weight Loss',
        activity_level: 'Moderate',
        experience_level: 'Intermediate',
        available_days_per_week: 4,
        training_days_per_week: 4,
        dietary_preferences: 'Vegetarian',
        allergies: 'None',
        injuries_limitations: 'None',
        bmi: 24.5,
        bmr: 1700,
        tdee: 2635,
        daily_calorie_target: 2200,
        protein_grams: 165,
        carbs_grams: 220,
        fat_grams: 73
      });
      await testProfile.save();
      log.success('Test profile created');
    } else {
      log.info('Using existing test profile');
    }

    log.success(`Test user ID: ${testUser._id}`);

    // Step 4: Test Workout API Key
    log.header();
    log.title('STEP 4: Testing WORKOUT API Key');
    log.divider();

    if (availability.WORKOUT) {
      try {
        log.info('Calling generateAIWorkoutPlan()...');
        const startTime = Date.now();
        const workoutPlan = await generateAIWorkoutPlan(testUser._id, 1);
        const duration = Date.now() - startTime;
        
        log.success(`Workout plan generated in ${duration}ms`);
        log.info(`Week summary: ${workoutPlan.week_summary?.substring(0, 80)}...`);
        log.info(`Workout days: ${workoutPlan.weekly_schedule?.length || 0}`);
      } catch (error) {
        log.error(`Workout generation failed: ${error.message}`);
      }
    } else {
      log.warning('Skipping workout test - API not available');
    }

    // Step 5: Test Diet API Key
    log.header();
    log.title('STEP 5: Testing DIET API Key');
    log.divider();

    if (availability.DIET) {
      try {
        log.info('Calling generateAIDietPlan()...');
        const startTime = Date.now();
        const dietPlan = await generateAIDietPlan(testUser._id, 1);
        const duration = Date.now() - startTime;
        
        log.success(`Diet plan generated in ${duration}ms`);
        log.info(`Week summary: ${dietPlan.week_summary?.substring(0, 80)}...`);
        log.info(`Daily meals: ${dietPlan.daily_meals?.length || 0}`);
      } catch (error) {
        log.error(`Diet generation failed: ${error.message}`);
      }
    } else {
      log.warning('Skipping diet test - API not available');
    }

    // Step 6: Test Assistant API Key
    log.header();
    log.title('STEP 6: Testing ASSISTANT API Key');
    log.divider();

    if (availability.ASSISTANT) {
      try {
        log.info('Calling generateAICoachingResponse()...');
        const startTime = Date.now();
        const response = await generateAICoachingResponse(
          testUser._id, 
          'What should I focus on this week?'
        );
        const duration = Date.now() - startTime;
        
        log.success(`Coaching response generated in ${duration}ms`);
        log.info(`Response: ${response.response?.substring(0, 100)}...`);
        log.info(`Confidence: ${response.confidence}`);
      } catch (error) {
        log.error(`Assistant response failed: ${error.message}`);
      }
    } else {
      log.warning('Skipping assistant test - API not available');
    }

    // Step 7: Test Plan Adjustment API Key
    log.header();
    log.title('STEP 7: Testing PLAN_ADJUSTMENT API Key');
    log.divider();

    if (availability.PLAN_ADJUSTMENT) {
      try {
        log.info('Calling generateAIPlanAdjustment()...');
        const startTime = Date.now();
        
        // Mock user data for plan adjustment
        const mockData = {
          age: 30,
          gender: 'Male',
          goal: 'Weight Loss',
          currentWeight: 75,
          targetWeight: 70,
          activityLevel: 'Moderate',
          experienceLevel: 'Intermediate',
          weekWeights: [76, 75.5, 75.2, 75],
          avgWeeklyChange: -0.33,
          workoutAdherence: 85,
          dietAdherence: 80,
          habitScore: 82,
          fatigueCount: 1,
          currentCalories: 2200,
          currentMacros: { protein: 30, carbs: 40, fat: 30 },
          setsPerWeek: 48,
          splitType: 'Upper/Lower'
        };
        
        const adjustment = await generateAIPlanAdjustment(mockData);
        const duration = Date.now() - startTime;
        
        log.success(`Plan adjustment generated in ${duration}ms`);
        log.info(`Adjustment required: ${adjustment.adjustmentRequired}`);
        log.info(`Reason: ${adjustment.reason?.substring(0, 80)}...`);
        if (adjustment.adjustmentRequired) {
          log.info(`New calories: ${adjustment.newCalorieTarget}`);
        }
      } catch (error) {
        log.error(`Plan adjustment failed: ${error.message}`);
      }
    } else {
      log.warning('Skipping plan adjustment test - API not available');
    }

    // Step 8: Get API Statistics
    log.header();
    log.title('STEP 8: API Usage Statistics');
    log.divider();

    const stats = getApiKeyStats();
    
    log.info('API Key Availability:');
    for (const [key, available] of Object.entries(stats.availableKeys)) {
      const status = available ? '✅ Available' : '❌ Not Available';
      console.log(`  ${key}: ${status}`);
    }

    log.divider();
    log.info('API Call Statistics:');
    for (const [type, stat] of Object.entries(stats.stats)) {
      if (stat.calls > 0) {
        console.log(`  ${type}:`);
        console.log(`    Calls: ${stat.calls}`);
        console.log(`    Errors: ${stat.errors}`);
        console.log(`    Last Used: ${stat.lastUsed ? new Date(stat.lastUsed).toLocaleString() : 'Never'}`);
        console.log(`    Success Rate: ${((stat.calls - stat.errors) / stat.calls * 100).toFixed(1)}%`);
      }
    }

    // Final Summary
    log.header();
    log.title('📊 TEST SUMMARY');
    log.divider();

    const totalCalls = Object.values(stats.stats).reduce((sum, s) => sum + s.calls, 0);
    const totalErrors = Object.values(stats.stats).reduce((sum, s) => sum + s.errors, 0);
    const successRate = totalCalls > 0 ? ((totalCalls - totalErrors) / totalCalls * 100).toFixed(1) : 0;

    console.log(`  Configured Keys: ${configuredKeys}/5`);
    console.log(`  Total API Calls: ${totalCalls}`);
    console.log(`  Total Errors: ${totalErrors}`);
    console.log(`  Success Rate: ${successRate}%`);

    log.divider();

    if (configuredKeys === 5 && totalErrors === 0) {
      log.success('🎉 ALL TESTS PASSED! Multi-API key system is fully operational!');
    } else if (configuredKeys >= 1 && totalErrors === 0) {
      log.success('✅ Tests passed with available keys');
      log.warning(`Consider adding ${5 - configuredKeys} more keys for optimal performance`);
    } else if (totalErrors > 0) {
      log.warning('⚠️  Some tests failed - check error messages above');
    }

    log.header();

  } catch (error) {
    log.error(`Test failed: ${error.message}`);
    console.error(error);
  } finally {
    // Close MongoDB connection
    await mongoose.connection.close();
    log.info('MongoDB connection closed');
    process.exit(0);
  }
}

// Run the test
testMultiApiKeys();
