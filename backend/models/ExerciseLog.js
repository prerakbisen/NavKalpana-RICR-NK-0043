import mongoose from 'mongoose';

const exerciseLogSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  workout_plan_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WorkoutPlanV2',
    required: true
  },
  week_number: Number,
  day_number: Number,
  date: {
    type: Date,
    default: Date.now
  },
  exercise_name: String,
  sets_completed: Number,
  sets_planned: Number,
  set_details: [{
    set_number: Number,
    reps_completed: Number,
    reps_planned: String, //  "8-10"
    weight_kg: Number,
    difficulty: {
      type: String,
      enum: ['Too Easy', 'Just Right', 'Too Hard'],
      default: 'Just Right'
    }
  }],
  completion_status: {
    type: String,
    enum: ['Completed', 'Partial', 'Skipped'],
    default: 'Completed'
  },
  notes: String,
  created_at: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('ExerciseLog', exerciseLogSchema);
