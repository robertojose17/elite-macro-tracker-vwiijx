
/**
 * FoodData Central (FDC) API Integration
 * USDA's official food database with high-quality nutrition data
 */

import Constants from 'expo-constants';

export interface FDCFood {
  fdcId: number;
  description: string;
  dataType: string; // 'Branded', 'Foundation', 'Survey (FNDDS)', 'SR Legacy'
  brandOwner?: string;
  brandName?: string;
  gtinUpc?: string;
  servingSize?: number;
  servingSizeUnit?: string;
  householdServingFullText?: string;
  labelNutrients?: {
    fat?: { value: number };
    saturatedFat?: { value: number };
    transFat?: { value: number };
    cholesterol?: { value: number };
    sodium?: { value: number };
    carbohydrates?: { value: number };
    fiber?: { value: number };
    sugars?: { value: number };
    protein?: { value: number };
    calcium?: { value: number };
    iron?: { value: number };
    potassium?: { value: number };
    calories?: { value: number };
  };
  foodNutrients?: Array<{
    nutrientId: number;
    nutrientName: string;
    nutrientNumber: string;
    unitName: string;
    value: number;
  }>;
}

export interface FDCSearchResult {
  totalHits: number;
  currentPage: number;
  totalPages: number;
  foods: FDCFood[];
}

export interface ServingSizeInfo {
  description: string; // e.g., "1 cup", "2 slices", "1 bar"
  grams: number; // gram equivalent
  displayText: string; // e.g., "1 cup (240 g)", "2 slices (28 g)"
  hasValidGrams: boolean; // true if grams were successfully parsed
}

/**
 * Get FDC API key from environment
 * User should set this in their environment variables
 */
function getFDCApiKey(): string {
  // Try multiple sources for the API key
  let apiKey: string | undefined;
  
  // 1. Try expo-constants (recommended for Expo)
  try {
    apiKey = Constants.expoConfig?.extra?.fdcApiKey;
  } catch (e) {
    console.log('[FDC] Could not read from Constants.expoConfig');
  }
  
  // 2. Try process.env (for web/Node environments)
  if (!apiKey && typeof process !== 'undefined' && process.env) {
    apiKey = process.env.EXPO_PUBLIC_FDC_API_KEY || process.env.FDC_API_KEY;
  }
  
  // 3. Try global environment (for some bundlers)
  if (!apiKey && typeof global !== 'undefined' && (global as any).EXPO_PUBLIC_FDC_API_KEY) {
    apiKey = (global as any).EXPO_PUBLIC_FDC_API_KEY;
  }
  
  if (!apiKey) {
    console.warn('[FDC] ⚠️ No API key found. Using DEMO_KEY with limited requests.');
    console.warn('[FDC] To fix: Add fdcApiKey to app.json extra config or set EXPO_PUBLIC_FDC_API_KEY');
    return 'DEMO_KEY';
  }
  
  console.log('[FDC] ✓ API key loaded successfully');
  return apiKey;
}

/**
 * Extract serving size information from FDC food data
 * Returns the serving description and gram equivalent
 * NEVER throws errors or blocks - always returns a valid ServingSizeInfo
 */
