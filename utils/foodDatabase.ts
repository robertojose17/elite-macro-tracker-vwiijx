
/**
 * Internal Food Database Management
 * Handles local storage and caching of foods
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { Food } from '@/types';
import { mockFoods } from '@/data/mockData';

const FOODS_STORAGE_KEY = '@elite_macro_foods';

/**
 * Initialize food database with mock data
 */
export async function initializeFoodDatabase(): Promise<void> {
  try {
    const existing = await AsyncStorage.getItem(FOODS_STORAGE_KEY);
    if (!existing) {
      console.log('[FoodDB] Initializing with mock data');
      await AsyncStorage.setItem(FOODS_STORAGE_KEY, JSON.stringify(mockFoods));
    }
  } catch (error) {
    console.error('[FoodDB] Error initializing database:', error);
  }
}

/**
 * Get all foods from internal database
 */
export async function getAllFoods(): Promise<Food[]> {
  try {
    const data = await AsyncStorage.getItem(FOODS_STORAGE_KEY);
    if (data) {
      return JSON.parse(data);
    }
    return mockFoods;
  } catch (error) {
    console.error('[FoodDB] Error getting all foods:', error);
    return mockFoods;
  }
}

/**
 * Find food by barcode in internal database
 */
export async function findFoodByBarcode(barcode: string): Promise<Food | null> {
  try {
    console.log(`[FoodDB] Searching for barcode: ${barcode}`);
    const foods = await getAllFoods();
    const found = foods.find(food => food.barcode === barcode);
    
    if (found) {
      console.log(`[FoodDB] Found food: ${found.name}`);
    } else {
      console.log(`[FoodDB] No food found for barcode: ${barcode}`);
    }
    
    return found || null;
  } catch (error) {
    console.error('[FoodDB] Error finding food by barcode:', error);
    return null;
  }
}

/**
 * Search foods by name or brand in internal database
 */
export async function searchInternalFoods(query: string): Promise<Food[]> {
  try {
    console.log(`[FoodDB] Searching internal foods: ${query}`);
    const foods = await getAllFoods();
    const lowerQuery = query.toLowerCase();
    
    const results = foods.filter(food => 
      food.name.toLowerCase().includes(lowerQuery) ||
      (food.brand && food.brand.toLowerCase().includes(lowerQuery))
    );
    
    console.log(`[FoodDB] Found ${results.length} internal results`);
    return results;
  } catch (error) {
    console.error('[FoodDB] Error searching internal foods:', error);
    return [];
  }
}

/**
 * Insert or update food in internal database
 */
export async function upsertFood(food: Partial<Food>): Promise<Food> {
  try {
    const foods = await getAllFoods();
    
    // Check if food already exists (by barcode or id)
    const existingIndex = foods.findIndex(f => 
      (food.id && f.id === food.id) || 
      (food.barcode && f.barcode === food.barcode)
    );
    
    let savedFood: Food;
    
    if (existingIndex >= 0) {
      // Update existing food
      console.log(`[FoodDB] Updating existing food: ${food.name}`);
      savedFood = { ...foods[existingIndex], ...food } as Food;
      foods[existingIndex] = savedFood;
    } else {
      // Insert new food
      console.log(`[FoodDB] Inserting new food: ${food.name}`);
      savedFood = {
        id: food.id || `food-${Date.now()}`,
        name: food.name || 'Unknown',
        serving_amount: food.serving_amount || 100,
        serving_unit: food.serving_unit || 'g',
        calories: food.calories || 0,
        protein: food.protein || 0,
        carbs: food.carbs || 0,
        fats: food.fats || 0,
        fiber: food.fiber || 0,
        user_created: food.user_created || false,
        is_favorite: food.is_favorite || false,
        ...food,
      } as Food;
      foods.push(savedFood);
    }
    
    await AsyncStorage.setItem(FOODS_STORAGE_KEY, JSON.stringify(foods));
    console.log(`[FoodDB] Food saved successfully: ${savedFood.id}`);
    
    return savedFood;
  } catch (error) {
    console.error('[FoodDB] Error upserting food:', error);
    throw error;
  }
}

/**
 * Get food by ID from internal database
 */
export async function getFoodById(id: string): Promise<Food | null> {
  try {
    const foods = await getAllFoods();
    return foods.find(food => food.id === id) || null;
  } catch (error) {
    console.error('[FoodDB] Error getting food by ID:', error);
    return null;
  }
}

/**
 * Get recent foods (last 10 used)
 */
export async function getRecentFoods(): Promise<Food[]> {
  try {
    const foods = await getAllFoods();
    // In a real app, this would track usage history
    // For now, return first 10 foods
    return foods.slice(0, 10);
  } catch (error) {
    console.error('[FoodDB] Error getting recent foods:', error);
    return [];
  }
}

/**
 * Get favorite foods
 */
export async function getFavoriteFoods(): Promise<Food[]> {
  try {
    const foods = await getAllFoods();
    return foods.filter(food => food.is_favorite);
  } catch (error) {
    console.error('[FoodDB] Error getting favorite foods:', error);
    return [];
  }
}
