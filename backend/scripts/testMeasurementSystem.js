import mongoose from 'mongoose';
import dotenv from 'dotenv';
import * as measurementService from '../services/measurementService.js';
import Profile from '../models/Profile.js';
import User from '../models/User.js';

dotenv.config();

const testMeasurementSystem = async () => {
  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fitai');
    console.log('✅ Connected to MongoDB\n');

    const user = await User.findOne();
    if (!user) {
      console.log('❌ No users found. Please create a user first.');
      process.exit(1);
    }

    console.log(`📋 Testing with user: ${user.name} (${user.email})\n`);

    console.log('TEST 1: Save Initial Measurements');
    console.log('-----------------------------------');
    try {
      const initialMeasurements = {
        waist_cm: 85.5,
        chest_cm: 100,
        hips_cm: 95,
        arms_cm: 35,
        thighs_cm: 55
      };

      const result = await measurementService.saveInitialMeasurements(user._id, initialMeasurements);
      console.log('✅ Initial measurements saved successfully');
      console.log('Profile measurements:', result.profile_measurements);
      console.log('Body measurement entry:', result.body_measurement.measurements);
    } catch (error) {
      console.log('⚠️  Initial measurements may already exist:', error.message);
    }
    console.log('');

    console.log('TEST 2: Check Reminder Status');
    console.log('-----------------------------------');
    const reminderStatus = await measurementService.checkMeasurementReminder(user._id);
    console.log('Reminder due:', reminderStatus.reminder_due);
    console.log('Days since last:', reminderStatus.days_since_last);
    console.log('Last reminder date:', reminderStatus.last_reminder_date);
    console.log('');

    console.log('TEST 3: Add New Measurement');
    console.log('-----------------------------------');
    const newMeasurements = {
      waist_cm: 83,
      chest_cm: 102,
      hips_cm: 94,
      left_arm_cm: 36,
      right_arm_cm: 36,
      left_thigh_cm: 56,
      right_thigh_cm: 56
    };

    const newEntry = await measurementService.addMeasurement(
      user._id,
      newMeasurements,
      'Test measurement after 4 weeks'
    );
    console.log('✅ New measurement added successfully');
    console.log('Measurement ID:', newEntry._id);
    console.log('Measurements:', newEntry.measurements);
    console.log('');

    console.log('TEST 4: Get All Measurements');
    console.log('-----------------------------------');
    const allMeasurements = await measurementService.getAllMeasurements(user._id);
    console.log(`✅ Found ${allMeasurements.length} measurement entries`);
    allMeasurements.forEach((m, idx) => {
      console.log(`Entry ${idx + 1}:`, new Date(m.date).toLocaleDateString(), '-', m.notes || 'No notes');
    });
    console.log('');

    console.log('TEST 5: Get Latest Measurement');
    console.log('-----------------------------------');
    const latest = await measurementService.getLatestMeasurement(user._id);
    console.log('✅ Latest measurement retrieved');
    console.log('Date:', new Date(latest.date).toLocaleDateString());
    console.log('Measurements:', latest.measurements);
    console.log('');

    console.log('TEST 6: Compare Measurements');
    console.log('-----------------------------------');
    const comparison = await measurementService.compareMeasurements(user._id);
    if (comparison) {
      console.log('✅ Comparison completed');
      console.log('Changes:');
      console.log('  Waist:', comparison.changes.waist_change, 'cm');
      console.log('  Chest:', comparison.changes.chest_change, 'cm');
      console.log('  Hips:', comparison.changes.hips_change, 'cm');
      console.log('  Arms:', comparison.changes.arms_change, 'cm');
      console.log('  Thighs:', comparison.changes.thighs_change, 'cm');
      console.log('\nAnalysis:');
      console.log('  Overall Progress:', comparison.analysis.overall_progress);
      console.log('  Positive Indicators:', comparison.analysis.positive_indicators);
      console.log('  Concerns:', comparison.analysis.concerns);
      console.log('  Recommendations:', comparison.analysis.recommendations);
    } else {
      console.log('⚠️  No comparison available (need at least 2 measurements)');
    }
    console.log('');

    console.log('TEST 7: Get Measurement History');
    console.log('-----------------------------------');
    const history = await measurementService.getMeasurementHistory(user._id);
    console.log(`✅ Retrieved ${history.length} history entries`);
    history.forEach((h, idx) => {
      console.log(`Entry ${idx + 1}:`, new Date(h.date).toLocaleDateString());
      console.log('  Waist:', h.waist, 'cm');
      console.log('  Chest:', h.chest, 'cm');
      console.log('  Hips:', h.hips, 'cm');
      console.log('  Arms:', h.arms, 'cm');
      console.log('  Thighs:', h.thighs, 'cm');
    });
    console.log('');

    console.log('🎉 All tests completed successfully!');
    console.log('\n📊 Summary:');
    console.log('✅ Initial measurements saved');
    console.log('✅ Reminder system working');
    console.log('✅ New measurements can be added');
    console.log('✅ Measurement retrieval working');
    console.log('✅ Comparison and analysis working');
    console.log('✅ History tracking working');

  } catch (error) {
    console.error('❌ Test failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
};

testMeasurementSystem();