export function extractServingSize(food: FDCFood): ServingSizeInfo {
  console.log('[FDC] extractServingSize called with:', {
    fdcId: food.fdcId,
    description: food.description,
    servingSize: food.servingSize,
    servingSizeUnit: food.servingSizeUnit,
    householdServingFullText: food.householdServingFullText,
  });

  // Default to 100g if no serving info available
  const defaultServing: ServingSizeInfo = {
    description: '100 g',
    grams: 100,
    displayText: '100 g (no serving size provided)',
    hasValidGrams: false,
  };

  try {
    // Priority 1: householdServingFullText (e.g., "1 cup", "2 slices", "1 bar")
    if (food.householdServingFullText && typeof food.householdServingFullText === 'string') {
      const householdText = food.householdServingFullText.trim();
      
      if (householdText.length > 0) {
        console.log('[FDC] Using householdServingFullText:', householdText);
        
        // Try to extract grams from the text if present
        const gramsMatch = householdText.match(/(\d+\.?\d*)\s*g/i);
        let grams = food.servingSize || 100;
        
        if (gramsMatch) {
          grams = parseFloat(gramsMatch[1]);
          console.log('[FDC] Extracted grams from household text:', grams);
        } else if (food.servingSize && food.servingSizeUnit?.toLowerCase() === 'g') {
          grams = food.servingSize;
          console.log('[FDC] Using servingSize for grams:', grams);
        }
        
        // Clean up the household text (remove grams if already present)
        const cleanText = householdText.replace(/\s*\(\d+\.?\d*\s*g\)/i, '').trim();
        
        return {
          description: cleanText,
          grams: grams,
          displayText: `${cleanText} (${Math.round(grams)} g)`,
          hasValidGrams: true,
        };
      }
    }

    // Priority 2: servingSize + servingSizeUnit (e.g., 30 g, 240 ml)
    if (food.servingSize && food.servingSizeUnit) {
      const unit = food.servingSizeUnit.toLowerCase();
      
      console.log('[FDC] Using servingSize + servingSizeUnit:', food.servingSize, unit);
      
      // If unit is grams, use directly
      if (unit === 'g' || unit === 'grams') {
        return {
          description: `${Math.round(food.servingSize)} g`,
          grams: food.servingSize,
          displayText: `${Math.round(food.servingSize)} g`,
          hasValidGrams: true,
        };
      }
      
      // For other units (ml, oz, etc.), try to estimate grams
      // This is approximate - ideally we'd have conversion tables
      let estimatedGrams = food.servingSize;
      
      if (unit === 'ml' || unit === 'milliliters') {
        // Assume water density (1 ml ≈ 1 g) as approximation
        estimatedGrams = food.servingSize;
      } else if (unit === 'oz' || unit === 'ounces') {
        // 1 oz ≈ 28.35 g
        estimatedGrams = food.servingSize * 28.35;
      } else if (unit === 'lb' || unit === 'pounds') {
        // 1 lb ≈ 453.6 g
        estimatedGrams = food.servingSize * 453.6;
      }
      
      return {
        description: `${food.servingSize} ${unit}`,
        grams: estimatedGrams,
        displayText: `${food.servingSize} ${unit} (${Math.round(estimatedGrams)} g)`,
        hasValidGrams: true,
      };
    }

    // Priority 3: Default to 100g
    console.log('[FDC] No serving info found, using default 100g');
    return defaultServing;
  } catch (error) {
    console.error('[FDC] Error parsing serving size:', error);
    return defaultServing;
  }
}

/**
 * Extract nutrition data from FDC food
 * Returns calories and macros per 100g
 */
export function extractNutrition(food: FDCFood): {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  sugars: number;
} {
  console.log('[FDC] Extracting nutrition for:', food.description);

  let calories = 0;
  let protein = 0;
  let carbs = 0;
  let fat = 0;
  let fiber = 0;
  let sugars = 0;

  try {
    // Priority 1: Use labelNutrients (for branded foods)
    if (food.labelNutrients) {
      console.log('[FDC] Using labelNutrients');
      
      calories = food.labelNutrients.calories?.value || 0;
      protein = food.labelNutrients.protein?.value || 0;
      carbs = food.labelNutrients.carbohydrates?.value || 0;
      fat = food.labelNutrients.fat?.value || 0;
      fiber = food.labelNutrients.fiber?.value || 0;
      sugars = food.labelNutrients.sugars?.value || 0;
    }
    // Priority 2: Use foodNutrients array (for foundation/survey foods)
    else if (food.foodNutrients && Array.isArray(food.foodNutrients)) {
      console.log('[FDC] Using foodNutrients array');
      
      for (const nutrient of food.foodNutrients) {
        const name = nutrient.nutrientName.toLowerCase();
        const value = nutrient.value || 0;
        
        // Map nutrient names to our fields
        if (name.includes('energy') || name.includes('calorie')) {
          // Convert kcal to calories if needed
          if (nutrient.unitName.toLowerCase() === 'kcal') {
            calories = value;
          } else if (nutrient.unitName.toLowerCase() === 'kj') {
            // Convert kJ to kcal (1 kcal ≈ 4.184 kJ)
            calories = value / 4.184;
          }
        } else if (name.includes('protein')) {
          protein = value;
        } else if (name.includes('carbohydrate')) {
          carbs = value;
        } else if (name.includes('total lipid') || name.includes('fat')) {
          fat = value;
        } else if (name.includes('fiber')) {
          fiber = value;
        } else if (name.includes('sugars')) {
          sugars = value;
        }
      }
    }

    console.log('[FDC] Extracted nutrition:', { calories, protein, carbs, fat, fiber, sugars });
  } catch (error) {
    console.error('[FDC] Error extracting nutrition:', error);
  }

  return { calories, protein, carbs, fat, fiber, sugars };
}

