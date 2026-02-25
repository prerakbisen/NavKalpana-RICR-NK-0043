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
  goal_timeframe: {
    type: String,
    enum: ['8 weeks', '12 weeks', '16 weeks', '6 months', '9 months', '1 year'],
    default: '12 weeks'
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
<<<<<<< HEAD
  // Body Measurements 
=======
  // Body Measurements (MANDATORY - required for measurement trends tracking)
>>>>>>> 5d3a0de (new feature added)
  initial_measurements: {
    waist_cm: { 
      type: Number, 
      required: [true, 'Waist measurement is required'],
      min: [0, 'Waist measurement must be positive']
    },
    chest_cm: { 
      type: Number, 
      required: [true, 'Chest measurement is required'],
      min: [0, 'Chest measurement must be positive']
    },
    hips_cm: { 
      type: Number, 
      required: [true, 'Hips measurement is required'],
      min: [0, 'Hips measurement must be positive']
    },
    left_arm_cm: { 
      type: Number, 
      required: [true, 'Left arm measurement is required'],
      min: [0, 'Left arm measurement must be positive']
    },
    right_arm_cm: { 
      type: Number, 
      required: [true, 'Right arm measurement is required'],
      min: [0, 'Right arm measurement must be positive']
    },
    left_thigh_cm: { 
      type: Number, 
      required: [true, 'Left thigh measurement is required'],
      min: [0, 'Left thigh measurement must be positive']
    },
    right_thigh_cm: { 
      type: Number, 
      required: [true, 'Right thigh measurement is required'],
      min: [0, 'Right thigh measurement must be positive']
    },
    measured_at: { 
      type: Date, 
      required: [true, 'Measurement date is required'],
      default: Date.now
    }
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
