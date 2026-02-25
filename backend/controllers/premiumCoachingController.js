import premiumCoachingService from '../services/premiumCoachingService.js';
import PremiumPreferences from '../models/PremiumPreferences.js';
import User from '../models/User.js';

// Get or create premium preferences
export const getPremiumPreferences = async (req, res) => {
  try {
    let preferences = await PremiumPreferences.findOne({ user_id: req.user_id });
    
    if (!preferences) {
      preferences = new PremiumPreferences({
        user_id: req.user_id
      });
      await preferences.save();
    }
    
    res.json(preferences);
  } catch (error) {
    console.error('Get premium preferences error:', error);
    res.status(500).json({ error: 'Failed to get premium preferences' });
  }
};

// Update premium preferences
export const updatePremiumPreferences = async (req, res) => {
  try {
    const preferences = await PremiumPreferences.findOneAndUpdate(
      { user_id: req.user_id },
      { $set: req.body },
      { new: true, upsert: true }
    );
    
    res.json({
      message: 'Premium preferences updated successfully',
      preferences
    });
  } catch (error) {
    console.error('Update premium preferences error:', error);
    res.status(500).json({ error: 'Failed to update premium preferences' });
  }
};

// Calculate premium macros
export const calculatePremiumMacros = async (req, res) => {
  try {
    const Profile = (await import('../models/Profile.js')).default;
    
    const [profile, preferences] = await Promise.all([
      Profile.findOne({ user_id: req.user_id }),
      PremiumPreferences.findOne({ user_id: req.user_id })
    ]);
    
    if (!profile) {
      return res.status(404).json({ error: 'Profile not found' });
    }
    
    if (!preferences) {
      return res.status(404).json({ error: 'Premium preferences not found. Please set up your preferences first.' });
    }
    
    const macros = await premiumCoachingService.calculatePremiumMacros(
      req.user_id,
      profile,
      preferences
    );
    
    // Apply macros to current diet plan
    const updatedDietPlan = await premiumCoachingService.applyMacrosToDietPlan(req.user_id, macros);
    
    res.json({
      macros,
      strategy: preferences.macro_strategy,
      explanation: `Macros calculated using ${preferences.macro_strategy} strategy`,
      diet_plan_updated: !!updatedDietPlan,
      message: updatedDietPlan ? 'Macros applied to your current diet plan' : 'Macros calculated (no active diet plan to update)'
    });
  } catch (error) {
    console.error('Calculate premium macros error:', error);
    res.status(500).json({ error: 'Failed to calculate premium macros' });
  }
};

