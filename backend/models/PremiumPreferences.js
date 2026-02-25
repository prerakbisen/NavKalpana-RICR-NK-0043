import mongoose from 'mongoose';

const premiumPreferencesSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  
  // Macro Customization
  macro_strategy: {
    type: String,
    enum: ['high_protein', 'low_carb', 'high_carb', 'ketogenic', 'balanced', 'carb_cycling', 'custom'],
    default: 'balanced'
  },
  protein_per_kg: {
    type: Number,
    default: 2.0,
    min: 1.2,
    max: 3.5
  },
  carb_cycling_enabled: {
    type: Boolean,
    default: false
  },
  high_carb_days: [Number], // Days of week (0-6) for high carb
  low_carb_days: [Number], // Days of week for low carb
  
  // Meal Preferences
  meal_swap_preferences: {
    vegetarian: { type: Boolean, default: false },
    vegan: { type: Boolean, default: false },
    pescatarian: { type: Boolean, default: false },
    gluten_free: { type: Boolean, default: false },
    dairy_free: { type: Boolean, default: false },
    halal: { type: Boolean, default: false },
    kosher: { type: Boolean, default: false }
  },
  
  food_preferences: {
    liked_foods: [String],
    disliked_foods: [String],
    allergies: [String]
  },
  
  budget_level: {
    type: String,
    enum: ['budget', 'moderate', 'premium'],
    default: 'moderate'
  },
  
  cooking_skill: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'intermediate'
  },
  
  meal_prep_preference: {
    type: String,
    enum: ['daily_fresh', 'weekly_prep', 'mixed'],
    default: 'mixed'
  },
  
  // Recovery Preferences
  recovery_focus: {
    type: String,
    enum: ['standard', 'high_intensity', 'recovery_focused'],
    default: 'standard'
  },
  
  sleep_target_hours: {
    type: Number,
    default: 8,
    min: 6,
    max: 10
  },
  
  // AI Coaching Preferences
  coaching_tone: {
    type: String,
    enum: ['motivational', 'analytical', 'supportive', 'direct'],
    default: 'supportive'
  },
  
  detail_level: {
    type: String,
    enum: ['brief', 'moderate', 'detailed'],
    default: 'detailed'
  },
  
  // Behavioral Tracking
  meal_adherence_history: [{
    date: Date,
    meal_number: Number,
    adhered: Boolean,
    swapped: Boolean,
    skipped: Boolean
  }],
  
  preferred_meal_times: {
    breakfast: String,
    lunch: String,
    dinner: String,
    snack1: String,
    snack2: String
  },
  
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
});

premiumPreferencesSchema.pre('save', function(next) {
  this.updated_at = Date.now();
  next();
});

export default mongoose.model('PremiumPreferences', premiumPreferencesSchema);
