import React, { useState, useEffect } from 'react';
import { workoutService, progressService, profileService, dailyLogService, measurementService, planAdjustmentService } from '../services/apiService';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from 'recharts';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MeasurementModal } from '../components/MeasurementModal';

export const DashboardPage = () => {
  const navigate = useNavigate();
  const { logout, user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [workout, setWorkout] = useState(null);
  const [habitScore, setHabitScore] = useState(null);
  const [progress, setProgress] = useState([]);
  const [dropoffRisk, setDropoffRisk] = useState(null);
  const [recentLogs, setRecentLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isReturningUser, setIsReturningUser] = useState(false);
  const [activeView, setActiveView] = useState('dashboard');
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [measurementReminder, setMeasurementReminder] = useState(null);
  const [planEvaluation, setPlanEvaluation] = useState(null);
  const [latestMeasurements, setLatestMeasurements] = useState(null);
  const [goalProgress, setGoalProgress] = useState(null);
  const [energyStatus, setEnergyStatus] = useState(null);
  const [goalForecast, setGoalForecast] = useState(null);
  const [measurementTrends, setMeasurementTrends] = useState(null);
  const [showMeasurementModal, setShowMeasurementModal] = useState(false);

  useEffect(() => {
    const returningStatus = localStorage.getItem('isReturningUser');
    setIsReturningUser(returningStatus === 'true');
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const fetchDashboardData = async () => {
    try {
      const [profileRes, workoutRes, habitRes, progressRes, dropoffRes, logsRes, reminderRes, evaluationRes, goalRes, energyRes, forecastRes, trendsRes, measurementsRes] = await Promise.all([
        profileService.getProfile(),
        workoutService.getLatestWorkout(),
        progressService.getCurrentHabitScore(),
        progressService.getRecentProgress(7),
        progressService.checkDropoffRisk(),
        dailyLogService.getRecentLogs(7),
        measurementService.checkReminder().catch(() => ({ data: { reminder_due: false } })),
        planAdjustmentService.getWeeklyEvaluation().catch(() => ({ data: { needs_adjustment: false } })),
        progressService.getGoalProgress().catch(() => ({ data: null })),
        progressService.getEnergyStatus().catch(() => ({ data: null })),
        progressService.getGoalForecast().catch(() => ({ data: null })),
        progressService.getMeasurementTrends().catch(() => ({ data: null })),
        measurementService.getLatestMeasurement().catch(() => ({ data: null }))
      ]);
      
      console.log('📊 Measurement Reminder Data:', reminderRes.data);
      console.log('📏 Latest Measurements:', measurementsRes.data);
      
      setProfile(profileRes.data);
      setWorkout(workoutRes.data);
      setHabitScore(habitRes.data);
      setProgress(progressRes.data.reverse());
      setDropoffRisk(dropoffRes.data);
      setRecentLogs(logsRes.data);
      setMeasurementReminder(reminderRes.data);
      setPlanEvaluation(evaluationRes.data);
      setGoalProgress(goalRes.data);
      setEnergyStatus(energyRes.data);
      setGoalForecast(forecastRes.data);
      setMeasurementTrends(trendsRes.data);
      setLatestMeasurements(measurementsRes.data);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 flex items-center justify-center">
      <div className="text-center">
        <div className="text-7xl mb-4 animate-bounce-subtle">⏳</div>
        <p className="text-2xl font-bold text-gray-900">Loading...</p>
      </div>
    </div>
  );

  
  const todayLog = recentLogs.length > 0 ? recentLogs[recentLogs.length - 1] : null;
  const completionPercentage = todayLog 
    ? Math.round(((todayLog.workout_completed ? 1 : 0) + (todayLog.diet_followed ? 1 : 0)) / 2 * 100)
    : 0;

  
  const today = new Date().getDay(); 
  const todayWorkout = workout?.workouts?.find(w => w.day === today) || 
                       workout?.workouts?.find(w => !w.rest_day); 
  
  
  const todayExercises = todayWorkout?.exercises || [];

  
  const getDailyMotivation = () => {
    const dayOfWeek = new Date().getDay();
    
    
    if (todayWorkout?.rest_day) {
      return {
        icon: '🛌',
        title: 'Rest Day',
        message: '"Rest when you\'re weary. Refresh and renew yourself, your body, your mind, your spirit. Then get back to work." - Ralph Marston',
        color: 'from-green-500 to-emerald-600'
      };
    }
    
    
    const todayCompleted = todayLog?.workout_completed;
    if (todayCompleted) {
      return {
        icon: '🎉',
        title: 'Well Done!',
        message: '"Success is the sum of small efforts repeated day in and day out." - Robert Collier',
        color: 'from-purple-500 to-pink-600'
      };
    }
    
    
    const motivations = {
      0: { 
        icon: '🌅',
        title: 'Sunday Motivation',
        message: '"The only bad workout is the one that didn\'t happen." - Unknown',
        color: 'from-orange-500 to-red-600'
      },
      1: { 
        icon: '💪',
        title: 'Monday Motivation',
        message: '"The body achieves what the mind believes." - Napoleon Hill',
        color: 'from-blue-500 to-indigo-600'
      },
      2: { 
        icon: '🔥',
        title: 'Tuesday Motivation',
        message: '"Strength doesn\'t come from what you can do. It comes from overcoming the things you once thought you couldn\'t." - Rikki Rogers',
        color: 'from-red-500 to-orange-600'
      },
      3: { 
        icon: '⚡',
        title: 'Wednesday Motivation',
        message: '"The pain you feel today will be the strength you feel tomorrow." - Arnold Schwarzenegger',
        color: 'from-yellow-500 to-amber-600'
      },
      4: { 
        icon: '🎯',
        title: 'Thursday Motivation',
        message: '"Don\'t limit your challenges. Challenge your limits." - Unknown',
        color: 'from-teal-500 to-cyan-600'
      },
      5: { 
        icon: '🚀',
        title: 'Friday Motivation',
        message: '"Your body can stand almost anything. It\'s your mind that you have to convince." - Andrew Murphy',
        color: 'from-violet-500 to-purple-600'
      },
      6: { 
        icon: '💯',
        title: 'Saturday Motivation',
        message: '"The difference between try and triumph is a little umph." - Marvin Phillips',
        color: 'from-pink-500 to-rose-600'
      }
    };
    
    return motivations[dayOfWeek] || motivations[1];
  };

  const dailyMotivation = getDailyMotivation();

  
  const weeklyWorkouts = recentLogs.filter(log => log.workout_completed).length;
  const totalWaterIntake = recentLogs.reduce((sum, log) => sum + (log.water_intake_liters || 0), 0);
  const avgWaterIntake = recentLogs.length > 0 ? (totalWaterIntake / recentLogs.length).toFixed(1) : 0;
  const weeklyCalories = recentLogs.reduce((sum, log) => sum + (log.calories_consumed || 0), 0);
  const avgCalories = recentLogs.length > 0 ? Math.round(weeklyCalories / recentLogs.length) : 0;
  const avgSleep = recentLogs.length > 0 ? (recentLogs.reduce((sum, log) => sum + (log.sleep_hours || 0), 0) / recentLogs.length).toFixed(1) : 0;

  
  const performanceData = recentLogs.slice(-7).map((log, idx) => {
    const logDate = new Date(log.date);
    const dayName = logDate.toLocaleDateString('en-US', { weekday: 'short' });
    
    
    const energyMap = { 'Low': 1, 'Medium': 2, 'High': 3 };
    const energyValue = energyMap[log.energy_level] || 2;
    
    return {
      day: dayName,
      calories: log.calories_consumed || 0,
      water: log.water_intake_liters || 0,
      sleep: log.sleep_hours || 0,
      energy: energyValue,
      workout: log.workout_completed ? 1 : 0,
      diet: log.diet_followed ? 1 : 0
    };
  });

  
  const adherenceByWeek = {};
  const fourWeeksInDays = 28;
  recentLogs.slice(-fourWeeksInDays).forEach(log => {
    const logDate = new Date(log.date);
    const weekNum = Math.ceil((logDate - new Date(logDate.getFullYear(), 0, 1)) / (7 * 24 * 60 * 60 * 1000));
    if (!adherenceByWeek[weekNum]) {
      adherenceByWeek[weekNum] = {
        week_number: weekNum,
        total_days: 0,
        workout_score: 0,
        diet_score: 0
      };
    }
    adherenceByWeek[weekNum].total_days++;
    
    
    const workoutScore = {
      'Completed': 100,
      'Partial': 50,
      'Skipped': 0
    }[log.workout_status] || (log.workout_completed ? 100 : 0);
    
    const dietScore = {
      'Followed': 100,
      'Mostly': 70,
      'Deviated': 0
    }[log.diet_adherence] || (log.diet_followed ? 100 : 0);
    
    adherenceByWeek[weekNum].workout_score += workoutScore;
    adherenceByWeek[weekNum].diet_score += dietScore;
  });

  // Calculate goal timeline
  const calculateGoalTimeline = () => {
    if (!profile) return null;
    
    const currentWeight = profile.weight_kg;
    const targetWeight = profile.target_weight_kg;
    const weightDiff = Math.abs(targetWeight - currentWeight);
    
    // Safe rates per week
    const safeRates = {
      'Weight Loss': { min: 0.5, max: 1.0 },
      'Muscle Gain': { min: 0.25, max: 0.5 },
      'Maintenance': { min: 0, max: 0 }
    };
    
    const rate = safeRates[profile.goal] || safeRates['Maintenance'];
    
    if (profile.goal === 'Maintenance' || weightDiff < 0.5) {
      return {
        weeks: 0,
        months: 0,
        display: 'Ongoing'
      };
    }
    
    // Calculate using average of min and max safe rate
    const avgRate = (rate.min + rate.max) / 2;
    const weeks = Math.ceil(weightDiff / avgRate);
    const months = Math.round(weeks / 4.33);
    
    return {
      weeks,
      months,
      display: months > 0 ? `${months} month${months > 1 ? 's' : ''}` : `${weeks} weeks`
    };
  };

  const goalTimeline = calculateGoalTimeline();
  const goalIcons = {
    'Weight Loss': '🎯',
    'Muscle Gain': '💪',
    'Maintenance': '⚖️'
  };
  const goalColors = {
    'Weight Loss': 'from-rose-500 to-pink-600',
    'Muscle Gain': 'from-blue-500 to-indigo-600',
    'Maintenance': 'from-green-500 to-emerald-600'
  };











  const adherenceData = Object.values(adherenceByWeek)
    .map(week => ({
      week: `W${week.week_number}`,
      workout: Math.round(week.workout_score / week.total_days),
      diet: Math.round(week.diet_score / week.total_days)
    }))
    .sort((a, b) => parseInt(a.week.slice(1)) - parseInt(b.week.slice(1)))
    .slice(-4); 

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
      
      <div className="fixed left-0 top-0 h-full w-64 bg-gradient-to-b from-gray-900 to-gray-800 text-white p-6 shadow-2xl z-50">
        
        <div className="mb-12">
          <h1 className="text-4xl font-bold mb-2">
            <span className="text-white">Fit</span>
            <span className="text-teal-400">🤖</span>
            <span className="text-white">Ai</span>
          </h1>
        </div>

        
        <nav className="space-y-2">
          <button
            onClick={() => setActiveView('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
              activeView === 'dashboard'
                ? 'bg-teal-500 text-white shadow-lg'
                : 'text-gray-300 hover:bg-gray-700'
            }`}
          >
            <span className="text-xl">🏠</span>
            <span className="font-semibold">Dashboard</span>
          </button>
          
          <button
            onClick={() => navigate('/daily-log')}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-300 hover:bg-gray-700 transition-all"
          >
            <span className="text-xl">📝</span>
            <span className="font-semibold">Daily Log</span>
          </button>
          
          <button
            onClick={() => navigate('/workouts')}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-300 hover:bg-gray-700 transition-all"
          >
            <span className="text-xl">💪</span>
            <span className="font-semibold">Workouts</span>
          </button>
          
          <button
            onClick={() => navigate('/diet')}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-300 hover:bg-gray-700 transition-all"
          >
            <span className="text-xl">🥗</span>
            <span className="font-semibold">Diet</span>
          </button>
          
          <button
            onClick={() => navigate('/progress')}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-300 hover:bg-gray-700 transition-all"
          >
            <span className="text-xl">📊</span>
            <span className="font-semibold">Progress</span>
          </button>
          
          <button
            onClick={() => navigate('/assistant')}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-300 hover:bg-gray-700 transition-all"
          >
            <span className="text-xl">🤖</span>
            <span className="font-semibold">AI Coach</span>
          </button>
          
          <button
            onClick={() => navigate('/premium')}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white hover:shadow-lg transition-all"
          >
            <span className="text-xl">💎</span>
            <span className="font-semibold">Premium</span>
          </button>
          
          <button
            onClick={() => navigate('/reports')}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-300 hover:bg-gray-700 transition-all"
          >
            <span className="text-xl">📊</span>
            <span className="font-semibold">Reports</span>
          </button>
        </nav>

        
        <div className="absolute bottom-6 left-6 right-6 space-y-2">
          <button
            onClick={() => navigate('/profile')}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-300 hover:bg-gray-700 transition-all"
          >
            <span className="text-xl">⚙️</span>
            <span className="font-semibold">Settings</span>
          </button>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-gray-300 hover:bg-red-600 transition-all"
          >
            <span className="text-xl">🚪</span>
            <span className="font-semibold">Logout</span>
          </button>
        </div>
      </div>

      
      <div className="ml-64 p-8">
        
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              {isReturningUser ? 'Welcome Back!' : 'Welcome!'}
            </h1>
            <p className="text-gray-600">
              {user?.name || profile?.name || 'User'} • {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div className="flex gap-3">
            <button className="p-3 bg-white rounded-xl shadow-sm hover:shadow-md transition-all">
              <span className="text-xl">🔍</span>
            </button>
            <button className="p-3 bg-white rounded-xl shadow-sm hover:shadow-md transition-all">
              <span className="text-xl">🔔</span>
            </button>
            <button className="p-3 bg-white rounded-xl shadow-sm hover:shadow-md transition-all">
              <span className="text-xl">☰</span>
            </button>
          </div>
        </div>

        
        {measurementReminder?.reminder_due && (
          <div className="mb-6 bg-gradient-to-r from-violet-500 to-purple-600 rounded-2xl p-6 text-white shadow-xl animate-slide-down">
            <div className="flex items-start gap-4">
              <div className="text-5xl animate-bounce-subtle">📏</div>
              <div className="flex-1">
                <h3 className="text-xl font-bold mb-2">Time to Update Your Measurements!</h3>
                <p className="text-sm opacity-90 mb-3">
                  It's been {measurementReminder.days_since_last} days since your last measurement. 
                  Update your body measurements to track your progress beyond just weight.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => navigate('/profile')}
                    className="px-6 py-2 bg-white text-violet-600 rounded-lg font-semibold hover:bg-gray-100 transition-all"
                  >
                    Update Measurements
                  </button>
                  <button
                    onClick={() => setMeasurementReminder({ ...measurementReminder, reminder_due: false })}
                    className="px-6 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg font-semibold transition-all"
                  >
                    Remind Me Later
                  </button>
                </div>
              </div>
              <button
                onClick={() => setMeasurementReminder({ ...measurementReminder, reminder_due: false })}
                className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-all"
              >
                <span className="text-xl">✕</span>
              </button>
            </div>
          </div>
        )}

        {/* Plan Adjustment Notification */}
        {planEvaluation?.needs_adjustment && (
          <div className="mb-6 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-6 text-white shadow-xl animate-slide-down">
            <div className="flex items-start gap-4">
              <div className="text-5xl animate-bounce-subtle">🎯</div>
              <div className="flex-1">
                <h3 className="text-xl font-bold mb-2">Smart Plan Adjustment Recommended</h3>
                <p className="text-sm opacity-90 mb-3">
                  Based on your weekly progress, we've identified some adjustments to optimize your results.
                </p>
                
                {/* Show triggers */}
                <div className="mb-3 space-y-2">
                  {planEvaluation.triggers?.map((trigger, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm bg-white bg-opacity-20 rounded-lg p-2">
                      <span>{trigger.severity === 'high' ? '⚠️' : '📊'}</span>
                      <span>{trigger.message}</span>
                    </div>
                  ))}
                </div>

                {/* Show recommendations */}
                <div className="mb-3 space-y-1">
                  {planEvaluation.recommendations?.slice(0, 2).map((rec, idx) => (
                    <div key={idx} className="text-xs opacity-90">
                      • {rec.description}
                    </div>
                  ))}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={async () => {
                      try {
                        const res = await planAdjustmentService.triggerAutoAdjustment();
                        if (res.data.adjusted) {
                          alert('Plans adjusted successfully! Check your Workout and Diet pages.');
                          setPlanEvaluation({ ...planEvaluation, needs_adjustment: false });
                        }
                      } catch (err) {
                        alert('Failed to adjust plans. Please try again.');
                      }
                    }}
                    className="px-6 py-2 bg-white text-blue-600 rounded-lg font-semibold hover:bg-gray-100 transition-all"
                  >
                    Apply Adjustments
                  </button>
                  <button
                    onClick={() => setPlanEvaluation({ ...planEvaluation, needs_adjustment: false })}
                    className="px-6 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg font-semibold transition-all"
                  >
                    Remind Me Later
                  </button>
                </div>
              </div>
              <button
                onClick={() => setPlanEvaluation({ ...planEvaluation, needs_adjustment: false })}
                className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-all"
              >
                <span className="text-xl">✕</span>
              </button>
            </div>
          </div>
        )}

        {/* Main Grid - Balanced 2 Column Layout */}
        <div className="grid grid-cols-2 gap-6">
          {/* Left Section - 5 Cards */}
          <div className="space-y-6">
            {/* Daily Motivation Card */}
            <div className={`bg-gradient-to-br ${dailyMotivation.color} rounded-3xl p-6 text-white shadow-xl transform hover:scale-105 transition-all duration-300`}>
              <div className="flex items-start gap-4 mb-4">
                <div className="text-5xl animate-bounce-subtle">{dailyMotivation.icon}</div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-2">{dailyMotivation.title}</h3>
                  <p className="text-sm leading-relaxed opacity-95">
                    {dailyMotivation.message}
                  </p>
                </div>
              </div>
              
              
              {!todayWorkout?.rest_day && !todayLog?.workout_completed && (
                <div className="mt-4 pt-4 border-t border-white border-opacity-30">
                  <div className="flex justify-between items-center text-sm mb-2">
                    <span className="opacity-90">Today's Progress</span>
                    <span className="font-bold">{completionPercentage}%</span>
                  </div>
                  <div className="w-full bg-white bg-opacity-20 rounded-full h-2">
                    <div 
                      className="bg-white rounded-full h-2 transition-all duration-500"
                      style={{width: `${completionPercentage}%`}}
                    ></div>
                  </div>
                </div>
              )}
              
              {todayLog?.workout_completed && (
                <div className="mt-4 pt-4 border-t border-white border-opacity-30 flex items-center justify-center gap-2">
                  <span className="text-2xl">✅</span>
                  <span className="font-semibold">Workout Completed!</span>
                </div>
              )}
            </div>

            
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl p-6 text-white shadow-xl">
              <h3 className="text-lg font-semibold mb-6">Daily Activity</h3>
              
              
              <div className="relative w-48 h-48 mx-auto mb-6">
                <svg className="transform -rotate-90 w-48 h-48">
                  <circle
                    cx="96"
                    cy="96"
                    r="88"
                    stroke="#374151"
                    strokeWidth="12"
                    fill="none"
                  />
                  <circle
                    cx="96"
                    cy="96"
                    r="88"
                    stroke="url(#gradient)"
                    strokeWidth="12"
                    fill="none"
                    strokeDasharray={`${completionPercentage * 5.53} 553`}
                    strokeLinecap="round"
                    className="transition-all duration-1000"
                  />
                  <defs>
                    <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#14b8a6" />
                      <stop offset="100%" stopColor="#f97316" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="text-5xl font-bold">{completionPercentage}%</div>
                  <div className="text-sm text-gray-400">Complete</div>
                </div>
              </div>

              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full bg-teal-400"></div>
                    <span className="text-gray-400">Workouts</span>
                  </div>
                  <div className="text-xl font-bold">{weeklyWorkouts}/7</div>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full bg-blue-400"></div>
                    <span className="text-gray-400">Avg Calories</span>
                  </div>
                  <div className="text-xl font-bold">{avgCalories}</div>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full bg-teal-400"></div>
                    <span className="text-gray-400">Water (L)</span>
                  </div>
                  <div className="text-xl font-bold">{avgWaterIntake}</div>
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full bg-orange-400"></div>
                    <span className="text-gray-400">Sleep (hrs)</span>
                  </div>
                  <div className="text-xl font-bold">{avgSleep}</div>
                </div>
              </div>

              
              <div className="flex justify-center gap-2 mt-6">
                {[...Array(5)].map((_, i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full ${
                      i === 0 ? 'bg-teal-400' : 'bg-gray-600'
                    }`}
                  ></div>
                ))}
              </div>
            </div>

            {/* Today's Workout Card */}
            <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
              <div className="relative z-10">
                
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold mb-1">
                      {todayWorkout?.rest_day ? 'Rest Day' : `Today's ${todayWorkout?.type || 'Workout'}`}
                    </h3>
                    <p className="text-sm text-gray-400">
                      {todayWorkout?.day_name || 'No workout'} - Week {workout?.week_number || 1}
                    </p>
                  </div>
                  <button 
                    onClick={() => navigate('/workouts')}
                    className="p-2 bg-white bg-opacity-10 rounded-lg hover:bg-opacity-20 transition-all"
                  >
                    <span className="text-xl">📋</span>
                  </button>
                </div>

                
                {todayExercises.length > 0 ? (
                  <>
                    <div className="bg-white bg-opacity-10 rounded-xl p-4 mb-3 backdrop-blur-sm min-h-[120px]">
                      <div className="flex items-start gap-3">
                        <div className="text-3xl">💪</div>
                        <div className="flex-1">
                          <div className="text-base font-bold mb-2">
                            {todayExercises[currentExerciseIndex].name}
                          </div>
                          <div className="grid grid-cols-3 gap-2 mb-2">
                            <div className="bg-white bg-opacity-10 rounded-lg p-2 text-center">
                              <div className="text-xs text-gray-400">Sets</div>
                              <div className="text-lg font-bold">{todayExercises[currentExerciseIndex].sets}</div>
                            </div>
                            <div className="bg-white bg-opacity-10 rounded-lg p-2 text-center">
                              <div className="text-xs text-gray-400">Reps</div>
                              <div className="text-lg font-bold">{todayExercises[currentExerciseIndex].reps}</div>
                            </div>
                            <div className="bg-white bg-opacity-10 rounded-lg p-2 text-center">
                              <div className="text-xs text-gray-400">Rest</div>
                              <div className="text-lg font-bold">{todayExercises[currentExerciseIndex].rest_seconds}s</div>
                            </div>
                          </div>
                          <div className="text-xs text-gray-300 line-clamp-2">
                            {todayExercises[currentExerciseIndex].guidance}
                          </div>
                        </div>
                      </div>
                    </div>

                    
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => setCurrentExerciseIndex(prev => 
                          prev > 0 ? prev - 1 : todayExercises.length - 1
                        )}
                        disabled={todayExercises.length <= 1}
                        className="p-2 bg-white bg-opacity-10 rounded-lg hover:bg-opacity-20 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <span className="text-xl">←</span>
                      </button>
                      
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-400">
                          Exercise {currentExerciseIndex + 1} of {todayExercises.length}
                        </span>
                        <div className="flex gap-1">
                          {todayExercises.map((_, idx) => (
                            <div
                              key={idx}
                              className={`w-2 h-2 rounded-full transition-all ${
                                idx === currentExerciseIndex ? 'bg-teal-400 w-4' : 'bg-gray-600'
                              }`}
                            ></div>
                          ))}
                        </div>
                      </div>
                      
                      <button
                        onClick={() => setCurrentExerciseIndex(prev => 
                          prev < todayExercises.length - 1 ? prev + 1 : 0
                        )}
                        disabled={todayExercises.length <= 1}
                        className="p-2 bg-white bg-opacity-10 rounded-lg hover:bg-opacity-20 transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                      >
                        <span className="text-xl">→</span>
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="bg-white bg-opacity-10 rounded-xl p-6 text-center backdrop-blur-sm">
                    <div className="text-5xl mb-3">🛌</div>
                    <div className="text-lg font-semibold mb-1">Rest & Recovery</div>
                    <div className="text-sm text-gray-400">
                      {todayWorkout?.rest_day 
                        ? 'Take it easy today - your body needs rest!' 
                        : 'No workout scheduled for today'}
                    </div>
                  </div>
                )}
              </div>

              
              <div className="absolute right-0 top-0 w-48 h-full opacity-10 flex items-center justify-center">
                <div className="text-9xl">💪</div>
              </div>
            </div>

            
            <div className="bg-white border-2 border-gray-200 rounded-3xl p-6 shadow-xl hover:shadow-2xl transition-shadow duration-300">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                  <span className="text-2xl">📊</span>
                  Weekly Activity
                </h3>
                <div className="flex gap-2">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-teal-500"></div>
                    <span className="text-xs text-gray-600">Calories</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                    <span className="text-xs text-gray-600">Sleep</span>
                  </div>
                </div>
              </div>
              
              <div className="h-56 bg-gradient-to-br from-gray-50 to-blue-50 rounded-xl p-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={performanceData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" vertical={false} />
                    <XAxis 
                      dataKey="day" 
                      stroke="#64748b"
                      tick={{ fontSize: 12, fill: '#475569' }}
                      axisLine={{ stroke: '#cbd5e1' }}
                    />
                    <YAxis 
                      stroke="#64748b"
                      tick={{ fontSize: 12, fill: '#475569' }}
                      axisLine={{ stroke: '#cbd5e1' }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.98)',
                        borderRadius: '12px',
                        border: '2px solid #e2e8f0',
                        boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
                        padding: '12px'
                      }}
                      labelStyle={{ 
                        color: '#1e293b', 
                        fontWeight: 'bold',
                        marginBottom: '8px'
                      }}
                      itemStyle={{ 
                        color: '#475569',
                        padding: '4px 0'
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="calories"
                      stroke="#14b8a6"
                      strokeWidth={3}
                      dot={{ fill: '#14b8a6', r: 5, strokeWidth: 2, stroke: '#fff' }}
                      activeDot={{ r: 7, strokeWidth: 2 }}
                      name="Calories"
                    />
                    <Line
                      type="monotone"
                      dataKey="sleep"
                      stroke="#f97316"
                      strokeWidth={3}
                      dot={{ fill: '#f97316', r: 5, strokeWidth: 2, stroke: '#fff' }}
                      activeDot={{ r: 7, strokeWidth: 2 }}
                      name="Sleep (hrs)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="bg-gradient-to-br from-teal-50 to-cyan-50 border border-teal-200 rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full bg-teal-500"></div>
                    <span className="text-xs text-gray-600 font-semibold">Average Calories</span>
                  </div>
                  <div className="text-2xl font-bold text-teal-700">{avgCalories}</div>
                  <div className="text-xs text-gray-500">kcal per day</div>
                </div>
                <div className="bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200 rounded-xl p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-2 h-2 rounded-full bg-orange-500"></div>
                    <span className="text-xs text-gray-600 font-semibold">Average Sleep</span>
                  </div>
                  <div className="text-2xl font-bold text-orange-700">{avgSleep}</div>
                  <div className="text-xs text-gray-500">hours per night</div>
                </div>
              </div>
            </div>

            
            <div className="grid grid-cols-2 gap-6">
              
              <div className="bg-white rounded-3xl p-6 shadow-xl">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">This Week's Focus</h3>
                <p className="text-sm text-gray-500 mb-4">{workout?.week_summary || 'Track your workout progress'}</p>
                
                <div className="space-y-3">
                  {workout?.workouts?.slice(0, 3).filter(w => !w.rest_day).map((day, idx) => (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-teal-400 to-teal-600 rounded-xl flex items-center justify-center">
                          <span className="text-xl">💪</span>
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">{day.day_name}</div>
                          <div className="text-xs text-gray-500">{day.type}</div>
                        </div>
                      </div>
                      <div className="text-sm text-gray-600">{day.exercises?.length || 0} exercises</div>
                    </div>
                  ))}
                </div>
              </div>

              
              <div className="bg-white border-2 border-gray-200 rounded-3xl p-6 shadow-xl hover:shadow-2xl transition-shadow duration-300">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <span className="text-2xl">✅</span>
                    Weekly Adherence
                  </h3>
                  <button
                    onClick={() => navigate('/progress')}
                    className="text-xs text-violet-600 hover:text-violet-700 font-semibold flex items-center gap-1"
                  >
                    View All
                    <span>→</span>
                  </button>
                </div>
                
                {adherenceData.length > 0 ? (
                  <>
                    <div className="h-48 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={adherenceData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#cbd5e1" vertical={false} />
                          <XAxis 
                            dataKey="week" 
                            stroke="#64748b"
                            tick={{ fontSize: 12, fill: '#475569' }}
                            axisLine={{ stroke: '#cbd5e1' }}
                          />
                          <YAxis 
                            stroke="#64748b"
                            tick={{ fontSize: 12, fill: '#475569' }}
                            axisLine={{ stroke: '#cbd5e1' }}
                            domain={[0, 100]}
                          />
                          <Tooltip
                            contentStyle={{
                              backgroundColor: 'rgba(255, 255, 255, 0.98)',
                              borderRadius: '12px',
                              border: '2px solid #e2e8f0',
                              boxShadow: '0 10px 25px rgba(0, 0, 0, 0.15)',
                              padding: '12px'
                            }}
                            labelStyle={{ 
                              color: '#1e293b', 
                              fontWeight: 'bold',
                              marginBottom: '8px'
                            }}
                          />
                          <Legend 
                            wrapperStyle={{ fontSize: '12px' }}
                            iconType="circle"
                          />
                          <Bar 
                            dataKey="workout" 
                            fill="#06b6d4" 
                            name="Workout %" 
                            radius={[8, 8, 0, 0]}
                          />
                          <Bar 
                            dataKey="diet" 
                            fill="#10b981" 
                            name="Diet %" 
                            radius={[8, 8, 0, 0]}
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 mt-4">
                      <div className="bg-gradient-to-br from-cyan-50 to-blue-50 border border-cyan-200 rounded-xl p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-2 h-2 rounded-full bg-cyan-500"></div>
                          <span className="text-xs text-gray-600 font-semibold">Workout</span>
                        </div>
                        <div className="text-2xl font-bold text-cyan-700">
                          {adherenceData.length > 0 ? Math.round(adherenceData.reduce((sum, d) => sum + d.workout, 0) / adherenceData.length) : 0}%
                        </div>
                        <div className="text-xs text-gray-500">avg adherence</div>
                      </div>
                      <div className="bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200 rounded-xl p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                          <span className="text-xs text-gray-600 font-semibold">Diet</span>
                        </div>
                        <div className="text-2xl font-bold text-emerald-700">
                          {adherenceData.length > 0 ? Math.round(adherenceData.reduce((sum, d) => sum + d.diet, 0) / adherenceData.length) : 0}%
                        </div>
                        <div className="text-xs text-gray-500">avg adherence</div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="text-center py-8 bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl">
                    <p className="text-4xl mb-2">✅</p>
                    <p className="text-gray-700 text-sm mb-3">No adherence data yet</p>
                    <button
                      onClick={() => navigate('/daily-log')}
                      className="text-xs px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-500 text-white font-semibold rounded-lg hover:shadow-lg transition-all"
                    >
                      Start Logging
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Section - 5 Cards (Goal-Focused Features) */}
          <div className="space-y-6">
            {/* Active Goal Card */}
            <div className="bg-gradient-to-br from-rose-500 to-pink-600 rounded-3xl p-6 text-white shadow-xl">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold">Active Goal</h3>
                  <p className="text-xs text-white opacity-75 mt-1">{goalProgress?.goal_timeframe || profile?.goal_timeframe || '12 weeks'}</p>
                </div>
                <button 
                  onClick={() => navigate('/profile')}
                  className="p-2 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 transition-all"
                >
                  <span className="text-xl">⚙️</span>
                </button>
              </div>

              {/* Goal Type with Icon */}
              <div className="mb-4">
                <div className="text-5xl mb-2">
                  {goalProgress?.goal_type === 'Weight Loss' ? '⬇️' : 
                   goalProgress?.goal_type === 'Muscle Gain' ? '💪' : 
                   goalProgress?.goal_type === 'Recomposition' ? '🔄' : '⚖️'}
                </div>
                <div className="text-2xl font-bold">{goalProgress?.goal_type || profile?.goal}</div>
              </div>

              {/* Weight Progress */}
              <div className="bg-white bg-opacity-20 rounded-xl p-4 mb-4 backdrop-blur-sm">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm opacity-90">Weight Progress</span>
                  <span className="font-bold">{goalProgress?.current_weight || profile?.weight_kg} → {goalProgress?.target_weight || profile?.target_weight_kg} kg</span>
                </div>
                
                {/* Progress Bar */}
                <div className="w-full bg-white bg-opacity-20 rounded-full h-3 mb-2">
                  <div 
                    className="bg-white rounded-full h-3 transition-all duration-500"
                    style={{
                      width: `${goalProgress?.progress_percentage || 0}%`
                    }}
                  ></div>
                </div>
                
                <div className="flex justify-between items-center text-xs opacity-90">
                  <span>
                    {Math.abs(goalProgress?.remaining_distance || 0).toFixed(1)} kg to go
                  </span>
                  <span className="font-semibold">
                    {goalProgress?.progress_percentage || 0}% Complete
                  </span>
                </div>
              </div>

              {/* Target Timeline & Stats */}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-white bg-opacity-10 rounded-lg p-2 text-center">
                  <div className="text-xs opacity-75">Target Time</div>
                  <div className="font-bold">{goalProgress?.goal_timeframe || profile?.goal_timeframe || '12 weeks'}</div>
                </div>
                <div className="bg-white bg-opacity-10 rounded-lg p-2 text-center">
                  <div className="text-xs opacity-75">Current Weight</div>
                  <div className="font-bold">{goalProgress?.current_weight || profile?.weight_kg} kg</div>
                </div>
              </div>

              {/* Weight Change Indicator */}
              {goalProgress?.total_weight_change !== undefined && (
                <div className="mt-3 pt-3 border-t border-white border-opacity-30 text-xs opacity-90">
                  <div className="flex justify-between items-center">
                    <span>Total Change:</span>
                    <span className={`font-bold ${goalProgress?.total_weight_change !== 0 ? 'text-yellow-200' : 'text-white'}`}>
                      {goalProgress?.total_weight_change > 0 ? '+' : ''}{goalProgress?.total_weight_change} kg
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Energy Status Card */}
            <div className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-3xl p-6 text-white shadow-xl">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold">Energy Status</h3>
                  <p className="text-xs text-white opacity-75 mt-1">{energyStatus?.trend || 'No data'}</p>
                </div>
                <button 
                  onClick={() => navigate('/daily-log')}
                  className="p-2 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 transition-all"
                  title="Update daily energy log"
                >
                  <span className="text-xl">📝</span>
                </button>
              </div>

              <div className="flex items-center justify-center mb-4">
                <div className="text-6xl">{energyStatus?.status_icon || '😴'}</div>
              </div>

              <div className="bg-white bg-opacity-20 rounded-xl p-4 mb-4 backdrop-blur-sm">
                <div className="text-center mb-2">
                  <div className="text-2xl font-bold">{energyStatus?.current_energy || 'N/A'}</div>
                  <div className="text-xs opacity-90 mt-1">
                    {energyStatus?.current_date 
                      ? new Date(energyStatus.current_date).toLocaleDateString() 
                      : 'No recent log'}
                  </div>
                  {energyStatus?.current_mood && (
                    <div className="text-xs opacity-75 mt-1">Mood: {energyStatus.current_mood}</div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="bg-white bg-opacity-10 rounded-lg p-2 text-center">
                  <div className="text-xs opacity-75">Week Avg</div>
                  <div className="font-bold">{(energyStatus?.weekly_average || 0).toFixed(1)}/4</div>
                  <div className="text-xs opacity-75">energy</div>
                </div>
                <div className="bg-white bg-opacity-10 rounded-lg p-2 text-center">
                  <div className="text-xs opacity-75">Sleep</div>
                  <div className="font-bold">{(energyStatus?.avg_sleep || 0).toFixed(1)}h</div>
                  <div className="text-xs opacity-75">per night</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-sm mt-3">
                <div className="bg-white bg-opacity-10 rounded-lg p-2 text-center">
                  <div className="text-xs opacity-75">Logs</div>
                  <div className="font-bold">{energyStatus?.logs_this_week || 0}/7</div>
                </div>
                <div className="bg-white bg-opacity-10 rounded-lg p-2 text-center">
                  <div className="text-xs opacity-75">Mood</div>
                  <div className="font-bold">{(energyStatus?.avg_mood || 0).toFixed(1)}/5</div>
                </div>
              </div>

              {energyStatus?.recommendation && (
                <div className="mt-3 pt-3 border-t border-white border-opacity-30 text-xs opacity-90">
                  <p className="text-center italic">{energyStatus.recommendation}</p>
                </div>
              )}
            </div>

            {/* Goal Forecast Card */}
            <div className="bg-gradient-to-br from-violet-500 to-purple-600 rounded-3xl p-6 text-white shadow-xl">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold">Goal Forecast</h3>
                  <p className="text-xs text-white opacity-75 mt-1">{goalForecast?.confidence || 'Calculating...'}</p>
                </div>
                <button 
                  onClick={() => navigate('/progress')}
                  className="p-2 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 transition-all"
                >
                  <span className="text-xl">📊</span>
                </button>
              </div>

              <div className="mb-4">
                <div className="text-5xl mb-2">
                  {goalForecast?.estimated_weeks ? (
                    goalForecast.estimated_weeks <= 4 ? '🎉' : 
                    goalForecast.estimated_weeks <= 12 ? '💪' : '⏳'
                  ) : '📅'}
                </div>
              </div>

              <div className="bg-white bg-opacity-20 rounded-xl p-4 mb-4 backdrop-blur-sm">
                <div className="text-center mb-2">
                  {goalForecast?.estimated_completion ? (
                    <>
                      <div className="text-sm opacity-90">Estimated Completion</div>
                      <div className="text-2xl font-bold">{new Date(goalForecast.estimated_completion).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: '2-digit' })}</div>
                      <div className="text-xs opacity-75 mt-1">~{goalForecast?.estimated_weeks} weeks</div>
                    </>
                  ) : (
                    <div className="text-xs opacity-90">{goalForecast?.message || 'Log more weights to forecast'}</div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-white bg-opacity-10 rounded-lg p-2 text-center">
                  <div className="opacity-75">Weekly Change</div>
                  <div className="font-bold mt-1">{goalForecast?.weekly_change ? (goalForecast.weekly_change > 0 ? '+' : '') + goalForecast.weekly_change : 'N/A'} kg</div>
                </div>
                <div className="bg-white bg-opacity-10 rounded-lg p-2 text-center">
                  <div className="opacity-75">Remaining</div>
                  <div className="font-bold mt-1">{Math.abs(goalForecast?.remaining_distance || 0).toFixed(1)} kg</div>
                </div>
              </div>

              {goalForecast?.message && (
                <div className="mt-3 pt-3 border-t border-white border-opacity-30 text-xs opacity-90">
                  <p className="text-center italic">{goalForecast.message}</p>
                </div>
              )}
            </div>

            {/* Measurement Trends Card */}
            <div className="bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl p-6 text-white shadow-xl">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold">Measurements</h3>
                  <p className="text-xs text-white opacity-75 mt-1">{measurementTrends?.overall_assessment || 'Tracking...'}</p>
                </div>
                <button 
                  onClick={() => navigate('/profile')}
                  className="p-2 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 transition-all"
                  title="Update measurements"
                >
                  <span className="text-xl">📏</span>
                </button>
              </div>

              {measurementTrends?.has_data ? (
                <>
                  <div className="mb-4">
                    <div className="text-5xl mb-2">
                      {measurementTrends.overall_assessment === 'Excellent' ? '🎯' :
                       measurementTrends.overall_assessment === 'Good Progress' ? '👍' : 
                       measurementTrends.overall_assessment === 'On Track' ? '✅' : '⚙️'}
                    </div>
                  </div>

                  <div className="bg-white bg-opacity-20 rounded-xl p-4 mb-4 backdrop-blur-sm">
                    <div className="space-y-2 text-sm">
                      {measurementTrends.measurements?.waist && (
                        <div className="flex justify-between items-center">
                          <span>📍 Waist:</span>
                          <div className="text-right">
                            <div className="font-bold">{measurementTrends.measurements.waist.initial} → {measurementTrends.measurements.waist.current} cm</div>
                            <div className={`text-xs ${measurementTrends.measurements.waist.change < 0 ? 'text-yellow-200' : measurementTrends.measurements.waist.change > 0 ? 'text-orange-200' : 'text-green-200'}`}>
                              {measurementTrends.measurements.waist.change > 0 ? '+' : ''}{measurementTrends.measurements.waist.change} cm
                            </div>
                          </div>
                        </div>
                      )}
                      {measurementTrends.measurements?.chest && (
                        <div className="flex justify-between items-center">
                          <span>💪 Chest:</span>
                          <div className="text-right">
                            <div className="font-bold">{measurementTrends.measurements.chest.initial} → {measurementTrends.measurements.chest.current} cm</div>
                            <div className={`text-xs ${measurementTrends.measurements.chest.change > 0 ? 'text-green-200' : measurementTrends.measurements.chest.change < 0 ? 'text-orange-200' : 'text-gray-200'}`}>
                              {measurementTrends.measurements.chest.change > 0 ? '+' : ''}{measurementTrends.measurements.chest.change} cm
                            </div>
                          </div>
                        </div>
                      )}
                      {measurementTrends.measurements?.hips && (
                        <div className="flex justify-between items-center">
                          <span>⭕ Hips:</span>
                          <div className="text-right">
                            <div className="font-bold">{measurementTrends.measurements.hips.initial} → {measurementTrends.measurements.hips.current} cm</div>
                            <div className={`text-xs ${measurementTrends.measurements.hips.change < 0 ? 'text-yellow-200' : measurementTrends.measurements.hips.change > 0 ? 'text-orange-200' : 'text-green-200'}`}>
                              {measurementTrends.measurements.hips.change > 0 ? '+' : ''}{measurementTrends.measurements.hips.change} cm
                            </div>
                          </div>
                        </div>
                      )}
                      {measurementTrends.measurements?.arms && (
                        <div className="flex justify-between items-center">
                          <span>💪 Arms:</span>
                          <div className="text-right">
                            <div className="font-bold">{measurementTrends.measurements.arms.initial} → {measurementTrends.measurements.arms.current} cm</div>
                            <div className={`text-xs ${measurementTrends.measurements.arms.change > 0 ? 'text-green-200' : measurementTrends.measurements.arms.change < 0 ? 'text-orange-200' : 'text-gray-200'}`}>
                              {measurementTrends.measurements.arms.change > 0 ? '+' : ''}{measurementTrends.measurements.arms.change} cm
                            </div>
                          </div>
                        </div>
                      )}
                      {measurementTrends.measurements?.thighs && (
                        <div className="flex justify-between items-center">
                          <span>🦵 Thighs:</span>
                          <div className="text-right">
                            <div className="font-bold">{measurementTrends.measurements.thighs.initial} → {measurementTrends.measurements.thighs.current} cm</div>
                            <div className={`text-xs ${measurementTrends.measurements.thighs.change > 0 ? 'text-green-200' : measurementTrends.measurements.thighs.change < 0 ? 'text-orange-200' : 'text-gray-200'}`}>
                              {measurementTrends.measurements.thighs.change > 0 ? '+' : ''}{measurementTrends.measurements.thighs.change} cm
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="bg-white bg-opacity-10 rounded-lg p-2 text-center">
                      <div className="opacity-75">Entries</div>
                      <div className="font-bold mt-1">{measurementTrends.total_entries}</div>
                    </div>
                    <div className="bg-white bg-opacity-10 rounded-lg p-2 text-center">
                      <div className="opacity-75">Days Tracked</div>
                      <div className="font-bold mt-1">{measurementTrends.days_tracked || 0}d</div>
                    </div>
                  </div>

                  {measurementTrends.recommendations?.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-white border-opacity-30 text-xs opacity-90">
                      <p className="text-center italic">💡 {measurementTrends.recommendations[0]}</p>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-6">
                  <div className="text-4xl mb-2">📏</div>
                  <p className="text-sm opacity-90">{measurementTrends?.message || 'Add measurements to track trends'}</p>
                  <button
                    onClick={() => navigate('/profile')}
                    className="mt-3 px-4 py-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg text-xs font-semibold transition-all"
                  >
                    Update Measurements
                  </button>
                </div>
              )}
            </div>

            {/* AI Coach Insights - REAL DATA FROM DROPOFF RISK */}
            <div className="bg-gradient-to-br from-teal-500 to-teal-600 rounded-3xl p-6 text-white shadow-xl">
              <div className="flex items-start justify-between mb-4">
                <h3 className="text-lg font-semibold">AI Coach Insights</h3>
                <button className="p-2 bg-white bg-opacity-20 rounded-lg hover:bg-opacity-30 transition-all">
                  <span className="text-xl">💡</span>
                </button>
              </div>
              
              <p className="text-sm mb-4 leading-relaxed">
                {dropoffRisk?.positive_notes?.[0] || dropoffRisk?.recommendations?.[0] || 'Keep up the great work! Your consistency is improving.'}
              </p>

              {dropoffRisk?.risk_score > 0 && (
                <>
                  <div className="w-full bg-white bg-opacity-20 rounded-full h-2 mb-2">
                    <div 
                      className="bg-white rounded-full h-2 transition-all duration-500"
                      style={{width: `${100 - dropoffRisk.risk_score}%`}}
                    ></div>
                  </div>
                  <div className="text-xs text-white opacity-75 mb-4">
                    Progress Score: {100 - dropoffRisk.risk_score}%
                  </div>
                </>
              )}

              <button 
                onClick={() => navigate('/assistant')}
                className="mt-4 w-full bg-white bg-opacity-20 hover:bg-opacity-30 rounded-xl py-3 font-semibold transition-all"
              >
                Talk to AI Coach →
              </button>
            </div>

            
            <div className="bg-white rounded-3xl p-6 shadow-xl">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
              
              <div className="space-y-3">
                {recentLogs.slice(-3).reverse().map((log, idx) => {
                  const logDate = new Date(log.date);
                  const dateStr = logDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                  
                  return (
                    <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                          log.workout_completed && log.diet_followed 
                            ? 'bg-green-100' 
                            : log.workout_completed || log.diet_followed
                            ? 'bg-yellow-100'
                            : 'bg-gray-100'
                        }`}>
                          <span className="text-xl">
                            {log.workout_completed && log.diet_followed ? '✅' : 
                             log.workout_completed ? '💪' : 
                             log.diet_followed ? '🥗' : '📝'}
                          </span>
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">{dateStr}</div>
                          <div className="text-xs text-gray-500">
                            {log.workout_completed ? 'Workout ✓ ' : ''}
                            {log.diet_followed ? 'Diet ✓' : ''}
                            {!log.workout_completed && !log.diet_followed ? 'No activity' : ''}
                          </div>
                        </div>
                      </div>
                      {log.weight_kg && (
                        <div className="text-sm text-gray-600">{log.weight_kg} kg</div>
                      )}
                    </div>
                  );
                })}
              </div>
              
              <button
                onClick={() => navigate('/daily-log')}
                className="mt-4 w-full bg-gradient-to-r from-violet-500 to-purple-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all"
              >
                Log Today's Activity
              </button>
            </div>

            {/* Measurement Reminder Countdown - STANDALONE CARD */}
            {measurementReminder && (
              <div className={`rounded-3xl p-6 shadow-xl ${
                measurementReminder.reminder_due 
                  ? 'bg-gradient-to-br from-red-50 to-orange-50 border-2 border-red-300' 
                  : 'bg-gradient-to-br from-blue-50 to-indigo-50 border-2 border-blue-300'
              }`}>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-3xl">{measurementReminder.reminder_due ? '⏰' : '📏'}</span>
                      <h3 className="text-xl font-bold text-gray-900">
                        {measurementReminder.reminder_due ? 'Measurement Update Due!' : 'Next Measurement Update'}
                      </h3>
                    </div>
                    <p className="text-gray-600 text-sm mb-3">
                      {measurementReminder.reminder_due 
                        ? 'It\'s been 4 weeks since your last measurement. Time to track your progress!' 
                        : `Your next measurement update is in ${measurementReminder.days_until_next} days`
                      }
                    </p>
                    {measurementReminder.next_due_date && (
                      <p className="text-xs text-gray-500">
                        Next update: {new Date(measurementReminder.next_due_date).toLocaleDateString('en-US', { 
                          weekday: 'long', 
                          month: 'long', 
                          day: 'numeric', 
                          year: 'numeric' 
                        })}
                      </p>
                    )}
                  </div>
                  <div className="text-center">
                    <div className={`text-6xl font-bold mb-2 ${
                      measurementReminder.reminder_due ? 'text-red-600 animate-pulse' : 'text-blue-600'
                    }`}>
                      {measurementReminder.days_until_next}
                    </div>
                    <div className="text-sm font-semibold text-gray-600">
                      {measurementReminder.days_until_next === 1 ? 'day' : 'days'}
                    </div>
                  </div>
                </div>
                {measurementReminder.reminder_due && (
                  <button
                    onClick={() => setShowMeasurementModal(true)}
                    className="mt-4 w-full bg-gradient-to-r from-red-500 to-orange-600 text-white py-3 rounded-xl font-semibold hover:shadow-lg transition-all flex items-center justify-center gap-2"
                  >
                    <span className="text-xl">📏</span>
                    Update Measurements Now
                    <span className="text-xl">→</span>
                  </button>
                )}
              </div>
            )}

            {/* Body Measurements Card */}
            {(latestMeasurements || profile?.initial_measurements) && (
              <div className="bg-white rounded-3xl p-6 shadow-xl">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                    <span className="text-2xl">📏</span>
                    Body Measurements
                  </h3>
                  <button
                    onClick={() => setShowMeasurementModal(true)}
                    className="text-xs text-violet-600 hover:text-violet-700 font-semibold flex items-center gap-1"
                  >
                    Update
                    <span>→</span>
                  </button>
                </div>
                
                <div className="flex items-center justify-between mb-4">
                  <div className="text-xs text-gray-500">
                    Last updated: {latestMeasurements?.date 
                      ? new Date(latestMeasurements.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                      : profile?.initial_measurements?.measured_at 
                        ? new Date(profile.initial_measurements.measured_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                        : 'Never'
                    }
                  </div>
                  
                  {/* Countdown Timer */}
                  {measurementReminder && (
                    <div className={`text-xs font-semibold px-3 py-1 rounded-full ${
                      measurementReminder.reminder_due 
                        ? 'bg-red-100 text-red-700 animate-pulse' 
                        : 'bg-blue-100 text-blue-700'
                    }`}>
                      {measurementReminder.reminder_due 
                        ? '⏰ Update Due!' 
                        : `⏳ ${measurementReminder.days_until_next} days until next update`
                      }
                    </div>
                  )}
                </div>
                
                {/* Prominent Update Button when due */}
                {measurementReminder && measurementReminder.reminder_due && (
                  <div className="mb-4">
                    <button
                      onClick={() => setShowMeasurementModal(true)}
                      className="w-full bg-gradient-to-r from-violet-600 to-purple-600 text-white py-3 rounded-xl font-semibold hover:from-violet-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                    >
                      <span className="text-xl">📏</span>
                      Update Measurements Now
                      <span className="text-xl">→</span>
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                  {/* Use latestMeasurements if available, otherwise use initial_measurements */}
                  {(() => {
                    const measurements = latestMeasurements?.measurements || profile?.initial_measurements || {};
                    return (
                      <>
                        {measurements.waist_cm && (
                          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-3">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-lg">⭕</span>
                              <span className="text-xs text-gray-600 font-semibold">Waist</span>
                            </div>
                            <div className="text-2xl font-bold text-blue-700">{measurements.waist_cm}</div>
                            <div className="text-xs text-gray-500">cm</div>
                          </div>
                        )}
                        
                        {measurements.chest_cm && (
                          <div className="bg-gradient-to-br from-purple-50 to-violet-50 border border-purple-200 rounded-xl p-3">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-lg">💪</span>
                              <span className="text-xs text-gray-600 font-semibold">Chest</span>
                            </div>
                            <div className="text-2xl font-bold text-purple-700">{measurements.chest_cm}</div>
                            <div className="text-xs text-gray-500">cm</div>
                          </div>
                        )}
                        
                        {measurements.hips_cm && (
                          <div className="bg-gradient-to-br from-pink-50 to-rose-50 border border-pink-200 rounded-xl p-3">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-lg">🔄</span>
                              <span className="text-xs text-gray-600 font-semibold">Hips</span>
                            </div>
                            <div className="text-2xl font-bold text-pink-700">{measurements.hips_cm}</div>
                            <div className="text-xs text-gray-500">cm</div>
                          </div>
                        )}
                        
                        {measurements.left_arm_cm && (
                          <div className="bg-gradient-to-br from-teal-50 to-cyan-50 border border-teal-200 rounded-xl p-3">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-lg">💪</span>
                              <span className="text-xs text-gray-600 font-semibold">Left Arm</span>
                            </div>
                            <div className="text-2xl font-bold text-teal-700">{measurements.left_arm_cm}</div>
                            <div className="text-xs text-gray-500">cm</div>
                          </div>
                        )}
                        
                        {measurements.right_arm_cm && (
                          <div className="bg-gradient-to-br from-teal-50 to-cyan-50 border border-teal-200 rounded-xl p-3">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-lg">💪</span>
                              <span className="text-xs text-gray-600 font-semibold">Right Arm</span>
                            </div>
                            <div className="text-2xl font-bold text-teal-700">{measurements.right_arm_cm}</div>
                            <div className="text-xs text-gray-500">cm</div>
                          </div>
                        )}
                        
                        {measurements.left_thigh_cm && (
                          <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-3">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-lg">🦵</span>
                              <span className="text-xs text-gray-600 font-semibold">Left Thigh</span>
                            </div>
                            <div className="text-2xl font-bold text-amber-700">{measurements.left_thigh_cm}</div>
                            <div className="text-xs text-gray-500">cm</div>
                          </div>
                        )}
                        
                        {measurements.right_thigh_cm && (
                          <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-xl p-3">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-lg">🦵</span>
                              <span className="text-xs text-gray-600 font-semibold">Right Thigh</span>
                            </div>
                            <div className="text-2xl font-bold text-amber-700">{measurements.right_thigh_cm}</div>
                            <div className="text-xs text-gray-500">cm</div>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </div>

                {latestMeasurements?.notes && (
                  <div className="mt-4 p-3 bg-gray-50 rounded-xl">
                    <div className="text-xs text-gray-600 font-semibold mb-1">Notes</div>
                    <div className="text-sm text-gray-700">{latestMeasurements.notes}</div>
                  </div>
                )}
              </div>
            )}

            {/* Quick Stats */}
            <div className="bg-white rounded-3xl p-6 shadow-xl">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">This Week</h3>
              
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center">
                      <span className="text-xl">🎯</span>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Habit Score</div>
                      <div className="text-lg font-bold text-gray-900">{habitScore?.habit_score || 0}/100</div>
                    </div>
                  </div>
                  <div className="text-green-600 text-sm font-semibold">+5%</div>
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                      <span className="text-xl">💪</span>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Workouts</div>
                      <div className="text-lg font-bold text-gray-900">{weeklyWorkouts}/7</div>
                    </div>
                  </div>
                  <div className="text-green-600 text-sm font-semibold">On track</div>
                </div>

                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                      <span className="text-xl">🔥</span>
                    </div>
                    <div>
                      <div className="text-sm text-gray-600">Streak</div>
                      <div className="text-lg font-bold text-gray-900">{habitScore?.streak_count || 0} weeks</div>
                    </div>
                  </div>
                  <div className="text-green-600 text-sm font-semibold">Amazing!</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Measurement Modal */}
      <MeasurementModal
        isOpen={showMeasurementModal}
        onClose={() => setShowMeasurementModal(false)}
        reminderData={measurementReminder}
        onMeasurementAdded={fetchDashboardData}
      />
    </div>
  );
};

export default DashboardPage;
