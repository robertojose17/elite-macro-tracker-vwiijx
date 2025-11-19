
/**
 * AI Meal Estimator Utility
 * 
 * This utility calls a backend API endpoint to estimate nutritional information
 * from a meal description and optional photo.
 * 
 * The backend can use any LLM provider (Hugging Face, OpenAI, etc.)
 * without exposing API keys to the mobile app.
 */

interface EstimatedItem {
  name: string;
  serving_description: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fats_g: number;
  fiber_g: number;
}

interface EstimationResult {
  assumptions: string;
  items: EstimatedItem[];
  totals: {
    calories: number;
    protein_g: number;
    carbs_g: number;
    fats_g: number;
    fiber_g: number;
  };
}

// IMPORTANT: Replace this with your actual backend API endpoint
// Options:
// 1. Supabase Edge Function: https://your-project.supabase.co/functions/v1/ai-meal-estimate
// 2. Your own backend server: https://your-api.com/api/ai-meal-estimate
// 3. For development/testing: Use the mock endpoint below
const API_ENDPOINT = 'https://your-backend-api.com/api/ai-meal-estimate';

// Set this to true to use mock data for testing (no backend required)
const USE_MOCK_DATA = true;

/**
 * Mock estimation for testing without a backend
 */
function getMockEstimation(description: string): EstimationResult {
  console.log('[AI Estimator] Using mock data for testing');
  
  // Simple mock based on common keywords
  const items: EstimatedItem[] = [];
  const lowerDesc = description.toLowerCase();
  
  if (lowerDesc.includes('egg')) {
    items.push({
      name: 'Scrambled Eggs',
      serving_description: '2 large eggs',
      calories: 140,
      protein_g: 12,
      carbs_g: 2,
      fats_g: 10,
      fiber_g: 0,
    });
  }
  
  if (lowerDesc.includes('toast') || lowerDesc.includes('bread')) {
    items.push({
      name: 'Whole Wheat Toast',
      serving_description: '1 slice',
      calories: 80,
      protein_g: 4,
      carbs_g: 14,
      fats_g: 1,
      fiber_g: 2,
    });
  }
  
  if (lowerDesc.includes('banana')) {
    items.push({
      name: 'Banana',
      serving_description: '1 medium',
      calories: 105,
      protein_g: 1,
      carbs_g: 27,
      fats_g: 0,
      fiber_g: 3,
    });
  }
  
  if (lowerDesc.includes('chicken')) {
    items.push({
      name: 'Grilled Chicken Breast',
      serving_description: '4 oz',
      calories: 185,
      protein_g: 35,
      carbs_g: 0,
      fats_g: 4,
      fiber_g: 0,
    });
  }
  
  if (lowerDesc.includes('rice')) {
    items.push({
      name: 'White Rice',
      serving_description: '1 cup cooked',
      calories: 205,
      protein_g: 4,
      carbs_g: 45,
      fats_g: 0,
      fiber_g: 1,
    });
  }
  
  if (lowerDesc.includes('salad')) {
    items.push({
      name: 'Mixed Green Salad',
      serving_description: '2 cups',
      calories: 20,
      protein_g: 2,
      carbs_g: 4,
      fats_g: 0,
      fiber_g: 2,
    });
  }
  
  // If no items matched, provide a generic meal
  if (items.length === 0) {
    items.push({
      name: 'Mixed Meal',
      serving_description: '1 serving',
      calories: 400,
      protein_g: 20,
      carbs_g: 45,
      fats_g: 15,
      fiber_g: 5,
    });
  }
  
  // Calculate totals
  const totals = items.reduce(
    (acc, item) => ({
      calories: acc.calories + item.calories,
      protein_g: acc.protein_g + item.protein_g,
      carbs_g: acc.carbs_g + item.carbs_g,
      fats_g: acc.fats_g + item.fats_g,
      fiber_g: acc.fiber_g + item.fiber_g,
    }),
    { calories: 0, protein_g: 0, carbs_g: 0, fats_g: 0, fiber_g: 0 }
  );
  
  return {
    assumptions: 'Mock estimation based on common food keywords. For accurate results, please configure a backend API endpoint.',
    items,
    totals,
  };
}

/**
 * Convert image URI to base64 data URL
 */
async function imageUriToBase64(uri: string): Promise<string> {
  try {
    const response = await fetch(uri);
    const blob = await response.blob();
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64data = reader.result as string;
        resolve(base64data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('[AI Estimator] Error converting image to base64:', error);
    throw new Error('Failed to process image');
  }
}

/**
 * Estimate meal nutrition using backend API
 */
export async function estimateMealWithAI(
  description: string,
  imageUri: string | null = null
): Promise<EstimationResult> {
  console.log('[AI Estimator] Starting estimation...');
  console.log('[AI Estimator] Description:', description);
  console.log('[AI Estimator] Has image:', !!imageUri);

  // Use mock data if enabled (for testing without backend)
  if (USE_MOCK_DATA) {
    console.log('[AI Estimator] Mock mode enabled - returning test data');
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    return getMockEstimation(description);
  }

  // Check if API endpoint is configured
  if (!API_ENDPOINT || API_ENDPOINT === 'https://your-backend-api.com/api/ai-meal-estimate') {
    throw new Error(
      'Backend API endpoint not configured. Please set up your backend API or enable mock mode for testing. See utils/aiMealEstimator.ts for instructions.'
    );
  }

  try {
    // Prepare request body
    const requestBody: any = {
      userDescription: description,
    };

    // Add image if provided
    if (imageUri) {
      console.log('[AI Estimator] Converting image to base64...');
      const base64Image = await imageUriToBase64(imageUri);
      requestBody.optionalPhotoInfo = base64Image;
    }

    // Call backend API
    console.log('[AI Estimator] Calling backend API...');
    const response = await fetch(API_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[AI Estimator] API error:', errorText);
      
      if (response.status === 503 || response.status === 500) {
        throw new Error('AI estimation is temporarily unavailable. Please try again or log manually.');
      } else if (response.status === 429) {
        throw new Error('Too many requests. Please wait a moment and try again.');
      } else {
        throw new Error('AI estimation failed. Please try again or log manually.');
      }
    }

    const data = await response.json();
    console.log('[AI Estimator] API response received');

    // Validate the response structure
    if (!data.assumptions || !data.items || !Array.isArray(data.items) || !data.totals) {
      console.error('[AI Estimator] Invalid response structure:', data);
      throw new Error('Invalid response from AI service. Please try again.');
    }

    // Validate each item
    for (const item of data.items) {
      if (
        !item.name ||
        !item.serving_description ||
        typeof item.calories !== 'number' ||
        typeof item.protein_g !== 'number' ||
        typeof item.carbs_g !== 'number' ||
        typeof item.fats_g !== 'number' ||
        typeof item.fiber_g !== 'number'
      ) {
        console.error('[AI Estimator] Invalid item structure:', item);
        throw new Error('Invalid item data from AI service. Please try again.');
      }
    }

    console.log('[AI Estimator] Estimation successful');
    console.log('[AI Estimator] Items:', data.items.length);
    
    return data as EstimationResult;
  } catch (error: any) {
    console.error('[AI Estimator] Error:', error);
    
    if (error.message) {
      throw error;
    }
    
    throw new Error('AI estimation is temporarily unavailable. Please try again or log manually.');
  }
}
