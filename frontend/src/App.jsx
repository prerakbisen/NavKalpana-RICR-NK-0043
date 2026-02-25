import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import ChatbotWidget from './components/ChatbotWidget';
import LandingPage from './pages/LandingPage';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import Contact from './pages/Contact';
import About from './pages/About';
import Footer from './components/Footer';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProfileSetupPage from './pages/ProfileSetupPage';
import ProfilePage from './pages/ProfilePage';
import DashboardPage from './pages/DashboardPage';
import WorkoutPage from './pages/WorkoutPage';
import DietPage from './pages/DietPage';
import ProgressPage from './pages/ProgressPage';
import AssistantPage from './pages/AssistantPage';
import DailyLogPage from './pages/DailyLogPage';
import PremiumPage from './pages/PremiumPage';
import ReportsPage from './pages/ReportsPage';

const ProtectedRoute = ({ element }) => {
  const { token } = useAuth();
  return token ? element : <Navigate to="/login" />;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#ffffff',
              color: '#0f172a',
              padding: '16px 20px',
              borderRadius: '16px',
              boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1)',
              border: '2px solid rgba(255, 255, 255, 0.2)',
              fontWeight: '600',
              fontSize: '15px',
              maxWidth: '400px',
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: '#ffffff',
              },
              style: {
                background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                color: '#ffffff',
                border: '2px solid #10b981',
                boxShadow: '0 20px 50px rgba(16, 185, 129, 0.4), 0 0 30px rgba(16, 185, 129, 0.3)',
              },
            },
            error: {
              iconTheme: {
                primary: '#ef4444',
                secondary: '#ffffff',
              },
              style: {
                background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
                color: '#ffffff',
                border: '2px solid #ef4444',
                boxShadow: '0 20px 50px rgba(239, 68, 68, 0.4), 0 0 30px rgba(239, 68, 68, 0.3)',
              },
            },
            loading: {
              iconTheme: {
                primary: '#0ea5e9',
                secondary: '#ffffff',
              },
              style: {
                background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
                color: '#ffffff',
                border: '2px solid #0ea5e9',
                boxShadow: '0 20px 50px rgba(14, 165, 233, 0.4), 0 0 30px rgba(14, 165, 233, 0.3)',
              },
            },
          }}
        />
        <ChatbotWidget />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/about" element={<About />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/profile-setup" element={<ProtectedRoute element={<ProfileSetupPage />} />} />
          <Route path="/profile" element={<ProtectedRoute element={<ProfilePage />} />} />
          <Route path="/dashboard" element={<ProtectedRoute element={<DashboardPage />} />} />
          <Route path="/workouts" element={<ProtectedRoute element={<WorkoutPage />} />} />
          <Route path="/diet" element={<ProtectedRoute element={<DietPage />} />} />
          <Route path="/progress" element={<ProtectedRoute element={<ProgressPage />} />} />
          <Route path="/daily-log" element={<ProtectedRoute element={<DailyLogPage />} />} />
          <Route path="/assistant" element={<ProtectedRoute element={<AssistantPage />} />} />
          <Route path="/premium" element={<ProtectedRoute element={<PremiumPage />} />} />
          <Route path="/reports" element={<ProtectedRoute element={<ReportsPage />} />} />
        </Routes>
        <Footer />
      </AuthProvider>
    </Router>
  );
}

export default App;
