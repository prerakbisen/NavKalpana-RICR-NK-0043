const filterMealsByDietaryRestrictions = (meals, allergies, dietaryPreferences) => {
  if ((!allergies || allergies.trim() === '') && (!dietaryPreferences || dietaryPreferences.trim() === '')) {
    return meals;
  }
  
  const allergyList = allergies ? allergies.toLowerCase().split(',').map(a => a.trim()) : [];
  const preferences = dietaryPreferences ? dietaryPreferences.toLowerCase().trim() : '';
  
  const allergenFoods = {
    'nuts': ['peanut', 'almond', 'walnut', 'cashew', 'nut'],
    'dairy': ['milk', 'cheese', 'yogurt', 'butter', 'cream', 'whey', 'casein'],
    'gluten': ['wheat', 'bread', 'pasta', 'oats', 'cereal'],
    'eggs': ['egg'],
    'soy': ['soy', 'tofu', 'edamame'],
    'shellfish': ['shrimp', 'crab', 'lobster', 'shellfish'],
    'fish': ['fish', 'salmon', 'tuna', 'cod'],
    'lactose': ['milk', 'cheese', 'yogurt', 'dairy']
  };
  
  const dietaryRestrictions = {
    'vegetarian': ['chicken', 'beef', 'pork', 'fish', 'salmon', 'tuna', 'turkey', 'lamb', 'meat'],
    'vegan': ['chicken', 'beef', 'pork', 'fish', 'salmon', 'tuna', 'turkey', 'lamb', 'meat', 'egg', 'milk', 'cheese', 'yogurt', 'dairy', 'whey'],
    'pescatarian': ['chicken', 'beef', 'pork', 'turkey', 'lamb', 'meat'],
    'keto': ['rice', 'pasta', 'bread', 'oats', 'potato', 'banana'],
    'paleo': ['dairy', 'grain', 'legume', 'processed']
  };
  
  return meals.map(meal => {
    let description = meal.description;
    let shouldModify = false;
    
    for (const allergy of allergyList) {
      const avoidFoods = allergenFoods[allergy] || [allergy];
      for (const food of avoidFoods) {
        if (description.toLowerCase().includes(food)) {
          shouldModify = true;
          description = description.replace(new RegExp(food, 'gi'), getSafeAlternative(food, preferences));
        }
      }
    }
    
    if (preferences) {
      const restrictedFoods = dietaryRestrictions[preferences] || [];
      for (const food of restrictedFoods) {
        if (description.toLowerCase().includes(food)) {
          shouldModify = true;
          description = description.replace(new RegExp(food, 'gi'), getSafeAlternative(food, preferences));
        }
      }
    }
    
    return {
      ...meal,
      description,
      modified: shouldModify,
      modification_note: shouldModify ? `Modified for ${allergies ? 'allergies' : ''}${allergies && preferences ? ' and ' : ''}${preferences || ''}` : undefined
    };
  });
};

const getSafeAlternative = (food, preference) => {
  const alternatives = {
    'chicken': preference === 'vegan' ? 'tofu' : preference === 'vegetarian' ? 'paneer' : 'turkey',
    'beef': preference === 'vegan' ? 'tempeh' : preference === 'vegetarian' ? 'lentils' : 'chicken',
    'pork': preference === 'vegan' ? 'seitan' : preference === 'vegetarian' ? 'chickpeas' : 'chicken',
    'fish': preference === 'vegan' ? 'tofu' : preference === 'vegetarian' ? 'eggs' : 'chicken',
    'salmon': preference === 'vegan' ? 'tofu' : preference === 'vegetarian' ? 'eggs' : 'chicken',
    'turkey': preference === 'vegan' ? 'tempeh' : preference === 'vegetarian' ? 'beans' : 'chicken',
    
    'milk': 'almond milk',
    'cheese': 'nutritional yeast',
    'yogurt': 'coconut yogurt',
    'butter': 'olive oil',
    'whey': 'pea protein',
    
    'rice': 'cauliflower rice',
    'pasta': 'zucchini noodles',
    'bread': 'lettuce wrap',
    'oats': 'chia seeds',
    
    'peanut': 'sunflower seed',
    'almond': 'pumpkin seed',
    
    'egg': 'flax egg'
  };
  
  return alternatives[food.toLowerCase()] || 'protein alternative';
};

