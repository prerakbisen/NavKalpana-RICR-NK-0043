import mongoose from 'mongoose';

const profileSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  age: {
    type: Number,
    required: [true, 'Age is required'],
    min: 13,
    max: 120
  },
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other'],
    required: true
  },
  height_cm: {
    type: Number,
    required: [true, 'Height is required'],
    min: 100,
    max: 250
  },
  weight_kg: {
    type: Number,
    required: [true, 'Weight is required'],
    min: 30,
    max: 500
  },
  activity_level: {
    type: String,
    enum: ['Sedentary', 'Light', 'Moderate', 'Active'],
    required: true
  },
  experience_level: {
    type: String,
    enum: ['Beginner', 'Intermediate', 'Advanced'],
    required: true
  },
  goal: {
    type: String,
    enum: ['Weight Loss', 'Muscle Gain', 'Maintenance'],
    required: true
  },
  target_weight_kg: {
    type: Number,
    required: true,
    min: 30,
    max: 500
  },
  available_days_per_week: {
    type: Number,
    required: true,
    min: 1,
    max: 7,
    default: 4
  },
  // Body Measurements 
  initial_measurements: {
    waist_cm: { type: Number, min: 0 },
    chest_cm: { type: Number, min: 0 },
    hips_cm: { type: Number, min: 0 },
    arms_cm: { type: Number, min: 0 },
    thighs_cm: { type: Number, min: 0 },
    measured_at: { type: Date }
  },
  last_measurement_reminder: {
    type: Date,
    default: null
  },
  // NEW: User preferences and limitations
  dietary_preferences: {
    type: String,
    default: '',
    trim: true
  },
  allergies: {
    type: String,
    default: '',
    trim: true
  },
  injuries_limitations: {
    type: String,
    default: '',
    trim: true
  },
 
  bmi: Number,
  bmr: Number,
  daily_calorie_target: Number,
  height_m: Number,
  activity_factor: Number,
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
});


profileSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

export default mongoose.model('Profile', profileSchema);
