import mongoose from 'mongoose';

const workoutPlanV2Schema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  week_number: {
    type: Number,
    required: true
  },
  goal: String,
  experience_level: String,
  fatigue_status: {
    type: String,
    default: 'Normal'
  },
  week_summary: String,
  progression_notes: String,
  recovery_tips: String,
  motivation_message: String,
  workouts: [{
    day: Number,
    day_name: String,
    type: String,
    exercises: [{
      name: String,
      sets: Number,
      reps: String,
      rest_seconds: Number,
      guidance: String,
      intensity_level: String
    }],
    rest_day: Boolean
  }],
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('WorkoutPlanV2', workoutPlanV2Schema, 'workoutplans');
