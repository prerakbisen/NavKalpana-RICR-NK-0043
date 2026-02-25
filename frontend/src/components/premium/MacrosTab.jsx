import React, { useState } from 'react';
import { premiumCoachingService } from '../../services/apiService';

export const MacrosTab = ({ macros, preferences, onRefresh }) => {
  const [selectedStrategy, setSelectedStrategy] = useState(preferences?.macro_strategy || 'balanced');
  const [proteinPerKg, setProteinPerKg] = useState(preferences?.protein_per_kg || 2.0);
  const [carbCycling, setCarbCycling] = useState(preferences?.carb_cycling_enabled || false);
  const [saving, setSaving] = useState(false);

  const strategies = [
    { id: 'balanced', name: 'Balanced', desc: '30/40/30 - Well-rounded approach', icon: '⚖️' },
    { id: 'high_protein', name: 'High Protein', desc: '35/35/30 - Muscle building focus', icon: '💪' },
    { id: 'low_carb', name: 'Low Carb', desc: '35/20/45 - Fat loss emphasis', icon: '🔥' },
    { id: 'high_carb', name: 'High Carb', desc: '25/55/20 - Performance focus', icon: '⚡' },
    { id: 'ketogenic', name: 'Ketogenic', desc: '25/5/70 - Ultra low carb', icon: '🥑' },
    { id: 'carb_cycling', name: 'Carb Cycling', desc: 'Dynamic based on workout days', icon: '🔄' },
    { id: 'custom', name: 'Custom', desc: 'Your personalized targets', icon: '🎯' }
  ];

  const handleSave = async () => {
    setSaving(true);
    try {
      // Update preferences
      await premiumCoachingService.updatePreferences({
        macro_strategy: selectedStrategy,
        protein_per_kg: proteinPerKg,
        carb_cycling_enabled: carbCycling,
        high_carb_days: carbCycling ? [1, 3, 5] : [] // Mon, Wed, Fri
      });
      
      // Recalculate macros with new strategy
      const macrosRes = await premiumCoachingService.calculatePremiumMacros();
      
      // Refresh parent data
      await onRefresh();
      
      if (macrosRes.data.diet_plan_updated) {
        alert('✅ Macro preferences saved and applied to your diet plan!');
      } else {
        alert('✅ Macro preferences saved! Generate a diet plan to see them in action.');
      }
    } catch (error) {
      console.error('Error saving preferences:', error);
      alert('Failed to save preferences. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Current Macros Display */}
      {macros && (
        <div className="bg-gradient-to-br from-violet-600 to-purple-600 rounded-2xl p-8 text-white shadow-2xl">
          <h3 className="text-2xl font-bold mb-2">Your Current Macros</h3>
          <p className="opacity-90 mb-6">Strategy: {macros.strategy?.replace('_', ' ')}</p>
          
          <div className="grid grid-cols-3 gap-6">
            <div>
              <div className="text-sm opacity-75 mb-1">Protein</div>
              <div className="text-4xl font-bold">{macros.macros.protein_g}g</div>
              <div className="text-sm opacity-75">{macros.macros.protein_percent}%</div>
            </div>
            <div>
              <div className="text-sm opacity-75 mb-1">Carbs</div>
              <div className="text-4xl font-bold">{macros.macros.carbs_g}g</div>
              <div className="text-sm opacity-75">{macros.macros.carbs_percent}%</div>
            </div>
            <div>
              <div className="text-sm opacity-75 mb-1">Fat</div>
              <div className="text-4xl font-bold">{macros.macros.fat_g}g</div>
              <div className="text-sm opacity-75">{macros.macros.fat_percent}%</div>
            </div>
          </div>
        </div>
      )}

      {/* Strategy Selection */}
      <div className="bg-white rounded-2xl p-6 shadow-lg">
        <h3 className="text-2xl font-bold text-gray-900 mb-4">Choose Your Macro Strategy</h3>
        <p className="text-gray-600 mb-6">
          Select the approach that best fits your goals and lifestyle
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {strategies.map((strategy) => (
            <button
              key={strategy.id}
              onClick={() => setSelectedStrategy(strategy.id)}
              className={`p-4 rounded-xl border-2 transition-all text-left ${
                selectedStrategy === strategy.id
                  ? 'border-violet-600 bg-violet-50'
                  : 'border-gray-200 hover:border-violet-300'
              }`}
            >
              <div className="text-3xl mb-2">{strategy.icon}</div>
              <div className="font-bold text-gray-900 mb-1">{strategy.name}</div>
              <div className="text-sm text-gray-600">{strategy.desc}</div>
            </button>
          ))}
        </div>

        {/* Protein Per Kg Slider */}
        <div className="mb-6">
          <label className="block text-gray-700 font-semibold mb-2">
            Protein Target: {proteinPerKg}g per kg
          </label>
          <input
            type="range"
            min="1.2"
            max="3.5"
            step="0.1"
            value={proteinPerKg}
            onChange={(e) => setProteinPerKg(parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>1.2g (Minimum)</span>
            <span>2.0g (Standard)</span>
            <span>3.5g (Maximum)</span>
          </div>
        </div>

        {/* Carb Cycling Toggle */}
        {selectedStrategy === 'carb_cycling' && (
          <div className="mb-6 p-4 bg-violet-50 rounded-xl">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={carbCycling}
                onChange={(e) => setCarbCycling(e.target.checked)}
                className="w-5 h-5 text-violet-600"
              />
              <div>
                <div className="font-semibold text-gray-900">Enable Carb Cycling</div>
                <div className="text-sm text-gray-600">
                  Higher carbs on workout days, lower on rest days
                </div>
              </div>
            </label>
          </div>
        )}

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-4 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl font-bold text-lg hover:shadow-xl transition-all disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Macro Preferences'}
        </button>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <InfoCard
          icon="📚"
          title="Understanding Macros"
          content="Protein builds muscle, carbs fuel performance, and fats support hormones. Your optimal ratio depends on your goals and activity level."
        />
        <InfoCard
          icon="💡"
          title="Pro Tip"
          content="Start with a balanced approach and adjust based on your results. Monitor energy levels and performance to find your sweet spot."
        />
      </div>
    </div>
  );
};

const InfoCard = ({ icon, title, content }) => (
  <div className="bg-white rounded-xl p-6 shadow-lg">
    <div className="text-4xl mb-3">{icon}</div>
    <h4 className="font-bold text-gray-900 mb-2">{title}</h4>
    <p className="text-gray-600 text-sm">{content}</p>
  </div>
);

export default MacrosTab;
