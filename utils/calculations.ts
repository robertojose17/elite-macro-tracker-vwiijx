
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

/**
 * Calculate BMR using Mifflin-St Jeor Equation
 * @param weight - Weight in kg
 * @param height - Height in cm
 * @param age - Age in years
 * @param sex - Sex (male/female)
 * @returns BMR in calories
 */
export function calculateBMR(weight: number, height: number, age: number, sex: Sex): number {
  // Mifflin-St Jeor Equation (expects weight in kg, height in cm)
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

/**
 * Calculate goal from onboarding data
 * Note: Onboarding data should already have weight in kg and height in cm
 * @param data - OnboardingData with weight in kg and height in cm
 */
export function calculateGoalFromOnboarding(data: OnboardingData) {
  if (!data.age || !data.height || !data.weight || !data.sex || !data.activity_level || !data.goal_type) {
    throw new Error('Missing required onboarding data');
  }

  console.log('Calculating BMR with:', {
    weight: data.weight,
    height: data.height,
    age: data.age,
    sex: data.sex,
  });

  // Data is already in kg and cm from personal-info screen
  const bmr = calculateBMR(data.weight, data.height, data.age, data.sex);
  console.log('BMR:', bmr);
  
  const tdee = calculateTDEE(bmr, data.activity_level);
  console.log('TDEE:', tdee);
  
  const targetCalories = calculateTargetCalories(tdee, data.goal_type, data.goal_intensity || 1);
  console.log('Target Calories:', targetCalories);
  
  const macros = calculateMacros(
    targetCalories,
    data.weight,
    data.macro_preference || 'balanced',
    data.custom_protein,
    data.custom_carbs,
    data.custom_fats
  );
  console.log('Macros:', macros);

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

/**
 * Convert pounds to kilograms
 */
export function lbsToKg(lbs: number): number {
  return lbs * 0.453592;
}

/**
 * Convert kilograms to pounds
 */
export function kgToLbs(kg: number): number {
  return kg / 0.453592;
}

/**
 * Convert inches to centimeters
 */
export function inchesToCm(inches: number): number {
  return inches * 2.54;
}

/**
 * Convert centimeters to inches
 */
export function cmToInches(cm: number): number {
  return cm / 2.54;
}

/**
 * Convert feet and inches to total centimeters
 */
export function feetInchesToCm(feet: number, inches: number): number {
  const totalInches = feet * 12 + inches;
  return inchesToCm(totalInches);
}

/**
 * Convert centimeters to feet and inches
 */
export function cmToFeetInches(cm: number): { feet: number; inches: number } {
  const totalInches = cmToInches(cm);
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches % 12);
  return { feet, inches };
}
