import BodyMeasurement from '../models/BodyMeasurement.js';
import Profile from '../models/Profile.js';

export const saveInitialMeasurements = async (user_id, measurements) => {
  try {
    const profile = await Profile.findOne({ user_id });
    if (!profile) {
      throw new Error('Profile not found');
    }

    profile.initial_measurements = {
      waist_cm: measurements.waist_cm || null,
      chest_cm: measurements.chest_cm || null,
      hips_cm: measurements.hips_cm || null,
      arms_cm: measurements.arms_cm || null,
      thighs_cm: measurements.thighs_cm || null,
      measured_at: new Date()
    };
    
    profile.last_measurement_reminder = new Date();
    
    await profile.save();

    const bodyMeasurement = new BodyMeasurement({
      user_id,
      date: new Date(),
      measurements: {
        waist_cm: measurements.waist_cm || null,
        chest_cm: measurements.chest_cm || null,
        hips_cm: measurements.hips_cm || null,
        left_arm_cm: measurements.arms_cm || null,
        right_arm_cm: measurements.arms_cm || null,
        left_thigh_cm: measurements.thighs_cm || null,
        right_thigh_cm: measurements.thighs_cm || null
      },
      notes: 'Initial measurements'
    });

    await bodyMeasurement.save();

    return {
      profile_measurements: profile.initial_measurements,
      body_measurement: bodyMeasurement
    };
  } catch (error) {
    throw new Error(`Failed to save initial measurements: ${error.message}`);
  }
};

export const addMeasurement = async (user_id, measurements, notes = '') => {
  try {
    const bodyMeasurement = new BodyMeasurement({
      user_id,
      date: new Date(),
      measurements,
      notes
    });

    await bodyMeasurement.save();

    await Profile.findOneAndUpdate(
      { user_id },
      { last_measurement_reminder: new Date() }
    );

    return bodyMeasurement;
  } catch (error) {
    throw new Error(`Failed to add measurement: ${error.message}`);
  }
};

export const getAllMeasurements = async (user_id) => {
  try {
    const measurements = await BodyMeasurement.find({ user_id }).sort({ date: 1 });
    return measurements;
  } catch (error) {
    throw new Error(`Failed to get measurements: ${error.message}`);
  }
};

export const getLatestMeasurement = async (user_id) => {
  try {
    const measurement = await BodyMeasurement.findOne({ user_id }).sort({ date: -1 });
    return measurement;
  } catch (error) {
    throw new Error(`Failed to get latest measurement: ${error.message}`);
  }
};

export const checkMeasurementReminder = async (user_id) => {
  try {
    const profile = await Profile.findOne({ user_id });
    if (!profile) {
      return { reminder_due: false };
    }

    if (!profile.initial_measurements || !profile.initial_measurements.measured_at) {
      return { reminder_due: false };
    }

    const lastReminder = profile.last_measurement_reminder || profile.initial_measurements.measured_at;
    const fourWeeksAgo = new Date();
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28); 

    const reminderDue = new Date(lastReminder) <= fourWeeksAgo;

    return {
      reminder_due: reminderDue,
      last_reminder_date: lastReminder,
      days_since_last: Math.floor((new Date() - new Date(lastReminder)) / (1000 * 60 * 60 * 24))
    };
  } catch (error) {
    throw new Error(`Failed to check measurement reminder: ${error.message}`);
  }
};

export const compareMeasurements = async (user_id) => {
  try {
    const profile = await Profile.findOne({ user_id });
    if (!profile || !profile.initial_measurements) {
      return null;
    }

    const latestMeasurement = await getLatestMeasurement(user_id);
    if (!latestMeasurement) {
      return null;
    }

    const initial = profile.initial_measurements;
    const current = latestMeasurement.measurements;

    const changes = {
      waist_change: current.waist_cm ? (current.waist_cm - (initial.waist_cm || 0)).toFixed(1) : null,
      chest_change: current.chest_cm ? (current.chest_cm - (initial.chest_cm || 0)).toFixed(1) : null,
      hips_change: current.hips_cm ? (current.hips_cm - (initial.hips_cm || 0)).toFixed(1) : null,
      arms_change: current.left_arm_cm ? (current.left_arm_cm - (initial.arms_cm || 0)).toFixed(1) : null,
      thighs_change: current.left_thigh_cm ? (current.left_thigh_cm - (initial.thighs_cm || 0)).toFixed(1) : null
    };

    const analysis = analyzeMeasurementProgress(profile.goal, changes);

    return {
      initial_measurements: initial,
      current_measurements: current,
      changes,
      analysis,
      measurement_date: latestMeasurement.date
    };
  } catch (error) {
    throw new Error(`Failed to compare measurements: ${error.message}`);
  }
};

