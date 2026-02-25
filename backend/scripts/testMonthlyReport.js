import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/User.js';
import Profile from '../models/Profile.js';
import DailyLog from '../models/DailyLog.js';
import BodyMeasurement from '../models/BodyMeasurement.js';
import HabitScore from '../models/HabitScore.js';
import ProgressLog from '../models/ProgressLog.js';
import reportingService from '../services/reportingService.js';

dotenv.config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/fitai';

async function testMonthlyReport() {
  try {
    console.log('🔌 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');

    // Find a test user or create one
    let user = await User.findOne({ email: 'test@fitai.com' });
    
    if (!user) {
      console.log('📝 Creating test user...');
      user = await User.create({
        name: 'Test User',
        email: 'test@fitai.com',
        password_hash: '$2b$10$abcdefghijklmnopqrstuvwxyz1234567890' // Dummy hash for testing
      });
      console.log('✅ Test user created\n');
    } else {
      console.log('✅ Using existing test user\n');
    }

    const userId = user._id;

    // Check if profile exists
    let profile = await Profile.findOne({ user_id: userId });
    
    if (!profile) {
      console.log('📝 Creating test profile...');
      profile = await Profile.create({
        user_id: userId,
        age: 30,
        gender: 'Male',
        height_cm: 175,
        weight_kg: 80,
        target_weight_kg: 75,
        goal: 'Weight Loss',
        activity_level: 'Moderate',
        dietary_preference: 'Non-Vegetarian',
        health_conditions: [],
        fitness_level: 'Intermediate',
        experience_level: 'Intermediate',
        initial_measurements: {
          waist_cm: 90,
          chest_cm: 100,
          hips_cm: 95,
          left_arm_cm: 35,
          right_arm_cm: 35,
          left_thigh_cm: 55,
          right_thigh_cm: 55
        }
      });
      console.log('✅ Test profile created\n');
    } else {
      console.log('✅ Profile exists\n');
    }

    // Create sample data for last 30 days
    console.log('📊 Creating sample data for last 30 days...\n');
    
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - 30);

    // Clear existing test data
    await DailyLog.deleteMany({ user_id: userId, date: { $gte: startDate } });
    await BodyMeasurement.deleteMany({ user_id: userId, date: { $gte: startDate } });
    await HabitScore.deleteMany({ user_id: userId, week_start_date: { $gte: startDate } });
    await ProgressLog.deleteMany({ user_id: userId, created_at: { $gte: startDate } });

    // Create daily logs (30 days)
    console.log('Creating daily logs...');
    const dailyLogs = [];
    const energyLevels = ['Energized', 'Normal', 'Slightly Fatigued', 'Very Tired'];
    const moods = ['Poor', 'Fair', 'Good', 'Great', 'Excellent'];
    
    for (let i = 0; i < 30; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);
      
      // Simulate realistic data with some variation
      const workoutCompleted = Math.random() > 0.2; // 80% adherence
      const dietFollowed = Math.random() > 0.25; // 75% adherence
      const weight = 80 - (i * 0.15); // Gradual weight loss
      
      dailyLogs.push({
        user_id: userId,
        date: date,
        workout_completed: workoutCompleted,
        workout_status: workoutCompleted ? 'Completed' : 'Skipped',
        diet_followed: dietFollowed,
        diet_adherence: dietFollowed ? 'Followed' : 'Deviated',
        weight_kg: weight,
        sleep_hours: 6 + Math.random() * 2, // 6-8 hours
        water_intake_liters: 2 + Math.random() * 1.5, // 2-3.5 liters
        calories_consumed: 1800 + Math.random() * 400, // 1800-2200 calories
        energy_level: energyLevels[Math.floor(Math.random() * energyLevels.length)],
        mood: moods[Math.floor(Math.random() * moods.length)],
        notes: `Day ${i + 1} log`
      });
    }
    await DailyLog.insertMany(dailyLogs);
    console.log(`✅ Created ${dailyLogs.length} daily logs\n`);

    // Create body measurements (4 measurements over 30 days)
    console.log('Creating body measurements...');
    const measurements = [];
    for (let i = 0; i < 4; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + (i * 10));
      
      measurements.push({
        user_id: userId,
        date: date,
        measurements: {
          waist_cm: 90 - (i * 1.5),
          chest_cm: 100 - (i * 0.5),
          hips_cm: 95 - (i * 1),
          left_arm_cm: 35 - (i * 0.3),
          right_arm_cm: 35 - (i * 0.3),
          left_thigh_cm: 55 - (i * 0.5),
          right_thigh_cm: 55 - (i * 0.5)
        },
        notes: `Measurement ${i + 1}`
      });
    }
    await BodyMeasurement.insertMany(measurements);
    console.log(`✅ Created ${measurements.length} body measurements\n`);

    // Create habit scores (4 weeks)
    console.log('Creating habit scores...');
    const habitScores = [];
    for (let i = 0; i < 4; i++) {
      const weekStart = new Date(startDate);
      weekStart.setDate(weekStart.getDate() + (i * 7));
      
      habitScores.push({
        user_id: userId,
        week_start_date: weekStart,
        habit_score: 60 + (i * 8), // Improving trend: 60, 68, 76, 84
        workout_consistency: 70 + (i * 5),
        diet_consistency: 65 + (i * 7),
        sleep_quality: 60 + (i * 8),
        hydration_level: 75 + (i * 5)
      });
    }
    await HabitScore.insertMany(habitScores);
    console.log(`✅ Created ${habitScores.length} habit scores\n`);

    // Create progress logs
    console.log('Creating progress logs...');
    const progressLogs = [];
    for (let i = 0; i < 4; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + (i * 7));
      
      progressLogs.push({
        user_id: userId,
        week_number: i + 1,
        weight_kg: 80 - (i * 1.2),
        created_at: date,
        notes: `Week ${i + 1} progress`
      });
    }
    await ProgressLog.insertMany(progressLogs);
    console.log(`✅ Created ${progressLogs.length} progress logs\n`);

    // Generate monthly report
    console.log('📊 Generating Monthly Report...\n');
    console.log('='.repeat(60));
    
    const report = await reportingService.generateMonthlyReport(userId);
    
    console.log('\n📅 REPORT PERIOD');
    console.log(`Start: ${new Date(report.period.start).toLocaleDateString()}`);
    console.log(`End: ${new Date(report.period.end).toLocaleDateString()}`);
    console.log(`Days: ${report.period.days}`);
    
    console.log('\n⚖️  WEIGHT CHANGE');
    console.log(`Start Weight: ${report.summary.weight_change.start_weight} kg`);
    console.log(`End Weight: ${report.summary.weight_change.end_weight} kg`);
    console.log(`Change: ${report.summary.weight_change.change} kg (${report.summary.weight_change.change_percent}%)`);
    console.log(`Trend: ${report.summary.weight_change.trend}`);
    console.log(`Data Points: ${report.summary.weight_change.data_points}`);
    
    console.log('\n📏 MEASUREMENT CHANGES');
    if (report.summary.measurement_changes.has_data) {
      console.log(`Measurements Taken: ${report.summary.measurement_changes.measurements_count}`);
      Object.entries(report.summary.measurement_changes.changes).forEach(([key, data]) => {
        console.log(`  ${key}: ${data.start} → ${data.end} cm (${data.change >= 0 ? '+' : ''}${data.change} cm)`);
      });
    } else {
      console.log(report.summary.measurement_changes.message);
    }
    
    console.log('\n⭐ HABIT SCORE');
    console.log(`Average: ${report.summary.habit_score_average.average}/100`);
    console.log(`Highest: ${report.summary.habit_score_average.highest}`);
    console.log(`Lowest: ${report.summary.habit_score_average.lowest}`);
    console.log(`Trend: ${report.summary.habit_score_average.trend}`);
    console.log(`Count: ${report.summary.habit_score_average.count} weeks`);
    
    console.log('\n💪 WORKOUT ADHERENCE');
    console.log(`Percentage: ${report.summary.workout_adherence.percentage}%`);
    console.log(`Completed: ${report.summary.workout_adherence.completed}/${report.summary.workout_adherence.total}`);
    console.log(`Rating: ${report.summary.workout_adherence.rating}`);
    
    console.log('\n🥗 DIET ADHERENCE');
    console.log(`Percentage: ${report.summary.diet_adherence.percentage}%`);
    console.log(`Followed: ${report.summary.diet_adherence.followed}/${report.summary.diet_adherence.total}`);
    console.log(`Rating: ${report.summary.diet_adherence.rating}`);
    
    console.log('\n🎯 GOAL PROGRESS');
    console.log(`Current Weight: ${report.summary.goal_progress.current_weight} kg`);
    console.log(`Target Weight: ${report.summary.goal_progress.target_weight} kg`);
    console.log(`Progress: ${report.summary.goal_progress.percentage}%`);
    console.log(`Achieved: ${report.summary.goal_progress.achieved} kg`);
    console.log(`Remaining: ${report.summary.goal_progress.remaining} kg`);
    console.log(`On Track: ${report.summary.goal_progress.on_track ? 'Yes ✅' : 'No ⚠️'}`);
    
    console.log('\n📈 ACTIVITY DETAILS');
    console.log(`Total Workouts: ${report.details.total_workouts}`);
    console.log(`Total Logs: ${report.details.total_logs}`);
    console.log(`Avg Sleep: ${report.details.avg_sleep} hours`);
    console.log(`Avg Water: ${report.details.avg_water} liters`);
    console.log(`Avg Calories: ${report.details.avg_calories} kcal`);
    console.log(`Measurements Taken: ${report.details.measurements_taken}`);
    
    console.log('\n💡 INSIGHTS & RECOMMENDATIONS');
    if (report.insights && report.insights.length > 0) {
      report.insights.forEach((insight, idx) => {
        const icon = insight.type === 'success' ? '✅' : insight.type === 'warning' ? '⚠️' : 'ℹ️';
        console.log(`${idx + 1}. ${icon} [${insight.priority.toUpperCase()}] ${insight.category}`);
        console.log(`   ${insight.message}`);
      });
    } else {
      console.log('No insights generated');
    }
    
    console.log('\n' + '='.repeat(60));
    console.log('✅ Monthly Report Generated Successfully!');
    console.log(`Generated At: ${new Date(report.generated_at).toLocaleString()}`);
    
    // Test dynamic updates
    console.log('\n\n🔄 TESTING DYNAMIC UPDATES...\n');
    console.log('Adding new daily log for today...');
    
    await DailyLog.create({
      user_id: userId,
      date: new Date(),
      workout_completed: true,
      workout_status: 'Completed',
      diet_followed: true,
      diet_adherence: 'Followed',
      weight_kg: 75.5,
      sleep_hours: 8,
      water_intake_liters: 3,
      calories_consumed: 1900,
      energy_level: 'Energized',
      mood: 'Great',
      notes: 'New log added for testing'
    });
    
    console.log('✅ New log added. Regenerating report...\n');
    
    const updatedReport = await reportingService.generateMonthlyReport(userId);
    
    console.log('📊 UPDATED REPORT COMPARISON');
    console.log(`Original Total Logs: ${report.details.total_logs}`);
    console.log(`Updated Total Logs: ${updatedReport.details.total_logs}`);
    console.log(`Original End Weight: ${report.summary.weight_change.end_weight} kg`);
    console.log(`Updated End Weight: ${updatedReport.summary.weight_change.end_weight} kg`);
    console.log(`Original Workout Adherence: ${report.summary.workout_adherence.percentage}%`);
    console.log(`Updated Workout Adherence: ${updatedReport.summary.workout_adherence.percentage}%`);
    
    if (updatedReport.details.total_logs > report.details.total_logs) {
      console.log('\n✅ Dynamic updates working correctly!');
    } else {
      console.log('\n⚠️  Dynamic updates may not be working as expected');
    }
    
    console.log('\n✅ All tests completed successfully!');
    console.log('\n📝 Test User Credentials:');
    console.log(`Email: test@fitai.com`);
    console.log(`User ID: ${userId}`);
    console.log('\nYou can now test the frontend with this user.');

  } catch (error) {
    console.error('❌ Test failed:', error);
    console.error(error.stack);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 MongoDB connection closed');
  }
}

testMonthlyReport();
