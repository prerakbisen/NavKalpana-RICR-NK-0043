import { useState, useEffect } from 'react';
import { profileService } from '../services/apiService';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export const ProfilePage = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    age: '',
    gender: '',
    weight_kg: '',
    height_cm: '',
    goal: '',
    goal_timeframe: '',
    target_weight_kg: '',
    experience_level: '',
    available_days_per_week: '',
    dietary_preferences: '',
    allergies: '',
    injuries_limitations: '',
    initial_measurements: {
      waist_cm: '',
      chest_cm: '',
      hips_cm: '',
      left_arm_cm: '',
      right_arm_cm: '',
      left_thigh_cm: '',
      right_thigh_cm: ''
    }
  });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await profileService.getProfile();
      setProfile(res.data);
      setFormData({
        age: res.data.age,
        gender: res.data.gender,
        weight_kg: res.data.weight_kg,
        height_cm: res.data.height_cm,
        goal: res.data.goal,
        goal_timeframe: res.data.goal_timeframe || '12 weeks',
        target_weight_kg: res.data.target_weight_kg,
        experience_level: res.data.experience_level,
        available_days_per_week: res.data.available_days_per_week,
        dietary_preferences: res.data.dietary_preferences || '',
        allergies: res.data.allergies || '',
        injuries_limitations: res.data.injuries_limitations || '',
        initial_measurements: res.data.initial_measurements ? {
          waist_cm: res.data.initial_measurements.waist_cm || '',
          chest_cm: res.data.initial_measurements.chest_cm || '',
          hips_cm: res.data.initial_measurements.hips_cm || '',
          left_arm_cm: res.data.initial_measurements.left_arm_cm || '',
          right_arm_cm: res.data.initial_measurements.right_arm_cm || '',
          left_thigh_cm: res.data.initial_measurements.left_thigh_cm || '',
          right_thigh_cm: res.data.initial_measurements.right_thigh_cm || ''
        } : {
          waist_cm: '',
          chest_cm: '',
          hips_cm: '',
          left_arm_cm: '',
          right_arm_cm: '',
          left_thigh_cm: '',
          right_thigh_cm: ''
        }
      });
    } catch (err) {
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Handle nested measurement fields
    if (name.startsWith('measurements_')) {
      const measurementField = name.replace('measurements_', '');
      setFormData({
        ...formData,
        initial_measurements: {
          ...formData.initial_measurements,
          [measurementField]: value
        }
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const loadingToast = toast.loading('Updating your profile...');
    try {
      await profileService.updateProfile(formData);
      toast.success('Profile updated successfully! ✅', { id: loadingToast });
      setEditing(false);
      fetchProfile();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to update profile', { id: loadingToast });
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 flex items-center justify-center">
      <div className="text-center">
        <div className="text-7xl mb-4 animate-bounce-subtle">⏳</div>
        <p className="text-2xl font-bold text-gray-900">Loading your profile...</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50 py-8 px-4">
      
      <div className="absolute inset-0 bg-[linear-gradient(rgba(139,92,246,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(139,92,246,0.03)_1px,transparent_1px)] bg-[size:50px_50px]"></div>
      
      <div className="max-w-5xl mx-auto relative z-10">
        <div className="flex justify-between items-center mb-8 animate-slide-down">
          <div>
            <h1 className="text-5xl font-bold gradient-text mb-2">👤 My Profile</h1>
            <p className="text-gray-600">Manage your fitness profile and preferences</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/dashboard')}
              className="group relative px-6 py-3 bg-white border-2 border-gray-200 text-gray-700 font-bold rounded-xl hover:bg-gray-50 hover:border-violet-300 transition-all duration-300 transform hover:scale-105"
            >
              <span className="flex items-center gap-2">
                <span className="text-xl">🏠</span>
                <span>Back to Dashboard</span>
              </span>
            </button>
            <button
              onClick={() => { logout(); navigate('/login'); }}
              className="group relative px-6 py-3 bg-gradient-to-r from-red-500 to-rose-500 text-white font-bold rounded-xl shadow-lg hover:shadow-red-500/50 transition-all duration-300 transform hover:scale-105 hover:-translate-y-1 overflow-hidden"
            >
              <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-rose-500 to-red-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
              <span className="relative flex items-center gap-2">
                <span className="text-xl">🚪</span>
                <span>Logout</span>
              </span>
            </button>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-2xl shadow-lg p-8 animate-scale-in">
          {!editing ? (
            
            <div>
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900">Profile Information</h2>
                <button
                  onClick={() => setEditing(true)}
                  className="group relative px-6 py-3 bg-gradient-to-r from-violet-500 to-purple-600 text-white font-bold rounded-xl shadow-lg hover:shadow-violet-500/50 transition-all duration-300 transform hover:scale-105 overflow-hidden"
                >
                  <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-purple-600 to-violet-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                  <span className="relative flex items-center gap-2">
                    <span>✏️</span>
                    <span>Edit Profile</span>
                  </span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-violet-50 to-purple-50 p-4 rounded-xl border border-violet-200">
                  <label className="block text-sm font-bold text-gray-600 mb-2">Age</label>
                  <p className="text-gray-900 text-xl font-semibold">{profile.age} years</p>
                </div>
                
                <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-200">
                  <label className="block text-sm font-bold text-gray-600 mb-2">Gender</label>
                  <p className="text-gray-900 text-xl font-semibold">{profile.gender}</p>
                </div>
                
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-xl border border-green-200">
                  <label className="block text-sm font-bold text-gray-600 mb-2">Current Weight</label>
                  <p className="text-gray-900 text-xl font-semibold">{profile.weight_kg} kg</p>
                </div>
                
                <div className="bg-gradient-to-br from-cyan-50 to-sky-50 p-4 rounded-xl border border-cyan-200">
                  <label className="block text-sm font-bold text-gray-600 mb-2">Height</label>
                  <p className="text-gray-900 text-xl font-semibold">{profile.height_cm} cm</p>
                </div>
                
                <div className="bg-gradient-to-br from-pink-50 to-rose-50 p-4 rounded-xl border border-pink-200">
                  <label className="block text-sm font-bold text-gray-600 mb-2">Goal</label>
                  <p className="text-gray-900 text-xl font-semibold">{profile.goal}</p>
                </div>
                
                <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-4 rounded-xl border border-orange-200">
                  <label className="block text-sm font-bold text-gray-600 mb-2">Target Weight</label>
                  <p className="text-gray-900 text-xl font-semibold">{profile.target_weight_kg} kg</p>
                </div>
                
                <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-4 rounded-xl border border-indigo-200">
                  <label className="block text-sm font-bold text-gray-600 mb-2">Goal Timeframe</label>
                  <p className="text-gray-900 text-xl font-semibold">{profile.goal_timeframe || '12 weeks'}</p>
                </div>
                
                <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-4 rounded-xl border border-purple-200">
                  <label className="block text-sm font-bold text-gray-600 mb-2">Experience Level</label>
                  <p className="text-gray-900 text-xl font-semibold">{profile.experience_level}</p>
                </div>
                
                <div className="bg-gradient-to-br from-teal-50 to-cyan-50 p-4 rounded-xl border border-teal-200">
                  <label className="block text-sm font-bold text-gray-600 mb-2">Training Days/Week</label>
                  <p className="text-gray-900 text-xl font-semibold">{profile.available_days_per_week} days</p>
                </div>
                
                <div className="bg-gradient-to-br from-yellow-50 to-orange-50 p-4 rounded-xl border border-yellow-200">
                  <label className="block text-sm font-bold text-gray-600 mb-2">Daily Calorie Target</label>
                  <p className="text-gray-900 text-xl font-semibold">{profile.daily_calorie_target} kcal</p>
                </div>
                
                <div className="bg-gradient-to-br from-emerald-50 to-green-50 p-4 rounded-xl border border-emerald-200 md:col-span-2">
                  <label className="block text-sm font-bold text-gray-600 mb-2">Dietary Preferences</label>
                  <p className="text-gray-900 text-lg">{profile.dietary_preferences || 'None specified'}</p>
                </div>
                
                <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-4 rounded-xl border border-amber-200 md:col-span-2">
                  <label className="block text-sm font-bold text-gray-600 mb-2">Food Allergies</label>
                  <p className="text-gray-900 text-lg">{profile.allergies || 'None specified'}</p>
                </div>
                
                <div className="bg-gradient-to-br from-red-50 to-rose-50 p-4 rounded-xl border border-red-200 md:col-span-2">
                  <label className="block text-sm font-bold text-gray-600 mb-2">Injuries/Limitations</label>
                  <p className="text-gray-900 text-lg">{profile.injuries_limitations || 'None specified'}</p>
                </div>
              </div>
            </div>
          ) : (
            
            <form onSubmit={handleSubmit}>
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900">Edit Profile</h2>
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="group relative px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 font-bold rounded-xl hover:bg-gray-50 hover:border-red-400 transition-all duration-300 transform hover:scale-105"
                >
                  <span className="flex items-center gap-2">
                    <span>❌</span>
                    <span>Cancel</span>
                  </span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Age</label>
                  <input
                    type="number"
                    name="age"
                    value={formData.age}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-100 transition-all duration-300"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Gender</label>
                  <select
                    name="gender"
                    value={formData.gender}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-violet-500 focus:ring-4 focus:ring-violet-100 transition-all duration-300"
                    required
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Current Weight (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    name="weight_kg"
                    value={formData.weight_kg}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-green-500 focus:ring-4 focus:ring-green-100 transition-all duration-300"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Height (cm)</label>
                  <input
                    type="number"
                    name="height_cm"
                    value={formData.height_cm}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-300"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Goal</label>
                  <select
                    name="goal"
                    value={formData.goal}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-pink-500 focus:ring-4 focus:ring-pink-100 transition-all duration-300"
                    required
                  >
                    <option value="Weight Loss">Weight Loss</option>
                    <option value="Muscle Gain">Muscle Gain</option>
                    <option value="Maintenance">Maintenance</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Goal Timeframe</label>
                  <select
                    name="goal_timeframe"
                    value={formData.goal_timeframe}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all duration-300"
                  >
                    <option value="8 weeks">8 weeks</option>
                    <option value="12 weeks">12 weeks</option>
                    <option value="16 weeks">16 weeks</option>
                    <option value="6 months">6 months</option>
                    <option value="9 months">9 months</option>
                    <option value="1 year">1 year</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Target Weight (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    name="target_weight_kg"
                    value={formData.target_weight_kg}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-orange-500 focus:ring-4 focus:ring-orange-100 transition-all duration-300"
                    required
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Experience Level</label>
                  <select
                    name="experience_level"
                    value={formData.experience_level}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:border-purple-500 focus:ring-4 focus:ring-purple-100 transition-all duration-300"
                    required
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Training Days/Week</label>
                  <input
                    type="number"
                    min="1"
                    max="7"
                    name="available_days_per_week"
                    value={formData.available_days_per_week}
                    onChange={handleChange}
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100 transition-all duration-300"
                    required
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-2">Dietary Preferences</label>
                  <input
                    type="text"
                    name="dietary_preferences"
                    value={formData.dietary_preferences}
                    onChange={handleChange}
                    placeholder="e.g., Vegetarian, Vegan, Keto"
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-100 transition-all duration-300"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-2">Food Allergies</label>
                  <input
                    type="text"
                    name="allergies"
                    value={formData.allergies}
                    onChange={handleChange}
                    placeholder="e.g., Nuts, Dairy, Gluten"
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-amber-500 focus:ring-4 focus:ring-amber-100 transition-all duration-300"
                  />
                </div>

                {/* Body Measurements Section (MANDATORY) */}
                <div className="md:col-span-2 mt-6 pt-6 border-t-2 border-gray-300">
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-2xl">📏</span>
                    <h3 className="text-xl font-bold text-gray-900">Body Measurements (Required)</h3>
                    <span className="text-red-500 font-bold text-lg">*</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">These measurements are essential for tracking your progress on the dashboard</p>
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Waist (cm) <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    step="0.1"
                    name="measurements_waist_cm"
                    value={formData.initial_measurements.waist_cm}
                    onChange={handleChange}
                    placeholder="e.g., 85"
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-300"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Chest (cm) <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    step="0.1"
                    name="measurements_chest_cm"
                    value={formData.initial_measurements.chest_cm}
                    onChange={handleChange}
                    placeholder="e.g., 95"
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-300"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Hips (cm) <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    step="0.1"
                    name="measurements_hips_cm"
                    value={formData.initial_measurements.hips_cm}
                    onChange={handleChange}
                    placeholder="e.g., 95"
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-300"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Left Arm (cm) <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    step="0.1"
                    name="measurements_left_arm_cm"
                    value={formData.initial_measurements.left_arm_cm}
                    onChange={handleChange}
                    placeholder="e.g., 32"
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-300"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Right Arm (cm) <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    step="0.1"
                    name="measurements_right_arm_cm"
                    value={formData.initial_measurements.right_arm_cm}
                    onChange={handleChange}
                    placeholder="e.g., 32"
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-300"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Left Thigh (cm) <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    step="0.1"
                    name="measurements_left_thigh_cm"
                    value={formData.initial_measurements.left_thigh_cm}
                    onChange={handleChange}
                    placeholder="e.g., 58"
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-300"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Right Thigh (cm) <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    step="0.1"
                    name="measurements_right_thigh_cm"
                    value={formData.initial_measurements.right_thigh_cm}
                    onChange={handleChange}
                    placeholder="e.g., 58"
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-100 transition-all duration-300"
                    required
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-bold text-gray-700 mb-2">Injuries/Limitations</label>
                  <textarea
                    name="injuries_limitations"
                    value={formData.injuries_limitations}
                    onChange={handleChange}
                    placeholder="e.g., Lower back pain, Knee injury"
                    className="w-full px-4 py-3 bg-gray-50 border-2 border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:border-red-500 focus:ring-4 focus:ring-red-100 transition-all duration-300 resize-none"
                    rows="3"
                  />
                </div>
              </div>

              <div className="mt-8">
                <button
                  type="submit"
                  className="group relative px-6 py-4 bg-gradient-to-r from-violet-500 to-purple-600 text-white font-bold rounded-xl shadow-lg hover:shadow-violet-500/50 transition-all duration-300 transform hover:scale-105 w-full text-lg overflow-hidden"
                >
                  <span className="absolute inset-0 w-full h-full bg-gradient-to-r from-purple-600 to-violet-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></span>
                  <span className="relative flex items-center justify-center gap-2">
                    <span>💾</span>
                    <span>Save Changes</span>
                  </span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