const analyzeMeasurementProgress = (goal, changes) => {
  const analysis = {
    overall_progress: 'neutral',
    recommendations: [],
    positive_indicators: [],
    concerns: []
  };

  if (goal === 'Weight Loss') {
    if (changes.waist_change && parseFloat(changes.waist_change) < -2) {
      analysis.positive_indicators.push('Significant waist reduction - excellent progress!');
    } else if (changes.waist_change && parseFloat(changes.waist_change) > 0) {
      analysis.concerns.push('Waist measurement increased - may need diet adjustment');
    }

    if (changes.hips_change && parseFloat(changes.hips_change) < -2) {
      analysis.positive_indicators.push('Hip measurement decreased - good fat loss');
    }

    analysis.overall_progress = analysis.positive_indicators.length > analysis.concerns.length ? 'good' : 'needs_improvement';
    
  } else if (goal === 'Muscle Gain') {
    if (changes.chest_change && parseFloat(changes.chest_change) > 2) {
      analysis.positive_indicators.push('Chest measurement increased - muscle growth detected!');
    }
    
    if (changes.arms_change && parseFloat(changes.arms_change) > 1) {
      analysis.positive_indicators.push('Arm measurement increased - good muscle development');
    }

    if (changes.thighs_change && parseFloat(changes.thighs_change) > 2) {
      analysis.positive_indicators.push('Leg muscles growing - excellent lower body progress');
    }

    if (changes.waist_change && parseFloat(changes.waist_change) > 3) {
      analysis.concerns.push('Waist increased significantly - may be gaining excess fat');
    }

    analysis.overall_progress = analysis.positive_indicators.length >= 2 ? 'excellent' : 'moderate';
    
  } else if (goal === 'Maintenance') {
    const allChanges = Object.values(changes).filter(c => c !== null).map(c => Math.abs(parseFloat(c)));
    const avgChange = allChanges.reduce((a, b) => a + b, 0) / allChanges.length;

    if (avgChange < 1) {
      analysis.positive_indicators.push('Measurements stable - excellent maintenance!');
      analysis.overall_progress = 'excellent';
    } else if (avgChange > 2) {
      analysis.concerns.push('Significant measurement changes - may need plan adjustment');
      analysis.overall_progress = 'needs_adjustment';
    }
  }

  if (analysis.concerns.length > 0) {
    analysis.recommendations.push('Consider regenerating your workout and diet plans');
    analysis.recommendations.push('Consult with AI coach for personalized adjustments');
  } else if (analysis.positive_indicators.length > 0) {
    analysis.recommendations.push('Keep up the excellent work!');
    analysis.recommendations.push('Continue with current plan for another 4 weeks');
  }

  return analysis;
};

export const getMeasurementHistory = async (user_id) => {
  try {
    const measurements = await BodyMeasurement.find({ user_id }).sort({ date: 1 });
    
    const history = measurements.map(m => ({
      date: m.date,
      waist: m.measurements.waist_cm,
      chest: m.measurements.chest_cm,
      hips: m.measurements.hips_cm,
      arms: (m.measurements.left_arm_cm + m.measurements.right_arm_cm) / 2,
      thighs: (m.measurements.left_thigh_cm + m.measurements.right_thigh_cm) / 2
    }));

    return history;
  } catch (error) {
    throw new Error(`Failed to get measurement history: ${error.message}`);
  }
};

export default {
  saveInitialMeasurements,
  addMeasurement,
  getAllMeasurements,
  getLatestMeasurement,
  checkMeasurementReminder,
  compareMeasurements,
  getMeasurementHistory
};