/**
 * Search foods by text query from FoodData Central
 * NEVER throws errors - always returns null on failure
 */
export async function searchFoods(
  query: string,
  page: number = 1,
  pageSize: number = 20
): Promise<FDCSearchResult | null> {
  const apiKey = getFDCApiKey();
  
  console.log(`[FDC] 🔍 Searching foods: "${query}"`);
  console.log(`[FDC] 📱 Platform: ${typeof navigator !== 'undefined' ? 'mobile/web' : 'native'}`);
  console.log(`[FDC] 🔑 API Key: ${apiKey.substring(0, 8)}...`);

  try {
    const requestBody = {
      query: query,
      dataType: ['Branded', 'Foundation', 'Survey (FNDDS)'],
      pageSize: pageSize,
      pageNumber: page,
      sortBy: 'dataType.keyword',
      sortOrder: 'asc',
      api_key: apiKey,
    };

    console.log('[FDC] 📤 Sending request to FDC API...');
    console.log('[FDC] Request body:', JSON.stringify(requestBody, null, 2));

    const response = await fetch('https://api.nal.usda.gov/fdc/v1/foods/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    console.log(`[FDC] 📥 Response status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[FDC] ❌ Search failed with status: ${response.status}`);
      console.error(`[FDC] Error response:`, errorText);
      return null;
    }

    const data = await response.json();
    console.log(`[FDC] ✅ Found ${data.totalHits} foods`);
    console.log(`[FDC] Returned ${data.foods?.length || 0} results in this page`);

    return {
      totalHits: data.totalHits || 0,
      currentPage: data.currentPage || page,
      totalPages: data.totalPages || 1,
      foods: data.foods || [],
    };
  } catch (error) {
    console.error('[FDC] ❌ Error searching foods:', error);
    if (error instanceof Error) {
      console.error('[FDC] Error message:', error.message);
      console.error('[FDC] Error stack:', error.stack);
    }
    return null;
  }
}

/**
 * Fetch food details by FDC ID
 * NEVER throws errors - always returns null on failure
 */
export async function fetchFoodById(fdcId: number): Promise<FDCFood | null> {
  const apiKey = getFDCApiKey();
  
  console.log(`[FDC] 🔍 Fetching food by ID: ${fdcId}`);

  try {
    const url = `https://api.nal.usda.gov/fdc/v1/food/${fdcId}?api_key=${apiKey}`;
    console.log('[FDC] 📤 Request URL:', url);

    const response = await fetch(url);

    console.log(`[FDC] 📥 Response status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[FDC] ❌ Food not found for ID: ${fdcId}`);
      console.error(`[FDC] Error response:`, errorText);
      return null;
    }

    const data = await response.json();
    console.log(`[FDC] ✅ Food found:`, data.description);
    return data;
  } catch (error) {
    console.error('[FDC] ❌ Error fetching food by ID:', error);
    if (error instanceof Error) {
      console.error('[FDC] Error message:', error.message);
    }
    return null;
  }
}

