import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { generateWeeklyWorkout } from '../utils/workoutGenerator.js';

dotenv.config();

mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/fitai')
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.error('MongoDB connection error:', err));

const workoutPlanSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  week_number: Number,
  goal: String,
  experience_level: String,
  fatigue_status: String,
  week_summary: String,
  progression_notes: String,
  recovery_tips: String,
  motivation_message: String,
  workouts: [
    {
      day: Number,
      day_name: String,
      type: String,
      exercises: [
        {
          name: String,
          sets: Number,
          reps: String,
          rest_seconds: Number,
          guidance: String,
          intensity_level: String
        }
      ],
      rest_day: Boolean
    }
  ],
  created_at: {
    type: Date,
    default: Date.now
  }
}, { strict: false });

const TestWorkoutPlan = mongoose.model('TestWorkoutPlan', workoutPlanSchema, 'workoutplans');

const testGeneration = async () => {
  try {
    console.log('Generating workout data...');
    const workoutDays = generateWeeklyWorkout('Weight Loss', 'Beginner', 'Normal');
    
    console.log('Workout data type:', typeof workoutDays);
    console.log('Is array:', Array.isArray(workoutDays));
    console.log('Number of days:', workoutDays.length);
    console.log('\nFirst day structure:');
    console.log(JSON.stringify(workoutDays[0], null, 2));
    
    console.log('\nCreating test workout plan...');
    const testPlan = new TestWorkoutPlan({
      user_id: new mongoose.Types.ObjectId(),
      week_number: 999,
      goal: 'Weight Loss',
      experience_level: 'Beginner',
      fatigue_status: 'Normal',
      workouts: workoutDays,
      week_summary: 'Test workout plan'
    });
    
    console.log('\nSaving to database...');
    await testPlan.save();
    console.log('✅ Test workout plan saved successfully!');
    console.log('Plan ID:', testPlan._id);
    
    // Clean up test data
    await TestWorkoutPlan.deleteOne({ _id: testPlan._id });
    console.log('✅ Test data cleaned up');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Full error:', error);
    process.exit(1);
  }
};

testGeneration();
