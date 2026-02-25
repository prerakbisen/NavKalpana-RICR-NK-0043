// Beginner workout template
export const beginnerWorkoutTemplate = {
  'Full Body 1': {
    exercises: [
      { name: 'Squats', sets: 3, reps: '8-10', rest_seconds: 90, guidance: 'Full depth, control the descent', intensity_level: 'Moderate' },
      { name: 'Bench Press', sets: 3, reps: '8-10', rest_seconds: 90, guidance: 'Lower to chest, controlled push', intensity_level: 'Moderate' },
      { name: 'Rows', sets: 3, reps: '8-10', rest_seconds: 90, guidance: 'Pull to chest, squeeze back', intensity_level: 'Moderate' },
      { name: 'Overhead Press', sets: 2, reps: '8-10', rest_seconds: 60, guidance: 'Strict form, no arching', intensity_level: 'Light' }
    ]
  },
  'Full Body 2': {
    exercises: [
      { name: 'Deadlifts', sets: 3, reps: '5-8', rest_seconds: 120, guidance: 'Keep bar close, neutral spine', intensity_level: 'High' },
      { name: 'Pull-ups or Lat Pulldowns', sets: 3, reps: '8-12', rest_seconds: 60, guidance: 'Full range of motion', intensity_level: 'Moderate' },
      { name: 'Dumbbell Bench Press', sets: 3, reps: '8-12', rest_seconds: 60, guidance: 'Pause at bottom', intensity_level: 'Moderate' },
      { name: 'Leg Press', sets: 2, reps: '10-12', rest_seconds: 60, guidance: 'Full range, no locking knees', intensity_level: 'Light' }
    ]
  },
  'Full Body 3': {
    exercises: [
      { name: 'Leg Press', sets: 3, reps: '10-12', rest_seconds: 90, guidance: 'Full range of motion', intensity_level: 'Moderate' },
      { name: 'Incline Bench Press', sets: 3, reps: '8-12', rest_seconds: 60, guidance: 'Focus on chest', intensity_level: 'Moderate' },
      { name: 'Barbell Rows', sets: 3, reps: '8-10', rest_seconds: 90, guidance: 'Explode off chest', intensity_level: 'Moderate' },
      { name: 'Face Pulls', sets: 3, reps: '15-20', rest_seconds: 45, guidance: 'Shoulder health exercise', intensity_level: 'Light' }
    ]
  }
};

export const intermediateWorkoutTemplate = {
  'Push': {
    exercises: [
      { name: 'Barbell Bench Press', sets: 4, reps: '6-8', rest_seconds: 120, guidance: 'Main compound, progressive load', intensity_level: 'High' },
      { name: 'Incline Dumbbell Press', sets: 3, reps: '8-10', rest_seconds: 90, guidance: 'Upper chest focus', intensity_level: 'Moderate' },
      { name: 'Overhead Press', sets: 3, reps: '6-8', rest_seconds: 90, guidance: 'Shoulders main focus', intensity_level: 'Moderate' },
      { name: 'Dumbbell Flyes', sets: 3, reps: '10-12', rest_seconds: 60, guidance: 'Chest isolation', intensity_level: 'Light' },
      { name: 'Lateral Raises', sets: 3, reps: '12-15', rest_seconds: 45, guidance: 'Side delt isolation', intensity_level: 'Light' }
    ]
  },
  'Pull': {
    exercises: [
      { name: 'Barbell Rows', sets: 4, reps: '6-8', rest_seconds: 120, guidance: 'Main compound, heavy', intensity_level: 'High' },
      { name: 'Pull-ups', sets: 3, reps: '6-10', rest_seconds: 90, guidance: 'Add weight if possible', intensity_level: 'Moderate' },
      { name: 'Dumbbell Rows', sets: 3, reps: '8-10', rest_seconds: 60, guidance: 'Unilateral strength', intensity_level: 'Moderate' },
      { name: 'Face Pulls', sets: 3, reps: '15-20', rest_seconds: 45, guidance: 'Rear delt and shoulder health', intensity_level: 'Light' },
      { name: 'Barbell Curls', sets: 3, reps: '8-10', rest_seconds: 60, guidance: 'Arm development', intensity_level: 'Light' }
    ]
  },
  'Leg': {
    exercises: [
      { name: 'Barbell Squats', sets: 4, reps: '6-8', rest_seconds: 120, guidance: 'Primary leg builder', intensity_level: 'High' },
      { name: 'Romanian Deadlifts', sets: 3, reps: '8-10', rest_seconds: 90, guidance: 'Posterior chain focus', intensity_level: 'Moderate' },
      { name: 'Leg Press', sets: 3, reps: '8-12', rest_seconds: 90, guidance: 'Volume builder', intensity_level: 'Moderate' },
      { name: 'Leg Curls', sets: 3, reps: '10-12', rest_seconds: 60, guidance: 'Hamstring isolation', intensity_level: 'Light' },
      { name: 'Leg Extensions', sets: 3, reps: '12-15', rest_seconds: 45, guidance: 'Quad isolation', intensity_level: 'Light' }
    ]
  }
};