// Swap a meal
export const swapMeal = async (req, res) => {
  try {
    const { diet_plan_id, meal_number, swap_reason } = req.body;
    
    console.log('🔄 Meal swap request:', { diet_plan_id, meal_number, swap_reason, user_id: req.user_id });
    
    if (!diet_plan_id || !meal_number) {
      return res.status(400).json({ error: 'diet_plan_id and meal_number are required' });
    }
    
    const result = await premiumCoachingService.swapMeal(
      req.user_id,
      diet_plan_id,
      meal_number,
      swap_reason || ''
    );
    
    console.log('✅ Meal swap successful');
    res.json(result);
  } catch (error) {
    console.error('❌ Swap meal error:', error);
    console.error('Error stack:', error.stack);
    res.status(500).json({ 
      error: error.message || 'Failed to swap meal',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
};

// Get meal swap history
export const getMealSwapHistory = async (req, res) => {
  try {
    const MealSwapHistory = (await import('../models/MealSwapHistory.js')).default;
    
    const history = await MealSwapHistory.find({ user_id: req.user_id })
      .sort({ created_at: -1 })
      .limit(20);
    
    res.json(history);
  } catch (error) {
    console.error('Get meal swap history error:', error);
    res.status(500).json({ error: 'Failed to get meal swap history' });
  }
};

// Rate a meal swap
export const rateMealSwap = async (req, res) => {
  try {
    const { swap_id, rating } = req.body;
    
    if (!swap_id || !rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Valid swap_id and rating (1-5) are required' });
    }
    
    const MealSwapHistory = (await import('../models/MealSwapHistory.js')).default;
    
    const swap = await MealSwapHistory.findOneAndUpdate(
      { _id: swap_id, user_id: req.user_id },
      { user_rating: rating },
      { new: true }
    );
    
    if (!swap) {
      return res.status(404).json({ error: 'Meal swap not found' });
    }
    
    res.json({
      message: 'Rating saved successfully',
      swap
    });
  } catch (error) {
    console.error('Rate meal swap error:', error);
    res.status(500).json({ error: 'Failed to rate meal swap' });
  }
};

// Analyze and adapt meals
export const analyzeMealAdaptations = async (req, res) => {
  try {
    const analysis = await premiumCoachingService.analyzeAndAdaptMeals(req.user_id);
    
    res.json(analysis);
  } catch (error) {
    console.error('Analyze meal adaptations error:', error);
    res.status(500).json({ error: 'Failed to analyze meal adaptations' });
  }
};

// Get premium coaching response
export const getPremiumCoachingResponse = async (req, res) => {
  try {
    const { question, context } = req.body;
    
    if (!question) {
      return res.status(400).json({ error: 'Question is required' });
    }
    
    const response = await premiumCoachingService.generatePremiumCoachingResponse(
      req.user_id,
      question,
      context || {}
    );
    
    res.json(response);
  } catch (error) {
    console.error('Premium coaching response error:', error);
    res.status(500).json({ error: 'Failed to generate coaching response' });
  }
};

// Get recovery analysis
export const getRecoveryAnalysis = async (req, res) => {
  try {
    const analysis = await premiumCoachingService.analyzeRecoveryStatus(req.user_id);
    
    res.json(analysis);
  } catch (error) {
    console.error('Recovery analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze recovery status' });
  }
};

// Check premium status
export const checkPremiumStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user_id);
    
    const isPremiumActive = user.is_premium && 
      (!user.premium_expires || new Date(user.premium_expires) > new Date());
    
    res.json({
      is_premium: isPremiumActive,
      subscription_tier: user.subscription_tier,
      premium_since: user.premium_since,
      premium_expires: user.premium_expires,
      features: isPremiumActive ? [
        'advanced_macro_customization',
        'meal_swap_engine',
        'personalized_meal_adjustments',
        'extended_ai_coaching',
        'deep_recovery_insights',
        'carb_cycling',
        'custom_protein_targets',
        'behavioral_adaptation'
      ] : []
    });
  } catch (error) {
    console.error('Check premium status error:', error);
    res.status(500).json({ error: 'Failed to check premium status' });
  }
};

// Activate premium (for testing/admin)
export const activatePremium = async (req, res) => {
  try {
    const { duration_months = 1 } = req.body;
    
    const user = await User.findById(req.user_id);
    
    user.is_premium = true;
    user.subscription_tier = 'premium';
    user.premium_since = new Date();
    user.premium_expires = new Date(Date.now() + duration_months * 30 * 24 * 60 * 60 * 1000);
    
    await user.save();
    
    // Create default premium preferences
    let preferences = await PremiumPreferences.findOne({ user_id: req.user_id });
    if (!preferences) {
      preferences = new PremiumPreferences({
        user_id: req.user_id
      });
      await preferences.save();
    }
    
    res.json({
      message: 'Premium activated successfully',
      user: {
        is_premium: user.is_premium,
        subscription_tier: user.subscription_tier,
        premium_expires: user.premium_expires
      }
    });
  } catch (error) {
    console.error('Activate premium error:', error);
    res.status(500).json({ error: 'Failed to activate premium' });
  }
};

// Deactivate premium (for testing/admin)
export const deactivatePremium = async (req, res) => {
  try {
    const user = await User.findById(req.user_id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Deactivate premium
    user.is_premium = false;
    user.subscription_tier = 'free';
    user.premium_expires = null;
    
    await user.save();
    
    res.json({
      message: 'Premium deactivated successfully',
      user: {
        is_premium: user.is_premium,
        subscription_tier: user.subscription_tier,
        premium_expires: user.premium_expires
      }
    });
  } catch (error) {
    console.error('Deactivate premium error:', error);
    res.status(500).json({ error: 'Failed to deactivate premium' });
  }
};
