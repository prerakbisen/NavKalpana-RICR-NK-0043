import React, { useState, useEffect } from 'react';
import { premiumCoachingService, dietService } from '../../services/apiService';

export const MealsTab = () => {
  const [dietPlan, setDietPlan] = useState(null);
  const [swapHistory, setSwapHistory] = useState([]);
  const [selectedMeal, setSelectedMeal] = useState(null);
  const [swapping, setSwapping] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [dietRes, historyRes] = await Promise.all([
        dietService.getLatestDiet(),
        premiumCoachingService.getMealSwapHistory().catch(() => ({ data: [] }))
      ]);
      setDietPlan(dietRes.data);
      setSwapHistory(historyRes.data);
    } catch (error) {
      console.error('Error fetching meal data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSwapMeal = async (mealNumber, reason) => {
    if (!dietPlan) return;
    
    setSwapping(true);
    try {
      console.log('🔄 Swapping meal:', { mealNumber, reason, dietPlanId: dietPlan._id });
      
      const result = await premiumCoachingService.swapMeal(
        dietPlan._id,
        mealNumber,
        reason
      );
      
      console.log('✅ Swap result:', result);
      
      if (result.data && result.data.success) {
        alert(`✅ Meal swapped successfully!\n\nNew meal: ${result.data.swapped_meal.meal_name}\nCalories: ${result.data.swapped_meal.calories}\nProtein: ${result.data.swapped_meal.macros.protein_g}g`);
        await fetchData();
        setSelectedMeal(null);
      } else {
        throw new Error('Swap failed - no success response');
      }
    } catch (error) {
      console.error('❌ Error swapping meal:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Failed to swap meal';
      alert(`Failed to swap meal:\n${errorMessage}\n\nPlease try again or contact support if the issue persists.`);
    } finally {
      setSwapping(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12">
        <div className="text-5xl mb-4 animate-bounce">🍽️</div>
        <p className="text-gray-600">Loading meals...</p>
      </div>
    );
  }

  if (!dietPlan) {
    return (
      <div className="bg-white rounded-2xl p-12 text-center shadow-lg">
        <div className="text-6xl mb-4">🍽️</div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">No Diet Plan Found</h3>
        <p className="text-gray-600 mb-6">Generate a diet plan first to use meal swaps</p>
        <button className="px-6 py-3 bg-violet-600 text-white rounded-xl font-semibold">
          Generate Diet Plan
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-500 to-red-600 rounded-2xl p-6 text-white shadow-xl">
        <h3 className="text-2xl font-bold mb-2">🔄 Meal Swap Engine</h3>
        <p className="opacity-90">
          Don't like a meal? Swap it instantly with AI-powered alternatives that match your macros
        </p>
      </div>

      {/* Current Meals */}
      <div className="bg-white rounded-2xl p-6 shadow-lg">
        <h4 className="text-xl font-bold text-gray-900 mb-4">Your Current Meals</h4>
        <div className="space-y-4">
          {dietPlan.meals?.map((meal) => (
            <MealCard
              key={meal.meal_number}
              meal={meal}
              onSwap={() => setSelectedMeal(meal)}
            />
          ))}
        </div>
      </div>

      {/* Swap History */}
      {swapHistory.length > 0 && (
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <h4 className="text-xl font-bold text-gray-900 mb-4">Recent Swaps</h4>
          <div className="space-y-3">
            {swapHistory.slice(0, 5).map((swap) => (
              <SwapHistoryCard key={swap._id} swap={swap} />
            ))}
          </div>
        </div>
      )}

      {/* Swap Modal */}
      {selectedMeal && (
        <SwapModal
          meal={selectedMeal}
          onSwap={handleSwapMeal}
          onClose={() => setSelectedMeal(null)}
          swapping={swapping}
        />
      )}
    </div>
  );
};

const MealCard = ({ meal, onSwap }) => (
  <div className="border-2 border-gray-200 rounded-xl p-4 hover:border-violet-300 transition-all">
    <div className="flex items-start justify-between">
      <div className="flex-1">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">{getMealIcon(meal.meal_name)}</span>
          <div>
            <h5 className="font-bold text-gray-900">{meal.meal_name}</h5>
            <p className="text-sm text-gray-600">{meal.time_suggestion}</p>
          </div>
        </div>
        <p className="text-gray-700 mb-3">{meal.description}</p>
        <div className="flex gap-4 text-sm">
          <span className="text-gray-600">
            <span className="font-semibold">{meal.estimated_calories}</span> cal
          </span>
          <span className="text-gray-600">
            P: <span className="font-semibold">{meal.macros.protein_g}g</span>
          </span>
          <span className="text-gray-600">
            C: <span className="font-semibold">{meal.macros.carbs_g}g</span>
          </span>
          <span className="text-gray-600">
            F: <span className="font-semibold">{meal.macros.fat_g}g</span>
          </span>
        </div>
      </div>
      <button
        onClick={onSwap}
        className="ml-4 px-4 py-2 bg-violet-600 text-white rounded-lg font-semibold hover:bg-violet-700 transition-all"
      >
        🔄 Swap
      </button>
    </div>
  </div>
);

const SwapHistoryCard = ({ swap }) => (
  <div className="bg-gray-50 rounded-xl p-4">
    <div className="flex items-center justify-between mb-2">
      <span className="text-sm text-gray-600">
        {new Date(swap.created_at).toLocaleDateString()}
      </span>
      {swap.user_rating && (
        <div className="flex gap-1">
          {[...Array(5)].map((_, i) => (
            <span key={i} className={i < swap.user_rating ? 'text-yellow-500' : 'text-gray-300'}>
              ⭐
            </span>
          ))}
        </div>
      )}
    </div>
    <div className="text-sm">
      <span className="text-gray-600">Swapped:</span>{' '}
      <span className="font-semibold text-gray-900">{swap.original_meal.meal_name}</span>
      {' → '}
      <span className="font-semibold text-violet-600">{swap.swapped_meal.meal_name}</span>
    </div>
  </div>
);

const SwapModal = ({ meal, onSwap, onClose, swapping }) => {
  const [reason, setReason] = useState('');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full">
        <h3 className="text-2xl font-bold text-gray-900 mb-4">Swap {meal.meal_name}?</h3>
        <p className="text-gray-600 mb-4">
          AI will find a similar meal that matches your macros and preferences
        </p>
        
        <div className="mb-4">
          <label className="block text-gray-700 font-semibold mb-2">
            Reason for swap (optional)
          </label>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g., Don't like chicken, prefer vegetarian..."
            className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-violet-600 outline-none"
            rows="3"
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={swapping}
            className="flex-1 py-3 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-all disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={() => onSwap(meal.meal_number, reason)}
            disabled={swapping}
            className="flex-1 py-3 bg-violet-600 text-white rounded-xl font-semibold hover:bg-violet-700 transition-all disabled:opacity-50"
          >
            {swapping ? 'Swapping...' : 'Swap Meal'}
          </button>
        </div>
      </div>
    </div>
  );
};

const getMealIcon = (mealName) => {
  const name = mealName.toLowerCase();
  if (name.includes('breakfast')) return '🍳';
  if (name.includes('lunch')) return '🥗';
  if (name.includes('dinner')) return '🍽️';
  if (name.includes('snack')) return '🍎';
  return '🍴';
};

export default MealsTab;