/**
 * Search foods by barcode (UPC/GTIN)
 * Uses the search endpoint with the barcode as query
 * Prioritizes branded foods
 * NEVER throws errors - always returns null on failure
 */
export async function searchByBarcode(barcode: string): Promise<FDCFood | null> {
  const apiKey = getFDCApiKey();
  
  console.log(`[FDC] 📷 Searching by barcode: ${barcode}`);
  console.log(`[FDC] 📱 Platform: ${typeof navigator !== 'undefined' ? 'mobile/web' : 'native'}`);
  console.log(`[FDC] 🔑 API Key: ${apiKey.substring(0, 8)}...`);

  try {
    // Search using the barcode as query
    const requestBody = {
      query: barcode,
      dataType: ['Branded'],
      pageSize: 10,
      pageNumber: 1,
      api_key: apiKey,
    };

    console.log('[FDC] 📤 Sending barcode request to FDC API...');
    console.log('[FDC] Request body:', JSON.stringify(requestBody, null, 2));

    const response = await fetch('https://api.nal.usda.gov/fdc/v1/foods/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    console.log(`[FDC] 📥 Response status: ${response.status} ${response.statusText}`);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[FDC] ❌ Barcode search failed with status: ${response.status}`);
      console.error(`[FDC] Error response:`, errorText);
      return null;
    }

    const data = await response.json();
    
    console.log(`[FDC] Found ${data.totalHits} total hits for barcode`);
    console.log(`[FDC] Returned ${data.foods?.length || 0} branded foods`);
    
    if (!data.foods || data.foods.length === 0) {
      console.log(`[FDC] ⚠️ No branded foods found for barcode: ${barcode}`);
      console.log(`[FDC] Trying foundation foods as fallback...`);
      
      // Try searching foundation foods as fallback
      const foundationResponse = await fetch('https://api.nal.usda.gov/fdc/v1/foods/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          query: barcode,
          dataType: ['Foundation', 'Survey (FNDDS)'],
          pageSize: 10,
          pageNumber: 1,
          api_key: apiKey,
        }),
      });

      if (foundationResponse.ok) {
        const foundationData = await foundationResponse.json();
        console.log(`[FDC] Foundation search returned ${foundationData.foods?.length || 0} results`);
        
        if (foundationData.foods && foundationData.foods.length > 0) {
          console.log(`[FDC] ✅ Found foundation food for barcode:`, foundationData.foods[0].description);
          return foundationData.foods[0];
        }
      }
      
      console.log(`[FDC] ❌ No foods found for barcode: ${barcode}`);
      return null;
    }

    // Find the best match - prioritize exact UPC match
    let bestMatch = data.foods[0];
    
    for (const food of data.foods) {
      if (food.gtinUpc === barcode) {
        console.log(`[FDC] ✅ Found exact UPC match:`, food.description);
        bestMatch = food;
        break;
      }
    }

    console.log(`[FDC] ✅ Returning food:`, bestMatch.description);
    return bestMatch;
  } catch (error) {
    console.error('[FDC] ❌ Error searching by barcode:', error);
    if (error instanceof Error) {
      console.error('[FDC] Error message:', error.message);
      console.error('[FDC] Error stack:', error.stack);
    }
    return null;
  }
}

/**
 * Map FDC food to internal Food format
 */
export function mapFDCToFood(food: FDCFood): any {
  const nutrition = extractNutrition(food);
  const serving = extractServingSize(food);

  return {
    name: food.description || 'Unknown Product',
    brand: food.brandOwner || food.brandName || undefined,
    serving_amount: serving.grams,
    serving_unit: 'g',
    calories: nutrition.calories,
    protein: nutrition.protein,
    carbs: nutrition.carbs,
    fats: nutrition.fat,
    fiber: nutrition.fiber,
    barcode: food.gtinUpc || undefined,
    user_created: false,
    is_favorite: false,
    fdc_id: food.fdcId,
    data_type: food.dataType,
  };
}
