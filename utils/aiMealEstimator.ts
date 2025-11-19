
/**
 * AI Meal Estimator Utility
 * 
 * This utility calls OpenAI's API directly to estimate nutritional information
 * from a meal description and optional photo.
 */

const OPENAI_API_KEY = 'YOUR_OPENAI_API_KEY_HERE'; // User needs to replace this
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';

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

const SYSTEM_PROMPT = `You are a nutrition assistant. The user will describe a meal. Infer portions if missing, estimate calories and macros, and break the meal into separate ingredients. ALWAYS return ONLY valid JSON:

{
  "assumptions": "short explanation",
  "items": [
    {
      "name": "item name",
      "serving_description": "portion size",
      "calories": number,
      "protein_g": number,
      "carbs_g": number,
      "fats_g": number,
      "fiber_g": number
    }
  ],
  "totals": {
    "calories": number,
    "protein_g": number,
    "carbs_g": number,
    "fats_g": number,
    "fiber_g": number
  }
}`;

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
 * Estimate meal nutrition using OpenAI API
 */
export async function estimateMealWithAI(
  description: string,
  imageUri: string | null = null
): Promise<EstimationResult> {
  console.log('[AI Estimator] Starting estimation...');
  console.log('[AI Estimator] Description:', description);
  console.log('[AI Estimator] Has image:', !!imageUri);

  // Check if API key is configured
  if (!OPENAI_API_KEY || OPENAI_API_KEY === 'YOUR_OPENAI_API_KEY_HERE') {
    throw new Error(
      'OpenAI API key not configured. Please add your API key in utils/aiMealEstimator.ts'
    );
  }

  try {
    // Build the user message content
    const userContent: any[] = [
      {
        type: 'text',
        text: description,
      },
    ];

    // Add image if provided
    if (imageUri) {
      console.log('[AI Estimator] Converting image to base64...');
      const base64Image = await imageUriToBase64(imageUri);
      userContent.push({
        type: 'image_url',
        image_url: {
          url: base64Image,
        },
      });
    }

    // Call OpenAI API
    console.log('[AI Estimator] Calling OpenAI API...');
    const response = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // Vision-capable and cost-effective
        messages: [
          {
            role: 'system',
            content: SYSTEM_PROMPT,
          },
          {
            role: 'user',
            content: userContent,
          },
        ],
        temperature: 0.7,
        max_tokens: 1500,
        response_format: { type: 'json_object' },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[AI Estimator] API error:', errorText);
      
      if (response.status === 401) {
        throw new Error('Invalid API key. Please check your OpenAI API key.');
      } else if (response.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      } else {
        throw new Error(`API error: ${response.status} - ${errorText}`);
      }
    }

    const data = await response.json();
    console.log('[AI Estimator] API response received');

    // Extract the completion text
    const completionText = data.choices?.[0]?.message?.content;
    if (!completionText) {
      throw new Error('Empty response from AI');
    }

    console.log('[AI Estimator] Parsing JSON response...');
    
    // Parse the JSON response
    let result: EstimationResult;
    try {
      result = JSON.parse(completionText);
    } catch (parseError) {
      console.error('[AI Estimator] JSON parse error:', parseError);
      console.error('[AI Estimator] Raw response:', completionText);
      throw new Error('Invalid JSON response from AI. Please try again.');
    }

    // Validate the response structure
    if (!result.assumptions || !result.items || !Array.isArray(result.items) || !result.totals) {
      console.error('[AI Estimator] Invalid response structure:', result);
      throw new Error('Invalid response structure from AI. Please try again.');
    }

    // Validate each item
    for (const item of result.items) {
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
        throw new Error('Invalid item data from AI. Please try again.');
      }
    }

    console.log('[AI Estimator] Estimation successful');
    console.log('[AI Estimator] Items:', result.items.length);
    
    return result;
  } catch (error: any) {
    console.error('[AI Estimator] Error:', error);
    
    if (error.message) {
      throw error;
    }
    
    throw new Error('Failed to estimate meal. Please check your internet connection and try again.');
  }
}
