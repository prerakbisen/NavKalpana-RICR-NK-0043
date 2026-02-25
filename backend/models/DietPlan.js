import mongoose from 'mongoose';

const dietPlanSchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  week_number: {
    type: Number,
    required: true
  },
  daily_calorie_target: Number,
  goal: String,
  // Macro targets
  protein_grams: Number,
  carbs_grams: Number,
  fat_grams: Number,
  // Percentages
  protein_percent: Number,
  carbs_percent: Number,
  fat_percent: Number,
  // AI-generated content
  week_summary: String,
  hydration_goal: String,
  supplement_suggestions: String,
  meal_prep_tips: String,
  adjustment_notes: String,
  meals: [
    {
      meal_number: Number, // 1-5
      meal_name: String, // Breakfast, Lunch, etc.
      time_suggestion: String, // AI-generated meal timing
      description: String,
      estimated_calories: Number,
      macros: {
        protein_g: Number,
        carbs_g: Number,
        fat_g: Number
      },
      ingredients: [String], // AI-generated ingredient list
      preparation_tips: String, // AI-generated prep instructions
      why_this_meal: String // AI-generated explanation
    }
  ],
  created_at: {
    type: Date,
    default: Date.now
  },
  updated_at: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('DietPlan', dietPlanSchema);
