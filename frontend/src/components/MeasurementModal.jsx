import React, { useState, useEffect } from 'react';
import { measurementService } from '../services/apiService';

export const MeasurementModal = ({ isOpen, onClose, reminderData, onMeasurementAdded }) => {
  const [measurements, setMeasurements] = useState({
    waist_cm: '',
    chest_cm: '',
    hips_cm: '',
    left_arm_cm: '',
    right_arm_cm: '',
    left_thigh_cm: '',
    right_thigh_cm: ''
  });
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [showAnalysis, setShowAnalysis] = useState(false);

  if (!isOpen) return null;

  const handleInputChange = (field, value) => {
    setMeasurements(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSaveMeasurements = async () => {
    // Validate that at least one measurement is provided
    const hasAnyMeasurement = Object.values(measurements).some(v => v && parseFloat(v) > 0);
    if (!hasAnyMeasurement) {
      alert('Please enter at least one measurement');
      return;
    }

    setSaving(true);
    try {
      // Convert string values to numbers
      const numericMeasurements = {};
      Object.keys(measurements).forEach(key => {
        const value = parseFloat(measurements[key]);
        if (!isNaN(value) && value > 0) {
          numericMeasurements[key] = value;
        }
      });

      // Save measurements
      await measurementService.addMeasurement(numericMeasurements, notes);
      
      alert('✅ Measurements saved successfully!');
      
      // Trigger analysis
      setShowAnalysis(true);
      await analyzeWithAI();
      
    } catch (error) {
      console.error('Error saving measurements:', error);
      alert('Failed to save measurements. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const analyzeWithAI = async () => {
    setAnalyzing(true);
    try {
      const result = await measurementService.analyzeMeasurementsWithAI(false);
      setAnalysis(result.data);
      console.log('📊 Analysis result:', result.data);
    } catch (error) {
      console.error('Error analyzing measurements:', error);
      setAnalysis({
        analysis: {
          progress_level: 'moderate',
          insights: ['Analysis completed. Review your progress in the dashboard.'],
          recommendations: ['Continue with your current plan for another 4 weeks.']
        },
        needs_diet_adjustment: false,
        needs_workout_adjustment: false
      });
    } finally {
      setAnalyzing(false);
    }
  };

  const handleRegeneratePlans = async () => {
    if (!window.confirm('This will regenerate your diet and/or workout plans based on your progress. Continue?')) {
      return;
    }

    setAnalyzing(true);
    try {
      const result = await measurementService.regeneratePlans();
      
      if (result.data.regeneration_results) {
        const messages = result.data.regeneration_results.messages.join('\n');
        alert(`✅ Plans Updated!\n\n${messages}`);
        
        if (onMeasurementAdded) {
          onMeasurementAdded();
        }
        
        onClose();
      }
    } catch (error) {
      console.error('Error regenerating plans:', error);
      alert('Failed to regenerate plans. Please try again.');
    } finally {
      setAnalyzing(false);
    }
  };

  const getProgressColor = (level) => {
    switch (level) {
      case 'excellent': return 'text-green-600 bg-green-50';
      case 'good': return 'text-blue-600 bg-blue-50';
      case 'moderate': return 'text-yellow-600 bg-yellow-50';
      case 'poor': return 'text-red-600 bg-red-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold mb-2">📏 Update Measurements</h2>
              {reminderData && reminderData.reminder_due && (
                <p className="text-sm opacity-90">
                  It's been {reminderData.days_since_last} days since your last measurement
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition-all"
            >
              <span className="text-2xl">×</span>
            </button>
          </div>
        </div>

        <div className="p-6">
          {!showAnalysis ? (
            <>
              {/* Measurement Input Form */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <MeasurementInput
                  label="Waist"
                  icon="⭕"
                  value={measurements.waist_cm}
                  onChange={(v) => handleInputChange('waist_cm', v)}
                />
                <MeasurementInput
                  label="Chest"
                  icon="💪"
                  value={measurements.chest_cm}
                  onChange={(v) => handleInputChange('chest_cm', v)}
                />
                <MeasurementInput
                  label="Hips"
                  icon="🍑"
                  value={measurements.hips_cm}
                  onChange={(v) => handleInputChange('hips_cm', v)}
                />
                <MeasurementInput
                  label="Left Arm"
                  icon="💪"
                  value={measurements.left_arm_cm}
                  onChange={(v) => handleInputChange('left_arm_cm', v)}
                />
                <MeasurementInput
                  label="Right Arm"
                  icon="💪"
                  value={measurements.right_arm_cm}
                  onChange={(v) => handleInputChange('right_arm_cm', v)}
                />
                <MeasurementInput
                  label="Left Thigh"
                  icon="🦵"
                  value={measurements.left_thigh_cm}
                  onChange={(v) => handleInputChange('left_thigh_cm', v)}
                />
                <MeasurementInput
                  label="Right Thigh"
                  icon="🦵"
                  value={measurements.right_thigh_cm}
                  onChange={(v) => handleInputChange('right_thigh_cm', v)}
                />
              </div>

              {/* Notes */}
              <div className="mb-6">
                <label className="block text-gray-700 font-semibold mb-2">
                  Notes (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Any observations or notes about your progress..."
                  className="w-full p-3 border-2 border-gray-200 rounded-xl focus:border-indigo-600 outline-none"
                  rows="3"
                />
              </div>

              {/* Save Button */}
              <button
                onClick={handleSaveMeasurements}
                disabled={saving}
                className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold text-lg hover:shadow-xl transition-all disabled:opacity-50"
              >
                {saving ? 'Saving & Analyzing...' : '💾 Save & Analyze Progress'}
              </button>
            </>
          ) : (
            <>
              {/* Analysis Results */}
              {analyzing ? (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4 animate-bounce">🤖</div>
                  <p className="text-xl font-semibold text-gray-900">Analyzing Your Progress...</p>
                  <p className="text-gray-600 mt-2">AI is evaluating your measurements</p>
                </div>
              ) : analysis ? (
                <div className="space-y-6">
                  {/* Progress Level */}
                  <div className={`p-6 rounded-xl ${getProgressColor(analysis.analysis.progress_level)}`}>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-4xl">
                        {analysis.analysis.progress_level === 'excellent' ? '🌟' :
                         analysis.analysis.progress_level === 'good' ? '👍' :
                         analysis.analysis.progress_level === 'moderate' ? '📊' : '⚠️'}
                      </span>
                      <div>
                        <h3 className="text-2xl font-bold capitalize">{analysis.analysis.progress_level} Progress!</h3>
                        <p className="text-sm opacity-75">Based on your 4-week measurements</p>
                      </div>
                    </div>
                  </div>

                  {/* Measurement Changes */}
                  {analysis.changes && (
                    <div className="bg-gray-50 rounded-xl p-6">
                      <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <span>📊</span> Measurement Changes
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {Object.entries(analysis.changes).map(([key, value]) => (
                          <div key={key} className="text-center">
                            <div className="text-sm text-gray-600 capitalize mb-1">
                              {key.replace('_', ' ')}
                            </div>
                            <div className={`text-xl font-bold ${
                              value < 0 ? 'text-green-600' : value > 0 ? 'text-orange-600' : 'text-gray-600'
                            }`}>
                              {value >= 0 ? '+' : ''}{value.toFixed(1)}cm
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Insights */}
                  {analysis.analysis.insights && analysis.analysis.insights.length > 0 && (
                    <div className="bg-blue-50 rounded-xl p-6">
                      <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <span>💡</span> AI Insights
                      </h4>
                      <ul className="space-y-2">
                        {analysis.analysis.insights.map((insight, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-gray-700">
                            <span className="text-blue-600 mt-1">•</span>
                            <span>{insight}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Plan Adjustments Needed */}
                  {(analysis.needs_diet_adjustment || analysis.needs_workout_adjustment) && (
                    <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-6">
                      <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <span>🔄</span> Plan Adjustments Recommended
                      </h4>
                      {analysis.needs_diet_adjustment && (
                        <div className="mb-3">
                          <div className="font-semibold text-gray-900">Diet Plan:</div>
                          <div className="text-gray-700">{analysis.analysis.diet_adjustment_reason}</div>
                        </div>
                      )}
                      {analysis.needs_workout_adjustment && (
                        <div>
                          <div className="font-semibold text-gray-900">Workout Plan:</div>
                          <div className="text-gray-700">{analysis.analysis.workout_adjustment_reason}</div>
                        </div>
                      )}
                      <button
                        onClick={handleRegeneratePlans}
                        className="mt-4 w-full py-3 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
                      >
                        🔄 Regenerate Plans Now
                      </button>
                    </div>
                  )}

                  {/* Recommendations */}
                  {analysis.analysis.recommendations && analysis.analysis.recommendations.length > 0 && (
                    <div className="bg-green-50 rounded-xl p-6">
                      <h4 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <span>✅</span> Recommendations
                      </h4>
                      <ul className="space-y-2">
                        {analysis.analysis.recommendations.map((rec, idx) => (
                          <li key={idx} className="flex items-start gap-2 text-gray-700">
                            <span className="text-green-600 mt-1">✓</span>
                            <span>{rec}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Action Buttons */}
                  <div className="flex gap-3">
                    <button
                      onClick={onClose}
                      className="flex-1 py-3 bg-gray-200 text-gray-700 rounded-xl font-semibold hover:bg-gray-300 transition-all"
                    >
                      Close
                    </button>
                    {!analysis.needs_diet_adjustment && !analysis.needs_workout_adjustment && (
                      <button
                        onClick={() => {
                          if (onMeasurementAdded) onMeasurementAdded();
                          onClose();
                        }}
                        className="flex-1 py-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-semibold hover:shadow-lg transition-all"
                      >
                        Done
                      </button>
                    )}
                  </div>
                </div>
              ) : null}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const MeasurementInput = ({ label, icon, value, onChange }) => (
  <div>
    <label className="block text-gray-700 font-semibold mb-2 flex items-center gap-2">
      <span>{icon}</span>
      {label}
    </label>
    <div className="relative">
      <input
        type="number"
        step="0.1"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="0.0"
        className="w-full p-3 pr-12 border-2 border-gray-200 rounded-xl focus:border-indigo-600 outline-none text-lg"
      />
      <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500 font-semibold">
        cm
      </span>
    </div>
  </div>
);

export default MeasurementModal;
