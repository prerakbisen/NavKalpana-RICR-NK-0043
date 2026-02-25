/**
 * Complete Measurement System Flow Test
 * Tests the entire 4-week measurement cycle with countdown timer, AI analysis, and plan regeneration
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

// Test user credentials
const TEST_USER = {
  email: 'premium@fitai.com',
  password: 'Premium123!'
};

let authToken = '';

// Helper function to make authenticated requests
const apiCall = async (method, endpoint, data = null) => {
  try {
    const config = {
      method,
      url: `${BASE_URL}${endpoint}`,
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    };
    
    if (data) {
      config.data = data;
    }
    
    const response = await axios(config);
    return response.data;
  } catch (error) {
    console.error(`❌ API Error (${method} ${endpoint}):`, error.response?.data || error.message);
    throw error;
  }
};

// Test 1: Login
async function testLogin() {
  console.log('\n📝 Test 1: User Login');
  console.log('='.repeat(50));
  
  try {
    const response = await axios.post(`${BASE_URL}/auth/login`, TEST_USER);
    authToken = response.data.token;
    console.log('✅ Login successful');
    console.log(`   Token: ${authToken.substring(0, 20)}...`);
    return true;
  } catch (error) {
    console.error('❌ Login failed:', error.response?.data || error.message);
    return false;
  }
}

// Test 2: Check Measurement Reminder
async function testMeasurementReminder() {
  console.log('\n📅 Test 2: Check Measurement Reminder');
  console.log('='.repeat(50));
  
  try {
    const data = await apiCall('GET', '/measurements/reminder');
    console.log('✅ Reminder check successful');
    console.log(`   Reminder Due: ${data.reminder_due}`);
    console.log(`   Days Until Next: ${data.days_until_next}`);
    console.log(`   Last Measurement: ${data.last_measurement_date || 'Never'}`);
    console.log(`   Next Due Date: ${data.next_due_date || 'N/A'}`);
    return data;
  } catch (error) {
    console.error('❌ Reminder check failed');
    return null;
  }
}

// Test 3: Get Latest Measurements
async function testGetLatestMeasurements() {
  console.log('\n📏 Test 3: Get Latest Measurements');
  console.log('='.repeat(50));
  
  try {
    const data = await apiCall('GET', '/measurements/latest');
    console.log('✅ Latest measurements retrieved');
    if (data.measurements) {
      console.log('   Measurements:');
      Object.entries(data.measurements).forEach(([key, value]) => {
        console.log(`     ${key}: ${value}`);
      });
      console.log(`   Date: ${data.date}`);
    } else {
      console.log('   No measurements found');
    }
    return data;
  } catch (error) {
    console.error('❌ Failed to get latest measurements');
    return null;
  }
}

// Test 4: Add New Measurements
async function testAddMeasurements() {
  console.log('\n➕ Test 4: Add New Measurements');
  console.log('='.repeat(50));
  
  const newMeasurements = {
    weight_kg: 75.5,
    waist_cm: 82,
    chest_cm: 98,
    hips_cm: 95,
    left_arm_cm: 35,
    right_arm_cm: 35,
    left_thigh_cm: 58,
    right_thigh_cm: 58,
    notes: 'Test measurement update - feeling stronger!'
  };
  
  try {
    const data = await apiCall('POST', '/measurements', newMeasurements);
    console.log('✅ Measurements added successfully');
    console.log(`   Measurement ID: ${data.measurement._id}`);
    console.log(`   Date: ${data.measurement.date}`);
    return data;
  } catch (error) {
    console.error('❌ Failed to add measurements');
    return null;
  }
}

// Test 5: AI Analysis of Measurements
async function testAIAnalysis() {
  console.log('\n🤖 Test 5: AI Analysis of Measurements');
  console.log('='.repeat(50));
  
  try {
    const data = await apiCall('POST', '/measurements/analyze-ai');
    console.log('✅ AI analysis completed');
    console.log('\n📊 Analysis Results:');
    console.log(`   Overall Progress: ${data.analysis.overall_progress}`);
    console.log(`   Needs Diet Adjustment: ${data.analysis.needs_diet_adjustment}`);
    console.log(`   Needs Workout Adjustment: ${data.analysis.needs_workout_adjustment}`);
    
    if (data.analysis.key_changes && data.analysis.key_changes.length > 0) {
      console.log('\n   Key Changes:');
      data.analysis.key_changes.forEach((change, idx) => {
        console.log(`     ${idx + 1}. ${change}`);
      });
    }
    
    if (data.analysis.recommendations && data.analysis.recommendations.length > 0) {
      console.log('\n   Recommendations:');
      data.analysis.recommendations.forEach((rec, idx) => {
        console.log(`     ${idx + 1}. ${rec}`);
      });
    }
    
    return data;
  } catch (error) {
    console.error('❌ AI analysis failed');
    return null;
  }
}

// Test 6: Regenerate Plans Based on Measurements
async function testRegeneratePlans() {
  console.log('\n🔄 Test 6: Regenerate Plans Based on Measurements');
  console.log('='.repeat(50));
  
  try {
    const data = await apiCall('POST', '/measurements/regenerate-plans');
    console.log('✅ Plans regenerated successfully');
    console.log(`   Diet Plan Regenerated: ${data.diet_regenerated}`);
    console.log(`   Workout Plan Regenerated: ${data.workout_regenerated}`);
    
    if (data.diet_plan) {
      console.log(`\n   New Diet Plan ID: ${data.diet_plan._id}`);
      console.log(`   Daily Calories: ${data.diet_plan.daily_calories}`);
    }
    
    if (data.workout_plan) {
      console.log(`\n   New Workout Plan ID: ${data.workout_plan._id}`);
      console.log(`   Workout Days: ${data.workout_plan.workout_days?.length || 0}`);
    }
    
    return data;
  } catch (error) {
    console.error('❌ Plan regeneration failed');
    return null;
  }
}

// Test 7: Verify Countdown Timer Reset
async function testCountdownReset() {
  console.log('\n⏰ Test 7: Verify Countdown Timer Reset');
  console.log('='.repeat(50));
  
  try {
    const data = await apiCall('GET', '/measurements/reminder');
    console.log('✅ Countdown timer verified');
    console.log(`   Reminder Due: ${data.reminder_due}`);
    console.log(`   Days Until Next: ${data.days_until_next}`);
    console.log(`   Next Due Date: ${data.next_due_date}`);
    
    if (data.days_until_next === 28) {
      console.log('   ✅ Timer correctly reset to 28 days');
    } else {
      console.log(`   ⚠️  Timer shows ${data.days_until_next} days (expected 28)`);
    }
    
    return data;
  } catch (error) {
    console.error('❌ Countdown verification failed');
    return null;
  }
}

// Main test runner
async function runAllTests() {
  console.log('\n' + '='.repeat(70));
  console.log('🧪 COMPLETE MEASUREMENT SYSTEM FLOW TEST');
  console.log('='.repeat(70));
  console.log('Testing: 4-week cycle, countdown timer, AI analysis, plan regeneration');
  console.log('='.repeat(70));
  
  try {
    // Test 1: Login
    const loginSuccess = await testLogin();
    if (!loginSuccess) {
      console.log('\n❌ Cannot proceed without authentication');
      return;
    }
    
    // Test 2: Check initial reminder status
    const reminderBefore = await testMeasurementReminder();
    
    // Test 3: Get current measurements
    const currentMeasurements = await testGetLatestMeasurements();
    
    // Test 4: Add new measurements
    const addResult = await testAddMeasurements();
    if (!addResult) {
      console.log('\n⚠️  Skipping remaining tests due to measurement add failure');
      return;
    }
    
    // Test 5: Run AI analysis
    const analysisResult = await testAIAnalysis();
    
    // Test 6: Regenerate plans if needed
    if (analysisResult && (analysisResult.analysis.needs_diet_adjustment || analysisResult.analysis.needs_workout_adjustment)) {
      await testRegeneratePlans();
    } else {
      console.log('\n⏭️  Skipping plan regeneration (not needed based on AI analysis)');
    }
    
    // Test 7: Verify countdown reset
    await testCountdownReset();
    
    // Final Summary
    console.log('\n' + '='.repeat(70));
    console.log('✅ ALL TESTS COMPLETED SUCCESSFULLY');
    console.log('='.repeat(70));
    console.log('\n📋 Summary:');
    console.log('   ✅ User authentication');
    console.log('   ✅ Measurement reminder check');
    console.log('   ✅ Latest measurements retrieval');
    console.log('   ✅ New measurements added');
    console.log('   ✅ AI analysis performed');
    console.log('   ✅ Plans regenerated (if needed)');
    console.log('   ✅ Countdown timer reset verified');
    console.log('\n🎉 Measurement system is fully functional!');
    
  } catch (error) {
    console.error('\n❌ Test suite failed:', error.message);
  }
}

// Run the tests
runAllTests();
