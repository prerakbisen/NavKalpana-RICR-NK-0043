import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { premiumCoachingService } from '../services/apiService';
import { OverviewTab } from '../components/premium/OverviewTab';
import { MacrosTab } from '../components/premium/MacrosTab';
import { MealsTab } from '../components/premium/MealsTab';
import { RecoveryTab } from '../components/premium/RecoveryTab';
import { SettingsTab } from '../components/premium/SettingsTab';

export const PremiumPage = () => {
  const navigate = useNavigate();
  const [premiumStatus, setPremiumStatus] = useState(null);
  const [preferences, setPreferences] = useState(null);
  const [macros, setMacros] = useState(null);
  const [recovery, setRecovery] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    fetchPremiumData();
  }, []);

  const fetchPremiumData = async () => {
    try {
      const [statusRes, prefsRes] = await Promise.all([
        premiumCoachingService.checkStatus(),
        premiumCoachingService.getPreferences().catch(() => ({ data: null }))
      ]);
      
      setPremiumStatus(statusRes.data);
      setPreferences(prefsRes.data);
      
      if (statusRes.data.is_premium) {
        const [macrosRes, recoveryRes] = await Promise.all([
          premiumCoachingService.calculatePremiumMacros().catch(() => ({ data: null })),
          premiumCoachingService.getRecoveryAnalysis().catch(() => ({ data: null }))
        ]);
        setMacros(macrosRes.data);
        setRecovery(recoveryRes.data);
      }
    } catch (error) {
      console.error('Error fetching premium data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleActivatePremium = async () => {
    try {
      await premiumCoachingService.activatePremium(1);
      await fetchPremiumData();
      alert('Premium activated successfully!');
    } catch (error) {
      console.error('Error activating premium:', error);
      alert('Failed to activate premium');
    }
  };

  const handleDeactivatePremium = async () => {
    if (!window.confirm('Are you sure you want to deactivate Premium? You will lose access to all premium features.')) {
      return;
    }
    
    try {
      await premiumCoachingService.deactivatePremium();
      await fetchPremiumData();
      alert('Premium deactivated successfully');
    } catch (error) {
      console.error('Error deactivating premium:', error);
      alert('Failed to deactivate premium');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-7xl mb-4 animate-bounce">💎</div>
          <p className="text-2xl font-bold text-gray-900">Loading Premium...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 via-purple-50 to-pink-50 p-8">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <button
          onClick={() => navigate('/dashboard')}
          className="mb-4 flex items-center gap-2 text-violet-600 hover:text-violet-700 font-semibold"
        >
          <span>←</span> Back to Dashboard
        </button>
        
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2 flex items-center gap-3">
              <span className="text-5xl">💎</span>
              Premium Coaching
            </h1>
            <p className="text-gray-600">
              {premiumStatus?.is_premium 
                ? 'Your advanced AI coaching features' 
                : 'Unlock advanced AI-powered personalization'}
            </p>
          </div>
          
          {!premiumStatus?.is_premium && (
            <button
              onClick={handleActivatePremium}
              className="px-8 py-4 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-2xl font-bold text-lg hover:shadow-2xl transition-all transform hover:scale-105"
            >
              Activate Premium
            </button>
          )}
          
          {premiumStatus?.is_premium && (
            <div className="bg-gradient-to-r from-violet-600 to-purple-600 text-white px-6 py-3 rounded-2xl">
              <div className="text-sm opacity-90">Premium Active</div>
              <div className="text-lg font-bold">{premiumStatus.subscription_tier}</div>
              {premiumStatus.premium_expires && (
                <div className="text-xs opacity-75 mt-1">
                  Expires: {new Date(premiumStatus.premium_expires).toLocaleDateString()}
                </div>
              )}
            </div>
          )}
        </div>
        
        {/* Deactivate Button for Premium Users */}
        {premiumStatus?.is_premium && (
          <div className="max-w-7xl mx-auto mb-4">
            <button
              onClick={handleDeactivatePremium}
              className="px-6 py-2 bg-red-100 text-red-600 rounded-xl font-semibold hover:bg-red-200 transition-all border-2 border-red-300"
            >
              Deactivate Premium
            </button>
          </div>
        )}
      </div>

      {!premiumStatus?.is_premium ? (
        <PremiumUpgradeSection onActivate={handleActivatePremium} />
      ) : (
        <>
          <PremiumDashboard 
            preferences={preferences}
            macros={macros}
            recovery={recovery}
            onRefresh={fetchPremiumData}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          />
        </>
      )}
    </div>
  );
};

// Premium Upgrade Section
const PremiumUpgradeSection = ({ onActivate }) => {
  return (
    <div className="max-w-7xl mx-auto">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-violet-600 to-purple-600 rounded-3xl p-12 text-white mb-8 shadow-2xl">
        <div className="max-w-3xl">
          <h2 className="text-4xl font-bold mb-4">Transform Your Fitness Journey</h2>
          <p className="text-xl mb-6 opacity-90">
            Get AI-powered personalization that adapts to your unique needs, preferences, and goals.
          </p>
          <button
            onClick={onActivate}
            className="px-8 py-4 bg-white text-violet-600 rounded-xl font-bold text-lg hover:shadow-xl transition-all"
          >
            Start Free Trial - 7 Days
          </button>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <FeatureCard
          icon="🎯"
          title="Advanced Macro Customization"
          description="7 macro strategies including carb cycling, keto, high protein, and custom targets"
          features={['Dynamic protein per kg', 'Carb cycling', 'Performance-based shifts']}
        />
        <FeatureCard
          icon="🔄"
          title="Meal Swap Engine"
          description="AI-powered meal replacements that match your preferences and dietary needs"
          features={['Instant swaps', 'Dietary restrictions', 'Budget-conscious']}
        />
        <FeatureCard
          icon="🧠"
          title="Behavioral Adaptation"
          description="AI learns your patterns and adapts your plan automatically"
          features={['Pattern detection', 'Auto-adjustments', 'Personalized timing']}
        />
        <FeatureCard
          icon="💬"
          title="Extended AI Coaching"
          description="Detailed, science-based coaching responses with your preferred tone"
          features={['Detailed explanations', 'Custom coaching tone', 'Action items']}
        />
        <FeatureCard
          icon="💪"
          title="Deep Recovery Insights"
          description="14-day recovery analysis with overtraining detection"
          features={['Recovery score', 'Fatigue tracking', 'Smart recommendations']}
        />
        <FeatureCard
          icon="📊"
          title="Advanced Analytics"
          description="Comprehensive insights into your progress and performance"
          features={['Trend analysis', 'Predictive modeling', 'Goal forecasting']}
        />
      </div>

      {/* Pricing */}
      <div className="bg-white rounded-3xl p-8 shadow-xl">
        <h3 className="text-2xl font-bold text-gray-900 mb-6 text-center">Choose Your Plan</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <PricingCard
            name="Free"
            price="$0"
            period="forever"
            features={[
              'Basic workout plans',
              'Standard diet plans',
              'Progress tracking',
              'Basic AI chat'
            ]}
            current={true}
          />
          <PricingCard
            name="Premium"
            price="$9.99"
            period="per month"
            features={[
              'All Free features',
              'Advanced macro customization',
              'Meal swap engine',
              'Extended AI coaching',
              'Recovery insights',
              'Behavioral adaptation'
            ]}
            highlighted={true}
            onSelect={onActivate}
          />
          <PricingCard
            name="Elite"
            price="$19.99"
            period="per month"
            features={[
              'All Premium features',
              'Priority support',
              'Custom meal plans',
              '1-on-1 coaching calls',
              'Advanced analytics'
            ]}
          />
        </div>
      </div>
    </div>
  );
};

// Premium Dashboard
const PremiumDashboard = ({ preferences, macros, recovery, onRefresh, activeTab, setActiveTab }) => {
  return (
    <div className="max-w-7xl mx-auto">
      {/* Tabs */}
      <div className="flex gap-2 mb-6 bg-white rounded-2xl p-2 shadow-lg">
        <TabButton active={activeTab === 'overview'} onClick={() => setActiveTab('overview')}>
          📊 Overview
        </TabButton>
        <TabButton active={activeTab === 'macros'} onClick={() => setActiveTab('macros')}>
          🎯 Macros
        </TabButton>
        <TabButton active={activeTab === 'meals'} onClick={() => setActiveTab('meals')}>
          🍽️ Meals
        </TabButton>
        <TabButton active={activeTab === 'recovery'} onClick={() => setActiveTab('recovery')}>
          💪 Recovery
        </TabButton>
        <TabButton active={activeTab === 'settings'} onClick={() => setActiveTab('settings')}>
          ⚙️ Settings
        </TabButton>
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && <OverviewTab macros={macros} recovery={recovery} preferences={preferences} />}
      {activeTab === 'macros' && <MacrosTab macros={macros} preferences={preferences} onRefresh={onRefresh} />}
      {activeTab === 'meals' && <MealsTab />}
      {activeTab === 'recovery' && <RecoveryTab recovery={recovery} onRefresh={onRefresh} />}
      {activeTab === 'settings' && <SettingsTab preferences={preferences} onRefresh={onRefresh} />}
    </div>
  );
};

// Tab Button Component
const TabButton = ({ active, onClick, children }) => (
  <button
    onClick={onClick}
    className={`flex-1 px-6 py-3 rounded-xl font-semibold transition-all ${
      active
        ? 'bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg'
        : 'text-gray-600 hover:bg-gray-100'
    }`}
  >
    {children}
  </button>
);

// Feature Card Component
const FeatureCard = ({ icon, title, description, features }) => (
  <div className="bg-white rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all">
    <div className="text-5xl mb-4">{icon}</div>
    <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
    <p className="text-gray-600 mb-4">{description}</p>
    <ul className="space-y-2">
      {features.map((feature, idx) => (
        <li key={idx} className="flex items-center gap-2 text-sm text-gray-700">
          <span className="text-green-500">✓</span>
          {feature}
        </li>
      ))}
    </ul>
  </div>
);

// Pricing Card Component
const PricingCard = ({ name, price, period, features, highlighted, current, onSelect }) => (
  <div className={`rounded-2xl p-6 ${
    highlighted 
      ? 'bg-gradient-to-br from-violet-600 to-purple-600 text-white shadow-2xl transform scale-105' 
      : 'bg-gray-50'
  }`}>
    <h4 className={`text-2xl font-bold mb-2 ${highlighted ? 'text-white' : 'text-gray-900'}`}>
      {name}
    </h4>
    <div className="mb-4">
      <span className={`text-4xl font-bold ${highlighted ? 'text-white' : 'text-gray-900'}`}>
        {price}
      </span>
      <span className={`text-sm ${highlighted ? 'text-white opacity-90' : 'text-gray-600'}`}>
        /{period}
      </span>
    </div>
    <ul className="space-y-3 mb-6">
      {features.map((feature, idx) => (
        <li key={idx} className={`flex items-center gap-2 text-sm ${
          highlighted ? 'text-white' : 'text-gray-700'
        }`}>
          <span className={highlighted ? 'text-white' : 'text-green-500'}>✓</span>
          {feature}
        </li>
      ))}
    </ul>
    {current ? (
      <div className="text-center py-3 bg-gray-200 rounded-xl font-semibold text-gray-700">
        Current Plan
      </div>
    ) : onSelect ? (
      <button
        onClick={onSelect}
        className={`w-full py-3 rounded-xl font-semibold transition-all ${
          highlighted
            ? 'bg-white text-violet-600 hover:shadow-xl'
            : 'bg-violet-600 text-white hover:bg-violet-700'
        }`}
      >
        Select Plan
      </button>
    ) : (
      <button className="w-full py-3 rounded-xl font-semibold bg-gray-300 text-gray-600 cursor-not-allowed">
        Coming Soon
      </button>
    )}
  </div>
);

export default PremiumPage;
