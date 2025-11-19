
/**
 * AI Meal Estimator Utility
 * 
 * This utility calls a Supabase Edge Function to estimate nutritional information
 * from a meal description and optional photo using Hugging Face's Llama 3.2 model.
 * 
 * AI Model: Hugging Face - meta-llama/Llama-3.2-3B-Instruct
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
 * Estimate meal nutrition using Supabase Edge Function with Hugging Face AI
 * 
 * AI Model: Hugging Face - meta-llama/Llama-3.2-3B-Instruct
 */
export async function estimateMealWithAI(
  description: string,
  imageUri: string | null = null
): Promise<EstimationResult> {
  console.log('[AI Estimator] Starting estimation...');
  console.log('[AI Estimator] Description:', description);
  console.log('[AI Estimator] Has image:', !!imageUri);
  console.log('[AI Estimator] AI Model: Hugging Face - meta-llama/Llama-3.2-3B-Instruct');

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

    console.log('[AI Estimator] Response received');
    console.log('[AI Estimator] Error:', error);
    console.log('[AI Estimator] Data:', data);

    if (error) {
      console.error('[AI Estimator] Edge Function error:', error);
      
      // Parse error message from response
      let errorMessage = error.message || 'Unknown error';
      
      // Try to extract error from context if available
      if (error.context) {
        try {
          const contextData = typeof error.context === 'string' 
            ? JSON.parse(error.context) 
            : error.context;
          
          if (contextData.error) {
            errorMessage = contextData.error;
          }
        } catch (e) {
          console.error('[AI Estimator] Failed to parse error context:', e);
        }
      }
      
      // Handle specific error cases
      if (errorMessage.includes('not configured') || errorMessage.includes('API key')) {
        throw new Error(
          '⚠️ AI service not configured!\n\n' +
          'The Hugging Face API key may be missing or invalid. Please contact support.'
        );
      }
      
      if (errorMessage.includes('Model is loading') || errorMessage.includes('503')) {
        throw new Error(
          '🔄 AI model is warming up...\n\n' +
          'The Hugging Face model needs 10-20 seconds to start. Please wait a moment and try again.\n\n' +
          'This only happens on the first request after a period of inactivity.'
        );
      }
      
      if (errorMessage.includes('Rate limit') || errorMessage.includes('429')) {
        throw new Error('⏱️ Too many requests. Please wait a moment and try again.');
      }
      
      if (errorMessage.includes('timeout') || errorMessage.includes('504')) {
        throw new Error(
          '⏱️ Request timeout.\n\n' +
          'The AI model is taking too long to respond. This can happen when the model is cold-starting.\n\n' +
          'Please try again in a few seconds.'
        );
      }

      if (errorMessage.includes('502') || errorMessage.includes('Bad Gateway')) {
        throw new Error(
          '🔧 Service temporarily unavailable.\n\n' +
          'The AI service encountered an error. This usually resolves itself.\n\n' +
          'Please try again in a moment.'
        );
      }
      
      throw new Error(errorMessage || 'AI estimation failed. Please try again or log manually.');
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
    console.log('[AI Estimator] AI Model:', data.aiModel || 'Hugging Face - meta-llama/Llama-3.2-3B-Instruct');
    
    return data as EstimationResult;
  } catch (error: any) {
    console.error('[AI Estimator] Error:', error);
    
    if (error.message) {
      throw error;
    }
    
    throw new Error('AI estimation is temporarily unavailable. Please try again or log manually.');
  }
}
