import React from 'react';

export const OverviewTab = ({ macros, recovery, preferences }) => {
  return (
    <div className="space-y-6">
      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          icon="🎯"
          title="Macro Strategy"
          value={preferences?.macro_strategy?.replace('_', ' ') || 'Balanced'}
          subtitle="Current approach"
          gradient="from-blue-500 to-indigo-600"
        />
        <StatCard
          icon="💪"
          title="Recovery Score"
          value={recovery?.recovery_score ? `${recovery.recovery_score}/100` : 'N/A'}
          subtitle={recovery?.status || 'Calculating...'}
          gradient="from-green-500 to-emerald-600"
        />
        <StatCard
          icon="🔥"
          title="Daily Protein"
          value={macros?.macros?.protein_g ? `${macros.macros.protein_g}g` : 'N/A'}
          subtitle={`${preferences?.protein_per_kg || 2.0}g per kg`}
          gradient="from-orange-500 to-red-600"
        />
      </div>

      {/* Current Macros */}
      {macros && (
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span>🎯</span>
            Your Premium Macros
          </h3>
          <p className="text-gray-600 mb-6">
            Calculated using <span className="font-semibold text-violet-600">{macros.strategy}</span> strategy
          </p>
          
          <div className="grid grid-cols-3 gap-4">
            <MacroCard
              label="Protein"
              grams={macros.macros.protein_g}
              percent={macros.macros.protein_percent}
              color="bg-blue-500"
            />
            <MacroCard
              label="Carbs"
              grams={macros.macros.carbs_g}
              percent={macros.macros.carbs_percent}
              color="bg-green-500"
            />
            <MacroCard
              label="Fat"
              grams={macros.macros.fat_g}
              percent={macros.macros.fat_percent}
              color="bg-orange-500"
            />
          </div>
        </div>
      )}

      {/* Recovery Status */}
      {recovery && recovery.status !== 'insufficient_data' && (
        <div className="bg-white rounded-2xl p-6 shadow-lg">
          <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span>💪</span>
            Recovery Status
          </h3>
          
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-700 font-semibold">Recovery Score</span>
              <span className="text-2xl font-bold text-violet-600">{recovery.recovery_score}/100</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div
                className={`h-4 rounded-full transition-all ${
                  recovery.recovery_score >= 80 ? 'bg-green-500' :
                  recovery.recovery_score >= 60 ? 'bg-yellow-500' :
                  recovery.recovery_score >= 40 ? 'bg-orange-500' : 'bg-red-500'
                }`}
                style={{ width: `${recovery.recovery_score}%` }}
              ></div>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <MetricBox label="Avg Sleep" value={`${recovery.metrics.avg_sleep.toFixed(1)}h`} />
            <MetricBox label="Energy Level" value={`${recovery.metrics.avg_energy.toFixed(1)}/3`} />
            <MetricBox label="Fatigue Days" value={recovery.metrics.fatigue_days} />
            <MetricBox label="Missed Workouts" value={recovery.metrics.missed_workouts} />
          </div>

          {recovery.recommendations && recovery.recommendations.length > 0 && (
            <div>
              <h4 className="font-semibold text-gray-900 mb-3">Recommendations:</h4>
              <div className="space-y-2">
                {recovery.recommendations.slice(0, 3).map((rec, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 bg-violet-50 rounded-xl">
                    <span className="text-2xl">{rec.type === 'sleep' ? '😴' : rec.type === 'rest' ? '🛌' : '💡'}</span>
                    <div>
                      <div className="font-semibold text-gray-900">{rec.title}</div>
                      <div className="text-sm text-gray-600">{rec.description}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const StatCard = ({ icon, title, value, subtitle, gradient }) => (
  <div className={`bg-gradient-to-br ${gradient} rounded-2xl p-6 text-white shadow-lg`}>
    <div className="text-4xl mb-2">{icon}</div>
    <div className="text-sm opacity-90 mb-1">{title}</div>
    <div className="text-3xl font-bold mb-1">{value}</div>
    <div className="text-sm opacity-75">{subtitle}</div>
  </div>
);

const MacroCard = ({ label, grams, percent, color }) => (
  <div className="bg-gray-50 rounded-xl p-4">
    <div className={`w-3 h-3 rounded-full ${color} mb-2`}></div>
    <div className="text-sm text-gray-600 mb-1">{label}</div>
    <div className="text-2xl font-bold text-gray-900">{grams}g</div>
    <div className="text-sm text-gray-500">{percent}%</div>
  </div>
);

const MetricBox = ({ label, value }) => (
  <div className="bg-gray-50 rounded-xl p-3 text-center">
    <div className="text-sm text-gray-600 mb-1">{label}</div>
    <div className="text-xl font-bold text-gray-900">{value}</div>
  </div>
);

export default OverviewTab;