export const advancedWorkoutTemplate = {
  'Heavy Compound': {
    exercises: [
      { name: 'Barbell Bench Press', sets: 5, reps: '3-5', rest_seconds: 180, guidance: 'Heavy strength phase', intensity_level: 'High' },
      { name: 'Barbell Squats', sets: 5, reps: '3-5', rest_seconds: 180, guidance: 'Heavy strength phase', intensity_level: 'High' },
      { name: 'Deadlifts', sets: 3, reps: '3-5', rest_seconds: 180, guidance: 'CNS taxing, limited volume', intensity_level: 'High' }
    ]
  },
  'Accessory': {
    exercises: [
      { name: 'Dumbbell Incline Press', sets: 4, reps: '8-10', rest_seconds: 90, guidance: 'Upper chest development', intensity_level: 'Moderate' },
      { name: 'Weighted Pull-ups', sets: 4, reps: '5-8', rest_seconds: 120, guidance: 'Add resistance', intensity_level: 'Moderate' },
      { name: 'Barbell Rows', sets: 3, reps: '6-8', rest_seconds: 90, guidance: 'Heavy back work', intensity_level: 'Moderate' },
      { name: 'Dumbbell Flyes', sets: 3, reps: '12-15', rest_seconds: 60, guidance: 'Pump and isolation', intensity_level: 'Light' }
    ]
  },
  'Volume': {
    exercises: [
      { name: 'Leg Press', sets: 4, reps: '8-12', rest_seconds: 90, guidance: 'High volume quads', intensity_level: 'Moderate' },
      { name: 'Leg Curls', sets: 4, reps: '10-15', rest_seconds: 60, guidance: 'Hamstring volume', intensity_level: 'Light' },
      { name: 'Cable Chest Press', sets: 3, reps: '12-15', rest_seconds: 60, guidance: 'Pump work', intensity_level: 'Light' },
      { name: 'Machine Rows', sets: 3, reps: '12-15', rest_seconds: 60, guidance: 'Back pump', intensity_level: 'Light' }
    ]
  }
};

const applyIntensityMultiplier = (exercises, multiplier) => {
  return exercises.map(exercise => {
    const adjustedExercise = { ...exercise };
    
    if (multiplier < 1.0) {
      adjustedExercise.sets = Math.max(2, Math.floor(exercise.sets * multiplier));
      adjustedExercise.guidance += ' | Reduced volume for recovery';
    } else if (multiplier > 1.0) {
      adjustedExercise.sets = Math.min(5, Math.ceil(exercise.sets * multiplier));
      adjustedExercise.guidance += ' | Increased volume for active lifestyle';
    }
    
    return adjustedExercise;
  });
};

const filterExercisesByInjuries = (exercises, injuries) => {
  if (!injuries || injuries.trim() === '') return exercises;
  
  const injuryKeywords = injuries.toLowerCase().split(',').map(i => i.trim());
  const injuryExerciseMap = {
    'knee': ['squats', 'leg press', 'lunges', 'leg extension'],
    'back': ['deadlifts', 'rows', 'squats'],
    'shoulder': ['overhead press', 'lateral raises', 'bench press'],
    'elbow': ['curls', 'tricep', 'overhead press'],
    'wrist': ['curls', 'wrist', 'push-ups'],
    'ankle': ['running', 'jumping', 'calf raises'],
    'hip': ['squats', 'deadlifts', 'leg press']
  };
  
  return exercises.filter(exercise => {
    const exerciseName = exercise.name.toLowerCase();
    
    for (const injury of injuryKeywords) {
      const avoidExercises = injuryExerciseMap[injury] || [];
      for (const avoid of avoidExercises) {
        if (exerciseName.includes(avoid)) {
          return false; 
        }
      }
    }
    
    return true;
  });
};

