
/**
 * AI Meal Estimator Utility
 * 
 * This utility calls a Supabase Edge Function to estimate nutritional information
 * from a meal description and optional photo using Hugging Face's Llama 3.2 model.
 * 
 * The Hugging Face API key is embedded in the Edge Function for your convenience.
 * The Edge Function 'ai-meal-estimate' has been deployed and is ready to use.
 */

import { supabase } from '@/app/integrations/supabase/client';

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
 * Estimate meal nutrition using Supabase Edge Function with OpenAI
 */
export async function estimateMealWithAI(
  description: string,
  imageUri: string | null = null
): Promise<EstimationResult> {
  console.log('[AI Estimator] Starting estimation...');
  console.log('[AI Estimator] Description:', description);
  console.log('[AI Estimator] Has image:', !!imageUri);

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
    const { data, error } = await supabase.functions.invoke('ai-meal-estimate', {
      body: requestBody,
    });

    if (error) {
      console.error('[AI Estimator] Edge Function error:', error);
      
      // Handle specific error cases
      if (error.message?.includes('not configured')) {
        throw new Error(
          '⚠️ AI service not configured!\n\n' +
          'Please contact support if this issue persists.'
        );
      }
      
      if (error.message?.includes('Model is loading')) {
        throw new Error('AI model is warming up. Please wait a few seconds and try again.');
      }
      
      if (error.message?.includes('Rate limit')) {
        throw new Error('Too many requests. Please wait a moment and try again.');
      }
      
      throw new Error(error.message || 'AI estimation failed. Please try again or log manually.');
    }

    if (!data) {
      throw new Error('No response from AI service. Please try again.');
    }

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
