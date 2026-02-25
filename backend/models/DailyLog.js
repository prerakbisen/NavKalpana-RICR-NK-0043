import mongoose from 'mongoose';

const dailyLogSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  workout_completed: {
    type: Boolean,
    default: false
  },
  workout_status: {
    type: String,
    enum: ['Completed', 'Partial', 'Skipped'],
    default: 'Skipped'
  },
  workout_notes: {
    type: String,
    default: ''
  },
  diet_followed: {
    type: Boolean,
    default: false
  },
  diet_adherence: {
    type: String,
    enum: ['Followed', 'Mostly', 'Deviated'],
    default: 'Deviated'
  },
  diet_notes: {
    type: String,
    default: ''
  },
  calories_consumed: {
    type: Number,
    default: 0
  },
  water_intake_liters: {
    type: Number,
    default: 0
  },
  energy_level: {
    type: String,
    enum: ['Energized', 'Normal', 'Slightly Fatigued', 'Very Tired'],
    default: 'Normal'
  },
  mood: {
    type: String,
    enum: ['Poor', 'Fair', 'Good', 'Great', 'Excellent'],
    default: 'Good'
  },
  sleep_hours: {
    type: Number,
    default: 0
  },
  weight_kg: {
    type: Number
  },
  notes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

dailyLogSchema.index({ user_id: 1, date: -1 });

dailyLogSchema.index({ user_id: 1, date: 1 }, { unique: true });

export default mongoose.model('DailyLog', dailyLogSchema);