const getSafeAlternatives = (originalExercise, injuries) => {
  const alternatives = {
    'Squats': { name: 'Leg Press', sets: 3, reps: '10-12', rest_seconds: 90, guidance: 'Safer for knee/back issues', intensity_level: 'Moderate' },
    'Deadlifts': { name: 'Romanian Deadlifts', sets: 3, reps: '8-10', rest_seconds: 120, guidance: 'Less stress on lower back', intensity_level: 'Moderate' },
    'Overhead Press': { name: 'Dumbbell Shoulder Press', sets: 3, reps: '8-10', rest_seconds: 90, guidance: 'Better shoulder control', intensity_level: 'Moderate' },
    'Bench Press': { name: 'Dumbbell Bench Press', sets: 3, reps: '8-10', rest_seconds: 90, guidance: 'More shoulder-friendly', intensity_level: 'Moderate' },
    'Barbell Rows': { name: 'Cable Rows', sets: 3, reps: '10-12', rest_seconds: 60, guidance: 'Less back strain', intensity_level: 'Moderate' }
  };
  
  return alternatives[originalExercise.name] || originalExercise;
};

export const generateWeeklyWorkout = (goal, experienceLevel, fatigueStatus, injuries = '', trainingDaysPerWeek = 4, activityLevel = 'Moderate') => {
  const week = [];
  
  let template;
  if (experienceLevel === 'Beginner') {
    template = beginnerWorkoutTemplate;
  } else if (experienceLevel === 'Intermediate') {
    template = intermediateWorkoutTemplate;
  } else {
    template = advancedWorkoutTemplate;
  }
  
  if (fatigueStatus === 'Very Tired' || fatigueStatus === 'Slightly Fatigued') {
    return generateRecoveryWeek();
  }
  
  const intensityMultiplier = {
    'Sedentary': 0.8,  
    'Light': 0.9,
    'Moderate': 1.0,
    'Active': 1.1      
  }[activityLevel] || 1.0;
  
  if (experienceLevel === 'Beginner') {
    const daysToInclude = Math.min(trainingDaysPerWeek, 4);
    const workoutDays = [
      { day: 1, day_name: 'Monday', type: 'Full Body', exercises: applyIntensityMultiplier(filterExercisesByInjuries(template['Full Body 1'].exercises, injuries), intensityMultiplier), rest_day: false },
      { day: 3, day_name: 'Wednesday', type: 'Full Body', exercises: applyIntensityMultiplier(filterExercisesByInjuries(template['Full Body 2'].exercises, injuries), intensityMultiplier), rest_day: false },
      { day: 5, day_name: 'Friday', type: 'Full Body', exercises: applyIntensityMultiplier(filterExercisesByInjuries(template['Full Body 3'].exercises, injuries), intensityMultiplier), rest_day: false },
      { day: 6, day_name: 'Saturday', type: 'Full Body', exercises: applyIntensityMultiplier(filterExercisesByInjuries(template['Full Body 1'].exercises, injuries), intensityMultiplier), rest_day: false }
    ];
    
    for (let i = 0; i < daysToInclude; i++) {
      week.push(workoutDays[i]);
    }
    
    const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const usedDays = week.map(d => d.day);
    for (let i = 1; i <= 7; i++) {
      if (!usedDays.includes(i)) {
        week.push({ day: i, day_name: dayNames[i-1], type: 'Rest', exercises: [], rest_day: true });
      }
    }
    week.sort((a, b) => a.day - b.day);
    
  } else if (experienceLevel === 'Intermediate') {
    const daysToInclude = Math.min(trainingDaysPerWeek, 6);
    const workoutDays = [
      { day: 1, day_name: 'Monday', type: 'Push', exercises: applyIntensityMultiplier(filterExercisesByInjuries(template['Push'].exercises, injuries), intensityMultiplier), rest_day: false },
      { day: 2, day_name: 'Tuesday', type: 'Pull', exercises: applyIntensityMultiplier(filterExercisesByInjuries(template['Pull'].exercises, injuries), intensityMultiplier), rest_day: false },
      { day: 3, day_name: 'Wednesday', type: 'Leg', exercises: applyIntensityMultiplier(filterExercisesByInjuries(template['Leg'].exercises, injuries), intensityMultiplier), rest_day: false },
      { day: 5, day_name: 'Friday', type: 'Push', exercises: applyIntensityMultiplier(filterExercisesByInjuries(template['Push'].exercises, injuries), intensityMultiplier), rest_day: false },
      { day: 6, day_name: 'Saturday', type: 'Pull', exercises: applyIntensityMultiplier(filterExercisesByInjuries(template['Pull'].exercises, injuries), intensityMultiplier), rest_day: false },
      { day: 7, day_name: 'Sunday', type: 'Leg', exercises: applyIntensityMultiplier(filterExercisesByInjuries(template['Leg'].exercises, injuries), intensityMultiplier), rest_day: false }
    ];
    
    for (let i = 0; i < daysToInclude; i++) {
      week.push(workoutDays[i]);
    }
    
    const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const usedDays = week.map(d => d.day);
    for (let i = 1; i <= 7; i++) {
      if (!usedDays.includes(i)) {
        week.push({ day: i, day_name: dayNames[i-1], type: 'Rest', exercises: [], rest_day: true });
      }
    }
    week.sort((a, b) => a.day - b.day);
    
  } else {
    const daysToInclude = Math.min(trainingDaysPerWeek, 6);
    const workoutDays = [
      { day: 1, day_name: 'Monday', type: 'Heavy Compound', exercises: applyIntensityMultiplier(filterExercisesByInjuries(template['Heavy Compound'].exercises, injuries), intensityMultiplier), rest_day: false },
      { day: 2, day_name: 'Tuesday', type: 'Accessory', exercises: applyIntensityMultiplier(filterExercisesByInjuries(template['Accessory'].exercises, injuries), intensityMultiplier), rest_day: false },
      { day: 3, day_name: 'Wednesday', type: 'Volume', exercises: applyIntensityMultiplier(filterExercisesByInjuries(template['Volume'].exercises, injuries), intensityMultiplier), rest_day: false },
      { day: 4, day_name: 'Thursday', type: 'Heavy Compound', exercises: applyIntensityMultiplier(filterExercisesByInjuries(template['Heavy Compound'].exercises, injuries), intensityMultiplier), rest_day: false },
      { day: 5, day_name: 'Friday', type: 'Accessory', exercises: applyIntensityMultiplier(filterExercisesByInjuries(template['Accessory'].exercises, injuries), intensityMultiplier), rest_day: false },
      { day: 6, day_name: 'Saturday', type: 'Volume', exercises: applyIntensityMultiplier(filterExercisesByInjuries(template['Volume'].exercises, injuries), intensityMultiplier), rest_day: false }
    ];
    
    for (let i = 0; i < daysToInclude; i++) {
      week.push(workoutDays[i]);
    }
    
    const dayNames = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
    const usedDays = week.map(d => d.day);
    for (let i = 1; i <= 7; i++) {
      if (!usedDays.includes(i)) {
        week.push({ day: i, day_name: dayNames[i-1], type: 'Rest', exercises: [], rest_day: true });
      }
    }
    week.sort((a, b) => a.day - b.day);
  }
  
  if (injuries && injuries.trim() !== '') {
    week.forEach(day => {
      if (day.exercises.length > 0) {
        day.injury_note = `⚠️ Exercises modified to accommodate: ${injuries}`;
      }
    });
  }
  
  return week;
};

