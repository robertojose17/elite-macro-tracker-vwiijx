
/**
 * AI Meal Estimator Utility
 * 
 * This utility calls a Supabase Edge Function to estimate nutritional information
 * from a meal description and optional photo using a free AI provider (Hugging Face).
 * 
 * Setup Instructions:
 * 1. Enable Supabase in Natively
 * 2. Get a free Hugging Face API token from https://huggingface.co/settings/tokens
 * 3. Deploy the Edge Function (code provided separately)
 * 4. Set your Hugging Face token: supabase secrets set HUGGINGFACE_API_KEY=your_token_here
 * 5. Update SUPABASE_URL and SUPABASE_ANON_KEY below with your project details
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
  aiModel?: string;
}

// TODO: Replace these with your Supabase project details after enabling Supabase
const SUPABASE_URL = 'YOUR_SUPABASE_URL'; // e.g., 'https://xxxxx.supabase.co'
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

// Edge Function endpoint
const getEdgeFunctionUrl = () => {
  if (SUPABASE_URL === 'YOUR_SUPABASE_URL') {
    return null;
  }
  return `${SUPABASE_URL}/functions/v1/ai-meal-estimate`;
};

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
 * Estimate meal nutrition using Supabase Edge Function with free AI provider
 */
export async function estimateMealWithAI(
  description: string,
  imageUri: string | null = null
): Promise<EstimationResult> {
  console.log('[AI Estimator] Starting estimation...');
  console.log('[AI Estimator] Description:', description);
  console.log('[AI Estimator] Has image:', !!imageUri);

  const edgeFunctionUrl = getEdgeFunctionUrl();

  // Check if Supabase is configured
  if (!edgeFunctionUrl) {
    throw new Error(
      '⚠️ Supabase not configured!\n\n' +
      'To use the AI Meal Estimator:\n' +
      '1. Enable Supabase in Natively\n' +
      '2. Get a free Hugging Face API token\n' +
      '3. Deploy the Edge Function\n' +
      '4. Update SUPABASE_URL and SUPABASE_ANON_KEY in utils/aiMealEstimator.ts\n\n' +
      'See the comments in utils/aiMealEstimator.ts for detailed instructions.'
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

    // Call Supabase Edge Function
    console.log('[AI Estimator] Calling Supabase Edge Function...');
    const response = await fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
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
      } else if (response.status === 401) {
        throw new Error('Authentication failed. Please check your Supabase configuration.');
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
    console.log('[AI Estimator] AI Model:', data.aiModel || 'Unknown');
    
    return data as EstimationResult;
  } catch (error: any) {
    console.error('[AI Estimator] Error:', error);
    
    if (error.message) {
      throw error;
    }
    
    throw new Error('AI estimation is temporarily unavailable. Please try again or log manually.');
  }
}
