import mongoose from 'mongoose';

const mealSwapHistorySchema = new mongoose.Schema({
  user_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  diet_plan_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'DietPlan',
    required: true
  },
  original_meal: {
    meal_number: Number,
    meal_name: String,
    description: String,
    calories: Number,
    macros: {
      protein_g: Number,
      carbs_g: Number,
      fat_g: Number
    }
  },
  swapped_meal: {
    meal_name: String,
    description: String,
    calories: Number,
    macros: {
      protein_g: Number,
      carbs_g: Number,
      fat_g: Number
    },
    ingredients: [String],
    preparation_tips: String
  },
  swap_reason: String,
  user_rating: {
    type: Number,
    min: 1,
    max: 5
  },
  created_at: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model('MealSwapHistory', mealSwapHistorySchema);