export const generateDietPlan = (daily_calorie_target, goal, macros, allergies = '', dietaryPreferences = '') => {
  const mealsPerDay = 4; // Default to 4 meals
  const caloriesPerMeal = Math.round(daily_calorie_target / mealsPerDay);
  
  let meals = [
    {
      meal_number: 1,
      meal_name: 'Breakfast',
      description: 'Oats with protein powder and banana',
      estimated_calories: caloriesPerMeal,
      macros: {
        protein_g: Math.round(macros.protein_grams / mealsPerDay),
        carbs_g: Math.round(macros.carbs_grams / mealsPerDay),
        fat_g: Math.round(macros.fat_grams / mealsPerDay)
      }
    },
    {
      meal_number: 2,
      meal_name: 'Snack',
      description: 'Greek yogurt with berries',
      estimated_calories: caloriesPerMeal,
      macros: {
        protein_g: Math.round(macros.protein_grams / mealsPerDay),
        carbs_g: Math.round(macros.carbs_grams / mealsPerDay),
        fat_g: Math.round(macros.fat_grams / mealsPerDay)
      }
    },
    {
      meal_number: 3,
      meal_name: 'Lunch',
      description: 'Chicken breast with rice and vegetables',
      estimated_calories: caloriesPerMeal,
      macros: {
        protein_g: Math.round(macros.protein_grams / mealsPerDay),
        carbs_g: Math.round(macros.carbs_grams / mealsPerDay),
        fat_g: Math.round(macros.fat_grams / mealsPerDay)
      }
    },
    {
      meal_number: 4,
      meal_name: 'Dinner',
      description: 'Salmon with sweet potato and broccoli',
      estimated_calories: caloriesPerMeal,
      macros: {
        protein_g: Math.round(macros.protein_grams / mealsPerDay),
        carbs_g: Math.round(macros.carbs_grams / mealsPerDay),
        fat_g: Math.round(macros.fat_grams / mealsPerDay)
      }
    }
  ];
  
  if (goal === 'Weight Loss') {
    meals.push({
      meal_number: 5,
      meal_name: 'Pre-bed Snack',
      description: 'Casein or cottage cheese',
      estimated_calories: Math.round(daily_calorie_target * 0.1),
      macros: {
        protein_g: Math.round(macros.protein_grams * 0.1),
        carbs_g: Math.round(macros.carbs_grams * 0.1),
        fat_g: Math.round(macros.fat_grams * 0.1)
      }
    });
  }
  
  meals = filterMealsByDietaryRestrictions(meals, allergies, dietaryPreferences);
  
  return meals;
};

export const getMealSuggestions = (goal, mealType) => {
  const suggestions = {
    'Breakfast': {
      'Weight Loss': ['Egg whites with oats', 'Greek yogurt with granola', 'Protein pancakes', 'Chicken and rice'],
      'Muscle Gain': ['Oats with peanut butter', 'Eggs and toast', 'Protein smoothie bowl', 'Pancakes with syrup'],
      'Maintenance': ['Cereal with milk', 'Toast with avocado', 'Oatmeal with fruit', 'Eggs and bacon']
    },
    'Lunch': {
      'Weight Loss': ['Grilled chicken breast with broccoli', 'Turkey breast sandwich', 'Tuna salad', 'Lean ground turkey with rice'],
      'Muscle Gain': ['Steak with sweet potato', 'Salmon with rice and veggies', 'Chicken with pasta', 'Lamb with potatoes'],
      'Maintenance': ['Chicken with rice', 'Turkey burger', 'Fish tacos', 'Pork chops with veggies']
    },
    'Dinner': {
      'Weight Loss': ['Salmon with vegetables', 'Lean ground beef with veggies', 'White fish with asparagus', 'Chicken with green beans'],
      'Muscle Gain': ['Ribeye steak with potatoes', 'Salmon with sweet potato', 'Chicken thighs with rice', 'Ground beef tacos'],
      'Maintenance': ['Pork tenderloin with carrots', 'Chicken breast with quinoa', 'Fish with roasted veggies', 'Beef stew']
    }
  };
  
  return suggestions[mealType] || [];
};