export const generateRecoveryWeek = () => {
  return [
    { day: 1, day_name: 'Monday', type: 'Mobility', exercises: [{ name: 'Yoga/Stretching', sets: 1, reps: '30-45 min', rest_seconds: 0, guidance: 'Low intensity recovery', intensity_level: 'Light' }], rest_day: false },
    { day: 2, day_name: 'Tuesday', type: 'Light Cardio', exercises: [{ name: 'Walking or Swimming', sets: 1, reps: '20-30 min', rest_seconds: 0, guidance: 'Easy pace', intensity_level: 'Light' }], rest_day: false },
    { day: 3, day_name: 'Wednesday', type: 'Mobility', exercises: [{ name: 'Foam Rolling', sets: 1, reps: '20 min', rest_seconds: 0, guidance: 'Focus on tight areas', intensity_level: 'Light' }], rest_day: false },
    { day: 4, day_name: 'Thursday', type: 'Rest', exercises: [], rest_day: true },
    { day: 5, day_name: 'Friday', type: 'Light Cardio', exercises: [{ name: 'Light Cycling', sets: 1, reps: '20-30 min', rest_seconds: 0, guidance: 'Very easy pace', intensity_level: 'Light' }], rest_day: false },
    { day: 6, day_name: 'Saturday', type: 'Mobility', exercises: [{ name: 'Stretching', sets: 1, reps: '20-30 min', rest_seconds: 0, guidance: 'Full body stretch', intensity_level: 'Light' }], rest_day: false },
    { day: 7, day_name: 'Sunday', type: 'Complete Rest', exercises: [], rest_day: true }
  ];
};
