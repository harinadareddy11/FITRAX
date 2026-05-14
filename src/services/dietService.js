// src/services/dietService.js

const dietTemplates = {
  muscle_gain: {
    economy: {
      macros: { protein: 130, carbs: 250, fat: 55, calories: 2020 },
      meals: [
        {
          time: '7:00 AM', name: 'Breakfast',
          items: ['6 whole eggs scrambled', '3 rotis', '1 banana'],
          macros: { protein: 38, carbs: 68, fat: 22, calories: 630 },
        },
        {
          time: '1:00 PM', name: 'Lunch',
          items: ['150g chicken (boiled)', '1 cup rice', '1 cup dal', 'Sabzi'],
          macros: { protein: 45, carbs: 80, fat: 12, calories: 600 },
        },
        {
          time: '5:00 PM', name: 'Pre-Workout',
          items: ['4 roti with peanut butter', '1 banana'],
          macros: { protein: 14, carbs: 62, fat: 12, calories: 400 },
        },
        {
          time: '9:00 PM', name: 'Dinner',
          items: ['4 eggs', '1 cup oats with milk', '1 cup curd'],
          macros: { protein: 33, carbs: 40, fat: 9, calories: 390 },
        },
      ],
    },
    standard: {
      macros: { protein: 155, carbs: 270, fat: 60, calories: 2260 },
      meals: [
        {
          time: '7:00 AM', name: 'Breakfast',
          items: ['6 eggs', '100g oats with milk', '1 banana', '1 tbsp peanut butter'],
          macros: { protein: 42, carbs: 75, fat: 20, calories: 660 },
        },
        {
          time: '1:00 PM', name: 'Lunch',
          items: ['200g chicken', '1.5 cups rice', '1 cup dal', 'Sabzi with ghee'],
          macros: { protein: 55, carbs: 90, fat: 18, calories: 740 },
        },
        {
          time: '5:00 PM', name: 'Pre-Workout',
          items: ['100g paneer bhurji', '3 roti', '1 banana'],
          macros: { protein: 28, carbs: 65, fat: 12, calories: 460 },
        },
        {
          time: '9:00 PM', name: 'Dinner',
          items: ['150g chicken', '1 cup curd', '2 eggs', 'Salad'],
          macros: { protein: 50, carbs: 18, fat: 10, calories: 360 },
        },
      ],
    },
    premium: {
      macros: { protein: 180, carbs: 280, fat: 65, calories: 2450 },
      meals: [
        {
          time: '7:00 AM', name: 'Breakfast',
          items: ['8 eggs (4 whole + 4 whites)', '100g oats', '200ml milk', '1 banana', '30g peanut butter'],
          macros: { protein: 52, carbs: 80, fat: 24, calories: 740 },
        },
        {
          time: '1:00 PM', name: 'Lunch',
          items: ['250g chicken', '2 cups rice', '200g paneer', 'Sabzi'],
          macros: { protein: 72, carbs: 95, fat: 20, calories: 840 },
        },
        {
          time: '5:00 PM', name: 'Pre-Workout',
          items: ['100g sprouts', '2 boiled eggs', '3 roti'],
          macros: { protein: 28, carbs: 60, fat: 10, calories: 440 },
        },
        {
          time: '9:00 PM', name: 'Dinner',
          items: ['200g chicken', '1.5 cups curd', '1 cup dal'],
          macros: { protein: 58, carbs: 28, fat: 11, calories: 430 },
        },
      ],
    },
  },
  fat_loss: {
    economy: {
      macros: { protein: 140, carbs: 150, fat: 45, calories: 1560 },
      meals: [
        {
          time: '7:00 AM', name: 'Breakfast',
          items: ['4 boiled eggs', '1 cup oats with water', '1 apple'],
          macros: { protein: 32, carbs: 50, fat: 14, calories: 450 },
        },
        {
          time: '1:00 PM', name: 'Lunch',
          items: ['150g chicken', '1 cup dal', '2 roti', 'Salad'],
          macros: { protein: 48, carbs: 55, fat: 12, calories: 520 },
        },
        {
          time: '5:00 PM', name: 'Pre-Workout',
          items: ['3 eggs', '1 banana'],
          macros: { protein: 20, carbs: 28, fat: 9, calories: 270 },
        },
        {
          time: '9:00 PM', name: 'Dinner',
          items: ['4 egg whites', '1 cup curd (low fat)', 'Sabzi (no oil)'],
          macros: { protein: 28, carbs: 12, fat: 2, calories: 180 },
        },
      ],
    },
    standard: {
      macros: { protein: 160, carbs: 160, fat: 48, calories: 1720 },
      meals: [
        {
          time: '7:00 AM', name: 'Breakfast',
          items: ['5 eggs', '75g oats', '200ml milk', '1 banana'],
          macros: { protein: 38, carbs: 65, fat: 15, calories: 555 },
        },
        {
          time: '1:00 PM', name: 'Lunch',
          items: ['200g chicken', '1 cup brown rice', '1 cup dal'],
          macros: { protein: 52, carbs: 65, fat: 12, calories: 580 },
        },
        {
          time: '5:00 PM', name: 'Pre-Workout',
          items: ['100g paneer', '2 roti'],
          macros: { protein: 22, carbs: 30, fat: 10, calories: 300 },
        },
        {
          time: '9:00 PM', name: 'Dinner',
          items: ['150g chicken', '1 cup curd', 'Green salad'],
          macros: { protein: 42, carbs: 12, fat: 8, calories: 285 },
        },
      ],
    },
    premium: {
      macros: { protein: 175, carbs: 165, fat: 52, calories: 1840 },
      meals: [
        {
          time: '7:00 AM', name: 'Breakfast',
          items: ['6 eggs', '100g oats', '200ml milk', '30g peanut butter'],
          macros: { protein: 44, carbs: 72, fat: 22, calories: 660 },
        },
        {
          time: '1:00 PM', name: 'Lunch',
          items: ['250g chicken', '150g brown rice', '200g paneer'],
          macros: { protein: 68, carbs: 52, fat: 18, calories: 640 },
        },
        {
          time: '5:00 PM', name: 'Pre-Workout',
          items: ['1 cup sprouts', '2 eggs', '1 banana'],
          macros: { protein: 24, carbs: 35, fat: 8, calories: 300 },
        },
        {
          time: '9:00 PM', name: 'Dinner',
          items: ['150g chicken', '1 cup dal', '1 cup curd'],
          macros: { protein: 52, carbs: 22, fat: 8, calories: 360 },
        },
      ],
    },
  },
  maintain: {
    economy: {
      macros: { protein: 120, carbs: 220, fat: 55, calories: 1855 },
      meals: [
        {
          time: '7:00 AM', name: 'Breakfast',
          items: ['4 eggs', '3 roti', '1 banana'],
          macros: { protein: 28, carbs: 65, fat: 16, calories: 520 },
        },
        {
          time: '1:00 PM', name: 'Lunch',
          items: ['1 cup rice', '1 cup dal', 'Sabzi', '2 roti'],
          macros: { protein: 22, carbs: 85, fat: 12, calories: 540 },
        },
        {
          time: '5:00 PM', name: 'Pre-Workout',
          items: ['2 roti with peanut butter', '1 cup curd'],
          macros: { protein: 16, carbs: 40, fat: 12, calories: 330 },
        },
        {
          time: '9:00 PM', name: 'Dinner',
          items: ['3 eggs', '1 cup rice', '1 cup dal'],
          macros: { protein: 28, carbs: 55, fat: 12, calories: 440 },
        },
      ],
    },
    standard: {
      macros: { protein: 140, carbs: 235, fat: 60, calories: 2040 },
      meals: [
        {
          time: '7:00 AM', name: 'Breakfast',
          items: ['5 eggs', '75g oats with milk', '1 banana'],
          macros: { protein: 34, carbs: 70, fat: 18, calories: 580 },
        },
        {
          time: '1:00 PM', name: 'Lunch',
          items: ['150g chicken', '1.5 cups rice', '1 cup dal'],
          macros: { protein: 45, carbs: 90, fat: 14, calories: 660 },
        },
        {
          time: '5:00 PM', name: 'Pre-Workout',
          items: ['100g paneer', '2 roti', '1 banana'],
          macros: { protein: 24, carbs: 52, fat: 12, calories: 400 },
        },
        {
          time: '9:00 PM', name: 'Dinner',
          items: ['4 eggs', '1 cup curd', 'Sabzi'],
          macros: { protein: 28, carbs: 20, fat: 14, calories: 320 },
        },
      ],
    },
    premium: {
      macros: { protein: 155, carbs: 245, fat: 65, calories: 2200 },
      meals: [
        {
          time: '7:00 AM', name: 'Breakfast',
          items: ['6 eggs', '100g oats', '200ml milk', '1 banana'],
          macros: { protein: 42, carbs: 78, fat: 20, calories: 660 },
        },
        {
          time: '1:00 PM', name: 'Lunch',
          items: ['200g chicken', '1.5 cups rice', '200g paneer', 'Sabzi'],
          macros: { protein: 60, carbs: 80, fat: 20, calories: 740 },
        },
        {
          time: '5:00 PM', name: 'Pre-Workout',
          items: ['100g sprouts', '2 roti', '30g peanut butter'],
          macros: { protein: 20, carbs: 55, fat: 15, calories: 430 },
        },
        {
          time: '9:00 PM', name: 'Dinner',
          items: ['150g chicken', '1 cup curd', '1 cup dal'],
          macros: { protein: 50, carbs: 25, fat: 9, calories: 380 },
        },
      ],
    },
  },
  general: {
    economy: {
      macros: { protein: 110, carbs: 210, fat: 50, calories: 1730 },
      meals: [
        {
          time: '7:00 AM', name: 'Breakfast',
          items: ['4 eggs', '2 roti', '1 banana', '1 cup curd'],
          macros: { protein: 28, carbs: 60, fat: 14, calories: 480 },
        },
        {
          time: '1:00 PM', name: 'Lunch',
          items: ['1 cup rice', '1 cup dal', 'Sabzi', '2 roti'],
          macros: { protein: 22, carbs: 80, fat: 10, calories: 500 },
        },
        {
          time: '5:00 PM', name: 'Pre-Workout',
          items: ['2 roti', '2 eggs', '1 glass milk'],
          macros: { protein: 22, carbs: 40, fat: 12, calories: 360 },
        },
        {
          time: '9:00 PM', name: 'Dinner',
          items: ['3 eggs', '1 cup rice', 'Sabzi'],
          macros: { protein: 22, carbs: 42, fat: 12, calories: 380 },
        },
      ],
    },
    standard: {
      macros: { protein: 130, carbs: 225, fat: 55, calories: 1915 },
      meals: [
        {
          time: '7:00 AM', name: 'Breakfast',
          items: ['5 eggs', '75g oats', '200ml milk', '1 banana'],
          macros: { protein: 34, carbs: 68, fat: 16, calories: 556 },
        },
        {
          time: '1:00 PM', name: 'Lunch',
          items: ['130g chicken', '1 cup rice', '1 cup dal'],
          macros: { protein: 40, carbs: 80, fat: 12, calories: 580 },
        },
        {
          time: '5:00 PM', name: 'Pre-Workout',
          items: ['100g paneer', '2 roti'],
          macros: { protein: 22, carbs: 38, fat: 12, calories: 360 },
        },
        {
          time: '9:00 PM', name: 'Dinner',
          items: ['4 eggs', '1 cup curd', 'Sabzi'],
          macros: { protein: 28, carbs: 18, fat: 12, calories: 300 },
        },
      ],
    },
    premium: {
      macros: { protein: 148, carbs: 235, fat: 60, calories: 2080 },
      meals: [
        {
          time: '7:00 AM', name: 'Breakfast',
          items: ['6 eggs', '100g oats', '200ml milk', '30g peanut butter', '1 banana'],
          macros: { protein: 44, carbs: 74, fat: 22, calories: 680 },
        },
        {
          time: '1:00 PM', name: 'Lunch',
          items: ['175g chicken', '1.5 cups rice', '200g paneer'],
          macros: { protein: 56, carbs: 85, fat: 18, calories: 730 },
        },
        {
          time: '5:00 PM', name: 'Pre-Workout',
          items: ['1 cup sprouts', '2 roti', '1 banana'],
          macros: { protein: 16, carbs: 58, fat: 8, calories: 370 },
        },
        {
          time: '9:00 PM', name: 'Dinner',
          items: ['130g chicken', '1 cup curd', '1 cup dal'],
          macros: { protein: 44, carbs: 22, fat: 8, calories: 340 },
        },
      ],
    },
  },
};

/**
 * Get the appropriate diet plan
 * @param {string} goal - 'muscle_gain' | 'fat_loss' | 'maintain' | 'general'
 * @param {number} budget - daily budget in Rs (100-400)
 */
export function getDietPlan(goal, budget) {
  const goalKey = goal || 'general';
  let tier = 'economy';
  if (budget > 250) tier = 'premium';
  else if (budget > 150) tier = 'standard';

  const plans = dietTemplates[goalKey] || dietTemplates.general;
  return plans[tier] || plans.standard;
}