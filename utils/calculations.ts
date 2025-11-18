
import { Sex, GoalType, ActivityLevel, MacroPreference, OnboardingData } from '@/types';

export function calculateAge(dob: string): number {
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
}

export function calculateBMR(weight: number, height: number, age: number, sex: Sex): number {
  // Mifflin-St Jeor Equation
  if (sex === 'male') {
    return 10 * weight + 6.25 * height - 5 * age + 5;
  } else {
    return 10 * weight + 6.25 * height - 5 * age - 161;
  }
}

export function getActivityMultiplier(activity: ActivityLevel): number {
  const multipliers = {
    sedentary: 1.2,
    light: 1.375,
    moderate: 1.55,
    active: 1.725,
    very_active: 1.9,
  };
  return multipliers[activity];
}

export function calculateTDEE(bmr: number, activity: ActivityLevel): number {
  return Math.round(bmr * getActivityMultiplier(activity));
}

export function calculateTargetCalories(
  tdee: number,
  goalType: GoalType,
  intensity: number = 1
): number {
  if (goalType === 'lose') {
    return Math.round(tdee - 500 * intensity);
  } else if (goalType === 'gain') {
    return Math.round(tdee + 300 * intensity);
  }
  return tdee;
}

export function calculateMacros(
  targetCalories: number,
  weight: number,
  preference: MacroPreference,
  customProtein?: number,
  customCarbs?: number,
  customFats?: number
) {
  if (preference === 'custom' && customProtein && customCarbs && customFats) {
    return {
      protein: customProtein,
      carbs: customCarbs,
      fats: customFats,
      fiber: Math.round(targetCalories / 1000 * 14),
    };
  }

  let proteinGPerKg = 2.0;
  let fatPercentage = 0.25;

  if (preference === 'high_protein') {
    proteinGPerKg = 2.2;
    fatPercentage = 0.25;
  } else if (preference === 'balanced') {
    proteinGPerKg = 1.8;
    fatPercentage = 0.30;
  }

  const protein = Math.round(weight * proteinGPerKg);
  const proteinCalories = protein * 4;

  const fats = Math.round((targetCalories * fatPercentage) / 9);
  const fatCalories = fats * 9;

  const remainingCalories = targetCalories - proteinCalories - fatCalories;
  const carbs = Math.round(remainingCalories / 4);

  const fiber = Math.round(targetCalories / 1000 * 14);

  return { protein, carbs, fats, fiber };
}

export function calculateGoalFromOnboarding(data: OnboardingData) {
  if (!data.age || !data.height || !data.weight || !data.sex || !data.activity_level || !data.goal_type) {
    throw new Error('Missing required onboarding data');
  }

  const bmr = calculateBMR(data.weight, data.height, data.age, data.sex);
  const tdee = calculateTDEE(bmr, data.activity_level);
  const targetCalories = calculateTargetCalories(tdee, data.goal_type, data.goal_intensity || 1);
  const macros = calculateMacros(
    targetCalories,
    data.weight,
    data.macro_preference || 'balanced',
    data.custom_protein,
    data.custom_carbs,
    data.custom_fats
  );

  return {
    daily_calories: targetCalories,
    protein_g: macros.protein,
    carbs_g: macros.carbs,
    fats_g: macros.fats,
    fiber_g: macros.fiber,
  };
}

export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

export function getTodayString(): string {
  return formatDate(new Date());
}
