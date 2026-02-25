import React from 'react';

export const RecoveryTab = ({ recovery, onRefresh }) => {
  if (!recovery || recovery.status === 'insufficient_data') {
    return (
      <div className="bg-white rounded-2xl p-12 text-center shadow-lg">
        <div className="text-6xl mb-4">📊</div>
        <h3 className="text-2xl font-bold text-gray-900 mb-2">Insufficient Data</h3>
        <p className="text-gray-600 mb-6">
          We need at least 7 days of daily logs to analyze your recovery status
        </p>
        <button
          onClick={onRefresh}
          className="px-6 py-3 bg-violet-600 text-white rounded-xl font-semibold hover:bg-violet-700"
        >
          Refresh Analysis
        </button>
      </div>
    );
  }

  const getStatusColor = (score) => {
    if (score >= 80) return 'from-green-500 to-emerald-600';
    if (score >= 60) return 'from-yellow-500 to-orange-500';
    if (score >= 40) return 'from-orange-500 to-red-500';
    return 'from-red-600 to-red-800';
  };

  const getStatusEmoji = (status) => {
    switch (status) {
      case 'excellent': return '🌟';
      case 'good': return '✅';
      case 'moderate': return '⚠️';
      case 'poor': return '🚨';
      default: return '📊';
    }
  };

  return (
    <div className="space-y-6">
      {/* Recovery Score Card */}
      <div className={`bg-gradient-to-br ${getStatusColor(recovery.recovery_score)} rounded-2xl p-8 text-white shadow-2xl`}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="text-sm opacity-90 mb-1">Recovery Score</div>
            <div className="text-6xl font-bold">{recovery.recovery_score}</div>
            <div className="text-xl opacity-90">out of 100</div>
          </div>
          <div className="text-8xl">{getStatusEmoji(recovery.status)}</div>
        </div>
        <div className="text-xl font-semibold capitalize">{recovery.status} Recovery</div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          icon="😴"
          label="Avg Sleep"
          value={`${recovery.metrics.avg_sleep.toFixed(1)}h`}
          target="7-9h"
          status={recovery.metrics.avg_sleep >= 7 ? 'good' : 'warning'}
        />
        <MetricCard
          icon="⚡"
          label="Energy Level"
          value={`${recovery.metrics.avg_energy.toFixed(1)}/3`}
          target="2.0+"
          status={recovery.metrics.avg_energy >= 2 ? 'good' : 'warning'}
        />
        <MetricCard
          icon="😫"
          label="Fatigue Days"
          value={recovery.metrics.fatigue_days}
          target="<3"
          status={recovery.metrics.fatigue_days < 3 ? 'good' : 'warning'}
        />
        <MetricCard
          icon="❌"
          label="Missed Workouts"
          value={recovery.metrics.missed_workouts}
          target="<2"
          status={recovery.metrics.missed_workouts < 2 ? 'good' : 'warning'}
        />
      </div>

      {/* Workout Performance */}
      {recovery.metrics.workout_performance && (
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <h4 className="text-xl font-bold text-gray-900 mb-4">Workout Performance</h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="text-sm text-gray-600 mb-1">Completion Rate</div>
              <div className="text-3xl font-bold text-gray-900">
                {(recovery.metrics.workout_performance.recent_completion_rate * 100).toFixed(0)}%
              </div>
            </div>
            <div className="bg-gray-50 rounded-xl p-4">
              <div className="text-sm text-gray-600 mb-1">Trend</div>
              <div className="text-3xl font-bold">
                {recovery.metrics.workout_performance.trend === 'improving' ? '📈' : '📉'}
              </div>
              <div className="text-sm text-gray-600 capitalize">
                {recovery.metrics.workout_performance.trend}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Warnings */}
      {recovery.warnings && recovery.warnings.length > 0 && (
        <div className="bg-orange-50 border-2 border-orange-200 rounded-2xl p-6">
          <h4 className="text-xl font-bold text-orange-900 mb-4 flex items-center gap-2">
            <span>⚠️</span>
            Warnings
          </h4>
          <ul className="space-y-2">
            {recovery.warnings.map((warning, idx) => (
              <li key={idx} className="flex items-start gap-2 text-orange-800">
                <span className="text-orange-500 mt-1">•</span>
                <span>{warning}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Recommendations */}
      {recovery.recommendations && recovery.recommendations.length > 0 && (
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <h4 className="text-xl font-bold text-gray-900 mb-4">Recommendations</h4>
          <div className="space-y-4">
            {recovery.recommendations.map((rec, idx) => (
              <RecommendationCard key={idx} recommendation={rec} />
            ))}
          </div>
        </div>
      )}

      {/* Stress Indicators */}
      {recovery.metrics.stress_indicators && recovery.metrics.stress_indicators.length > 0 && (
        <div className="bg-red-50 border-2 border-red-200 rounded-2xl p-6">
          <h4 className="text-xl font-bold text-red-900 mb-4 flex items-center gap-2">
            <span>🚨</span>
            Stress Indicators Detected
          </h4>
          <div className="space-y-2">
            {recovery.metrics.stress_indicators.map((indicator, idx) => (
              <div key={idx} className="flex items-center gap-2 text-red-800">
                <span className="text-red-500">⚠️</span>
                <span className="capitalize">{indicator.replace('_', ' ')}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Refresh Button */}
      <button
        onClick={onRefresh}
        className="w-full py-4 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl font-bold hover:shadow-xl transition-all"
      >
        🔄 Refresh Recovery Analysis
      </button>
    </div>
  );
};

const MetricCard = ({ icon, label, value, target, status }) => (
  <div className={`rounded-xl p-4 ${
    status === 'good' ? 'bg-green-50 border-2 border-green-200' : 'bg-orange-50 border-2 border-orange-200'
  }`}>
    <div className="text-3xl mb-2">{icon}</div>
    <div className="text-sm text-gray-600 mb-1">{label}</div>
    <div className="text-2xl font-bold text-gray-900 mb-1">{value}</div>
    <div className="text-xs text-gray-500">Target: {target}</div>
  </div>
);

const RecommendationCard = ({ recommendation }) => {
  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800 border-red-300';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      default: return 'bg-blue-100 text-blue-800 border-blue-300';
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'sleep': return '😴';
      case 'rest': return '🛌';
      case 'nutrition': return '🥗';
      case 'training': return '💪';
      default: return '💡';
    }
  };

  return (
    <div className="border-2 border-gray-200 rounded-xl p-4 hover:border-violet-300 transition-all">
      <div className="flex items-start gap-3">
        <div className="text-3xl">{getTypeIcon(recommendation.type)}</div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h5 className="font-bold text-gray-900">{recommendation.title}</h5>
            <span className={`text-xs px-2 py-1 rounded-full border ${getPriorityColor(recommendation.priority)}`}>
              {recommendation.priority}
            </span>
          </div>
          <p className="text-gray-600 text-sm">{recommendation.description}</p>
        </div>
      </div>
    </div>
  );
};

export default RecoveryTab;
