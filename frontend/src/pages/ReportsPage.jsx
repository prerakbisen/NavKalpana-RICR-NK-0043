import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { reportingService } from '../services/apiService';

export const ReportsPage = () => {
  const navigate = useNavigate();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReport();
  }, []);

  const fetchReport = async () => {
    setLoading(true);
    try {
      const res = await reportingService.getMonthlyReport();
      setReport(res.data);
      console.log('✅ Report fetched successfully:', res.data);
    } catch (error) {
      console.error('❌ Error fetching report:', error);
      setReport(null);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    console.log('🔄 Refreshing report...');
    fetchReport();
  };

  const handleDownloadPDF = () => {
    console.log('📥 Preparing PDF download...');
    // Add print-specific styles
    const style = document.createElement('style');
    style.innerHTML = `
      @media print {
        body * { visibility: hidden; }
        .report-container, .report-container * { visibility: visible; }
        .report-container { position: absolute; left: 0; top: 0; width: 100%; }
        .no-print { display: none !important; }
        .print-title { display: block !important; }
      }
    `;
    document.head.appendChild(style);
    
    // Trigger print
    window.print();
    
    // Clean up
    setTimeout(() => {
      document.head.removeChild(style);
    }, 1000);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-7xl mb-4 animate-bounce">📊</div>
          <p className="text-2xl font-bold text-gray-900">Generating Report...</p>
        </div>
      </div>
    );
  }

  if (!report) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-8">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={() => navigate('/dashboard')}
            className="mb-4 flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-semibold"
          >
            <span>←</span> Back to Dashboard
          </button>
          <div className="bg-white rounded-2xl p-12 text-center shadow-xl">
            <div className="text-6xl mb-4">📊</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">No Report Available</h3>
            <p className="text-gray-600">Unable to generate report. Please try again later.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-8">
      <div className="max-w-6xl mx-auto report-container">
        {/* Header */}
        <button
          onClick={() => navigate('/dashboard')}
          className="mb-4 flex items-center gap-2 text-indigo-600 hover:text-indigo-700 font-semibold no-print"
        >
          <span>←</span> Back to Dashboard
        </button>

        {/* Print Title (hidden on screen, visible in print) */}
        <div className="hidden print-title mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Monthly Fitness Report
          </h1>
          <p className="text-gray-600">
            {new Date(report.period.start).toLocaleDateString()} - {new Date(report.period.end).toLocaleDateString()}
          </p>
        </div>

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
              <span className="text-5xl">📊</span>
              Monthly Fitness Report
            </h1>
            <p className="text-gray-600">
              {new Date(report.period.start).toLocaleDateString()} - {new Date(report.period.end).toLocaleDateString()}
            </p>
          </div>
          <div className="flex gap-3 no-print">
            <button
              onClick={handleRefresh}
              className="px-6 py-3 bg-green-600 text-white rounded-xl font-semibold hover:bg-green-700 transition-all flex items-center gap-2"
              disabled={loading}
            >
              <span>🔄</span>
              Refresh
            </button>
            <button
              onClick={handleDownloadPDF}
              className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-all flex items-center gap-2"
            >
              <span>📥</span>
              Download PDF
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <SummaryCard
            icon="⚖️"
            title="Weight Change"
            value={`${report.summary.weight_change.change >= 0 ? '+' : ''}${report.summary.weight_change.change} kg`}
            subtitle={`${report.summary.weight_change.start_weight} → ${report.summary.weight_change.end_weight} kg`}
            trend={report.summary.weight_change.trend}
            gradient="from-blue-500 to-indigo-600"
          />
          <SummaryCard
            icon="💪"
            title="Workout Adherence"
            value={`${report.summary.workout_adherence.percentage}%`}
            subtitle={`${report.summary.workout_adherence.completed}/${report.summary.workout_adherence.total} workouts`}
            rating={report.summary.workout_adherence.rating}
            gradient="from-green-500 to-emerald-600"
          />
          <SummaryCard
            icon="🥗"
            title="Diet Adherence"
            value={`${report.summary.diet_adherence.percentage}%`}
            subtitle={`${report.summary.diet_adherence.followed}/${report.summary.diet_adherence.total} days`}
            rating={report.summary.diet_adherence.rating}
            gradient="from-orange-500 to-red-600"
          />
        </div>

        {/* Goal Progress */}
        <div className="bg-white rounded-2xl p-6 shadow-xl mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span>🎯</span>
            Goal Progress
          </h3>
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-700 font-semibold">Progress to Goal</span>
              <span className="text-2xl font-bold text-indigo-600">{report.summary.goal_progress.percentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-6">
              <div
                className="bg-gradient-to-r from-indigo-500 to-purple-600 h-6 rounded-full transition-all flex items-center justify-end pr-2"
                style={{ width: `${Math.min(report.summary.goal_progress.percentage, 100)}%` }}
              >
                {report.summary.goal_progress.percentage > 10 && (
                  <span className="text-white text-sm font-bold">{report.summary.goal_progress.percentage}%</span>
                )}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <MetricBox
              label="Start Weight"
              value={`${report.summary.goal_progress.start_weight} kg`}
            />
            <MetricBox
              label="Current Weight"
              value={`${report.summary.goal_progress.current_weight} kg`}
            />
            <MetricBox
              label="Target Weight"
              value={`${report.summary.goal_progress.target_weight} kg`}
            />
          </div>
          <div className="mt-4 p-4 bg-indigo-50 rounded-xl">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{report.summary.goal_progress.on_track ? '✅' : '⚠️'}</span>
              <span className="font-semibold text-gray-900">
                {report.summary.goal_progress.on_track ? 'On Track!' : 'Needs Adjustment'}
              </span>
            </div>
            <p className="text-sm text-gray-600 mt-1">
              {report.summary.goal_progress.remaining.toFixed(2)} kg remaining to reach your goal
            </p>
          </div>
        </div>

        {/* Habit Score */}
        {report.summary.habit_score_average.count > 0 && (
          <div className="bg-white rounded-2xl p-6 shadow-xl mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span>⭐</span>
              Habit Score
            </h3>
            <div className="grid grid-cols-4 gap-4">
              <MetricBox
                label="Average Score"
                value={`${report.summary.habit_score_average.average}/100`}
              />
              <MetricBox
                label="Highest"
                value={report.summary.habit_score_average.highest}
              />
              <MetricBox
                label="Lowest"
                value={report.summary.habit_score_average.lowest}
              />
              <MetricBox
                label="Trend"
                value={report.summary.habit_score_average.trend}
              />
            </div>
          </div>
        )}

        {/* Measurements */}
        {report.summary.measurement_changes.has_data && (
          <div className="bg-white rounded-2xl p-6 shadow-xl mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span>📏</span>
              Body Measurements
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Object.entries(report.summary.measurement_changes.changes).map(([key, data]) => (
                <MeasurementCard
                  key={key}
                  label={key.replace('_', ' ').replace('cm', '')}
                  start={data.start}
                  end={data.end}
                  change={data.change}
                />
              ))}
            </div>
          </div>
        )}

        {/* Details */}
        <div className="bg-white rounded-2xl p-6 shadow-xl mb-8">
          <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <span>📈</span>
            Activity Details
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <MetricBox
              label="Total Workouts"
              value={report.details.total_workouts}
            />
            <MetricBox
              label="Avg Sleep"
              value={`${report.details.avg_sleep}h`}
            />
            <MetricBox
              label="Avg Water"
              value={`${report.details.avg_water}L`}
            />
            <MetricBox
              label="Avg Calories"
              value={report.details.avg_calories}
            />
          </div>
        </div>

        {/* Insights */}
        {report.insights && report.insights.length > 0 && (
          <div className="bg-white rounded-2xl p-6 shadow-xl mb-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <span>💡</span>
              Insights & Recommendations
            </h3>
            <div className="space-y-3">
              {report.insights.map((insight, idx) => (
                <InsightCard key={idx} insight={insight} />
              ))}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="text-center text-gray-500 text-sm">
          <p>Report generated on {new Date(report.generated_at).toLocaleString()}</p>
          <p className="mt-2">FitAI - Your AI-Powered Fitness Coach</p>
          <p className="mt-2 text-xs">
            Last refreshed: {new Date().toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );
};

const SummaryCard = ({ icon, title, value, subtitle, trend, rating, gradient }) => (
  <div className={`bg-gradient-to-br ${gradient} rounded-2xl p-6 text-white shadow-xl`}>
    <div className="text-4xl mb-2">{icon}</div>
    <div className="text-sm opacity-90 mb-1">{title}</div>
    <div className="text-3xl font-bold mb-1">{value}</div>
    <div className="text-sm opacity-75">{subtitle}</div>
    {trend && (
      <div className="mt-2 text-xs opacity-90 capitalize">
        Trend: {trend}
      </div>
    )}
    {rating && (
      <div className="mt-2 text-xs opacity-90 capitalize">
        Rating: {rating}
      </div>
    )}
  </div>
);

const MetricBox = ({ label, value }) => (
  <div className="bg-gray-50 rounded-xl p-4 text-center">
    <div className="text-sm text-gray-600 mb-1">{label}</div>
    <div className="text-xl font-bold text-gray-900 capitalize">{value}</div>
  </div>
);

const MeasurementCard = ({ label, start, end, change }) => (
  <div className="bg-gray-50 rounded-xl p-4">
    <div className="text-sm text-gray-600 mb-2 capitalize">{label}</div>
    <div className="flex items-center justify-between">
      <span className="text-gray-700">{start} cm</span>
      <span className="text-gray-400">→</span>
      <span className="text-gray-700">{end} cm</span>
    </div>
    <div className={`text-sm font-semibold mt-1 ${change < 0 ? 'text-green-600' : change > 0 ? 'text-orange-600' : 'text-gray-600'}`}>
      {change >= 0 ? '+' : ''}{change} cm
    </div>
  </div>
);

const InsightCard = ({ insight }) => {
  const getColor = (type) => {
    switch (type) {
      case 'success': return 'bg-green-50 border-green-200 text-green-800';
      case 'warning': return 'bg-orange-50 border-orange-200 text-orange-800';
      case 'info': return 'bg-blue-50 border-blue-200 text-blue-800';
      default: return 'bg-gray-50 border-gray-200 text-gray-800';
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'success': return '✅';
      case 'warning': return '⚠️';
      case 'info': return 'ℹ️';
      default: return '💡';
    }
  };

  return (
    <div className={`border-2 rounded-xl p-4 ${getColor(insight.type)}`}>
      <div className="flex items-start gap-3">
        <span className="text-2xl">{getIcon(insight.type)}</span>
        <div className="flex-1">
          <div className="font-semibold capitalize mb-1">{insight.category}</div>
          <div className="text-sm">{insight.message}</div>
        </div>
        <span className={`text-xs px-2 py-1 rounded-full ${
          insight.priority === 'high' ? 'bg-red-200 text-red-800' :
          insight.priority === 'medium' ? 'bg-yellow-200 text-yellow-800' :
          'bg-gray-200 text-gray-800'
        }`}>
          {insight.priority}
        </span>
      </div>
    </div>
  );
};

export default ReportsPage;
