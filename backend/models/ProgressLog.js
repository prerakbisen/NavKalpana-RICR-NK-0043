import mongoose from 'mongoose';

const progressLogSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  week_number: Number,
  date: {
    type: Date,
    default: Date.now
  },
  weight_kg: Number,
  daily_logs: [
    {
      day_number: Number, // 1-7
      date: Date,
      workout_completion: {
        type: String,
        enum: ['Completed', 'Partial', 'Skipped'],
        default: 'Skipped'
      },
      diet_adherence: {
        type: String,
        enum: ['Followed', 'Mostly', 'Deviated'],
        default: 'Deviated'
      }
    }
  ],
  workout_adherence_percent: Number,
  diet_adherence_percent: Number,
  avg_weight_change: Number,
  created_at: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('ProgressLog', progressLogSchema);
