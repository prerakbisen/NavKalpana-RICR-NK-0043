import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../.env') });

import ProgressLog from '../models/ProgressLog.js';
import HabitScore from '../models/HabitScore.js';
import EnergyLog from '../models/EnergyLog.js';
import BodyMeasurement from '../models/BodyMeasurement.js';
import User from '../models/User.js';
import Profile from '../models/Profile.js';

const addSampleProgress = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    const user = await User.findOne();
    if (!user) {
      console.log('❌ No users found. Please register a user first.');
      process.exit(1);
    }

    const profile = await Profile.findOne({ user_id: user._id });
    if (!profile) {
      console.log('❌ No profile found. Please complete profile setup first.');
      process.exit(1);
    }

    console.log(`\n📊 Adding sample progress data for user: ${user.email}`);
    console.log(`Starting weight: ${profile.weight_kg} kg`);
    console.log(`Goal: ${profile.goal}`);

    await ProgressLog.deleteMany({ user_id: user._id });
    await HabitScore.deleteMany({ user_id: user._id });
    await EnergyLog.deleteMany({ user_id: user._id });
    await BodyMeasurement.deleteMany({ user_id: user._id });
    console.log('\n🗑️  Cleared existing progress data');

    const startWeight = profile.weight_kg;
    const isWeightLoss = profile.goal === 'Weight Loss';
    const weeklyChange = isWeightLoss ? -0.5 : 0.3; // kg per week

    for (let week = 1; week <= 8; week++) {
      const currentWeight = startWeight + (weeklyChange * week);
      const workoutAdherence = 70 + Math.random() * 25; // 70-95%
      const dietAdherence = 65 + Math.random() * 30; // 65-95%
      
      const dailyLogs = [];
      for (let day = 1; day <= 7; day++) {
        dailyLogs.push({
          day_number: day,
          workout_completed: Math.random() > 0.2, // 80% completion
          diet_followed: Math.random() > 0.25, // 75% completion
          notes: day === 7 ? 'Weekly review completed' : ''
        });
      }

      const progressLog = new ProgressLog({
        user_id: user._id,
        week_number: week,
        weight_kg: parseFloat(currentWeight.toFixed(1)),
        weight_change_kg: parseFloat((currentWeight - startWeight).toFixed(1)),
        workout_adherence_percent: Math.round(workoutAdherence),
        diet_adherence_percent: Math.round(dietAdherence),
        fatigue_level: ['Energized', 'Normal', 'Slightly Fatigued'][Math.floor(Math.random() * 3)],
        daily_logs: dailyLogs,
        notes: `Week ${week} completed successfully`
      });
      await progressLog.save();

      const habitScore = new HabitScore({
        user_id: user._id,
        week_number: week,
        habit_score: Math.round((workoutAdherence + dietAdherence) / 2),
        streak_count: week,
        drop_off_risk: workoutAdherence < 60 || dietAdherence < 60 ? 'High' : 'Low'
      });
      await habitScore.save();

      for (let day = 0; day < 7; day++) {
        const energyLog = new EnergyLog({
          user_id: user._id,
          energy_level: ['Energized', 'Normal', 'Slightly Fatigued', 'Very Tired'][Math.floor(Math.random() * 4)],
          logged_at: new Date(Date.now() - (8 - week) * 7 * 24 * 60 * 60 * 1000 + day * 24 * 60 * 60 * 1000),
          notes: day === 0 ? 'Start of week' : ''
        });
        await energyLog.save();
      }

      if (week % 2 === 0) {
        const measurement = new BodyMeasurement({
          user_id: user._id,
          measurements: {
            chest_cm: 95 + Math.random() * 2,
            waist_cm: 85 - (week * 0.5),
            hips_cm: 100 - (week * 0.3),
            arms_cm: 32 + Math.random(),
            thighs_cm: 55 - (week * 0.2)
          },
          measured_at: new Date(Date.now() - (8 - week) * 7 * 24 * 60 * 60 * 1000),
          notes: `Week ${week} measurements`
        });
        await measurement.save();
      }

      console.log(`✅ Week ${week}: Weight ${currentWeight.toFixed(1)}kg, Workout ${Math.round(workoutAdherence)}%, Diet ${Math.round(dietAdherence)}%`);
    }

    console.log('\n🎉 Sample progress data added successfully!');
    console.log('\n📈 Summary:');
    console.log(`- 8 weeks of progress logs`);
    console.log(`- 8 habit scores`);
    console.log(`- 56 energy logs (7 days × 8 weeks)`);
    console.log(`- 4 body measurement records`);
    console.log(`\n💡 Now refresh your Progress page to see the data!`);

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('\n👋 Disconnected from MongoDB');
  }
};

addSampleProgress();
