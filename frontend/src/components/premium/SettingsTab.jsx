import React, { useState } from 'react';
import { premiumCoachingService } from '../../services/apiService';
import { useNavigate } from 'react-router-dom';

export const SettingsTab = ({ preferences, onRefresh }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    coaching_tone: preferences?.coaching_tone || 'supportive',
    detail_level: preferences?.detail_level || 'detailed',
    budget_level: preferences?.budget_level || 'moderate',
    cooking_skill: preferences?.cooking_skill || 'intermediate',
    meal_prep_preference: preferences?.meal_prep_preference || 'mixed',
    recovery_focus: preferences?.recovery_focus || 'standard',
    sleep_target_hours: preferences?.sleep_target_hours || 8,
    vegetarian: preferences?.meal_swap_preferences?.vegetarian || false,
    vegan: preferences?.meal_swap_preferences?.vegan || false,
    gluten_free: preferences?.meal_swap_preferences?.gluten_free || false,
    dairy_free: preferences?.meal_swap_preferences?.dairy_free || false
  });
  const [saving, setSaving] = useState(false);

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await premiumCoachingService.updatePreferences({
        coaching_tone: formData.coaching_tone,
        detail_level: formData.detail_level,
        budget_level: formData.budget_level,
        cooking_skill: formData.cooking_skill,
        meal_prep_preference: formData.meal_prep_preference,
        recovery_focus: formData.recovery_focus,
        sleep_target_hours: formData.sleep_target_hours,
        meal_swap_preferences: {
          vegetarian: formData.vegetarian,
          vegan: formData.vegan,
          gluten_free: formData.gluten_free,
          dairy_free: formData.dairy_free
        }
      });
      await onRefresh();
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* AI Coaching Preferences */}
      <div className="bg-white rounded-2xl p-6 shadow-lg">
        <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span>🤖</span>
          AI Coaching Preferences
        </h3>
        
        <div className="space-y-4">
          <SelectField
            label="Coaching Tone"
            value={formData.coaching_tone}
            onChange={(v) => handleChange('coaching_tone', v)}
            options={[
              { value: 'motivational', label: 'Motivational - Energetic and inspiring' },
              { value: 'analytical', label: 'Analytical - Data-driven and precise' },
              { value: 'supportive', label: 'Supportive - Empathetic and encouraging' },
              { value: 'direct', label: 'Direct - Straightforward and concise' }
            ]}
          />
          
          <SelectField
            label="Detail Level"
            value={formData.detail_level}
            onChange={(v) => handleChange('detail_level', v)}
            options={[
              { value: 'brief', label: 'Brief - Quick answers' },
              { value: 'moderate', label: 'Moderate - Balanced explanations' },
              { value: 'detailed', label: 'Detailed - Comprehensive analysis' }
            ]}
          />
        </div>
      </div>

      {/* Meal Preferences */}
      <div className="bg-white rounded-2xl p-6 shadow-lg">
        <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span>🍽️</span>
          Meal Preferences
        </h3>
        
        <div className="space-y-4">
          <SelectField
            label="Budget Level"
            value={formData.budget_level}
            onChange={(v) => handleChange('budget_level', v)}
            options={[
              { value: 'budget', label: 'Budget - Cost-effective options' },
              { value: 'moderate', label: 'Moderate - Balanced quality and cost' },
              { value: 'premium', label: 'Premium - High-quality ingredients' }
            ]}
          />
          
          <SelectField
            label="Cooking Skill"
            value={formData.cooking_skill}
            onChange={(v) => handleChange('cooking_skill', v)}
            options={[
              { value: 'beginner', label: 'Beginner - Simple recipes' },
              { value: 'intermediate', label: 'Intermediate - Moderate complexity' },
              { value: 'advanced', label: 'Advanced - Complex techniques' }
            ]}
          />
          
          <SelectField
            label="Meal Prep Style"
            value={formData.meal_prep_preference}
            onChange={(v) => handleChange('meal_prep_preference', v)}
            options={[
              { value: 'daily_fresh', label: 'Daily Fresh - Cook each day' },
              { value: 'weekly_prep', label: 'Weekly Prep - Batch cooking' },
              { value: 'mixed', label: 'Mixed - Combination approach' }
            ]}
          />
        </div>

        {/* Dietary Restrictions */}
        <div className="mt-6">
          <h4 className="font-semibold text-gray-900 mb-3">Dietary Restrictions</h4>
          <div className="grid grid-cols-2 gap-3">
            <CheckboxField
              label="Vegetarian"
              checked={formData.vegetarian}
              onChange={(v) => handleChange('vegetarian', v)}
            />
            <CheckboxField
              label="Vegan"
              checked={formData.vegan}
              onChange={(v) => handleChange('vegan', v)}
            />
            <CheckboxField
              label="Gluten Free"
              checked={formData.gluten_free}
              onChange={(v) => handleChange('gluten_free', v)}
            />
            <CheckboxField
              label="Dairy Free"
              checked={formData.dairy_free}
              onChange={(v) => handleChange('dairy_free', v)}
            />
          </div>
        </div>
      </div>

      {/* Recovery Preferences */}
      <div className="bg-white rounded-2xl p-6 shadow-lg">
        <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
          <span>💪</span>
          Recovery Preferences
        </h3>
        
        <div className="space-y-4">
          <SelectField
            label="Recovery Focus"
            value={formData.recovery_focus}
            onChange={(v) => handleChange('recovery_focus', v)}
            options={[
              { value: 'standard', label: 'Standard - Balanced approach' },
              { value: 'high_intensity', label: 'High Intensity - Push harder' },
              { value: 'recovery_focused', label: 'Recovery Focused - Prioritize rest' }
            ]}
          />
          
          <div>
            <label className="block text-gray-700 font-semibold mb-2">
              Sleep Target: {formData.sleep_target_hours} hours
            </label>
            <input
              type="range"
              min="6"
              max="10"
              step="0.5"
              value={formData.sleep_target_hours}
              onChange={(e) => handleChange('sleep_target_hours', parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>6h</span>
              <span>8h (Recommended)</span>
              <span>10h</span>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full py-4 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl font-bold text-lg hover:shadow-xl transition-all disabled:opacity-50"
      >
        {saving ? 'Saving...' : 'Save All Settings'}
      </button>

      {/* Danger Zone */}
      <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6">
        <h3 className="text-xl font-bold text-red-900 mb-2 flex items-center gap-2">
          <span>⚠️</span>
          Danger Zone
        </h3>
        <p className="text-red-700 text-sm mb-4">
          Deactivating premium will immediately revoke access to all premium features including advanced macros, meal swaps, and recovery insights.
        </p>
        <button
          onClick={async () => {
            if (window.confirm('Are you sure you want to deactivate Premium? This action will remove all premium features immediately.')) {
              try {
                await premiumCoachingService.deactivatePremium();
                alert('Premium deactivated successfully');
                navigate('/premium');
                window.location.reload();
              } catch (error) {
                alert('Failed to deactivate premium');
              }
            }
          }}
          className="px-6 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-all"
        >
          Deactivate Premium
        </button>
      </div>
    </div>
  );
};

const SelectField = ({ label, value, onChange, options }) => (
  <div>
    <label className="block text-gray-700 font-semibold mb-2">{label}</label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-violet-600 outline-none"
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  </div>
);

const CheckboxField = ({ label, checked, onChange }) => (
  <label className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl cursor-pointer hover:bg-gray-100 transition-all">
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      className="w-5 h-5 text-violet-600"
    />
    <span className="text-gray-700">{label}</span>
  </label>
);

export default SettingsTab;
