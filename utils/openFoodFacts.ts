
/**
 * OpenFoodFacts API Integration
 * Public API for food database lookup
 */

export interface OpenFoodFactsProduct {
  code: string;
  product_name?: string;
  brands?: string;
  serving_size?: string;
  serving_quantity?: string;
  nutriments?: {
    'energy-kcal_100g'?: number;
    'energy-kcal_serving'?: number;
    'proteins_100g'?: number;
    'proteins_serving'?: number;
    'carbohydrates_100g'?: number;
    'carbohydrates_serving'?: number;
    'fat_100g'?: number;
    'fat_serving'?: number;
    'fiber_100g'?: number;
    'fiber_serving'?: number;
  };
}

export interface OpenFoodFactsSearchResult {
  products: OpenFoodFactsProduct[];
  count: number;
  page: number;
  page_size: number;
}

export interface ServingSizeInfo {
  description: string; // e.g., "1 egg", "2 slices", "1 bar"
  grams: number; // gram equivalent
  displayText: string; // e.g., "1 egg (50 g)", "2 slices (28 g)"
  hasValidGrams: boolean; // true if grams were successfully parsed, false if using fallback
}

/**
 * Extract serving size information from OpenFoodFacts product
 * Returns the serving description and gram equivalent
 * NEVER throws errors or blocks - always returns a valid ServingSizeInfo
 */
export function extractServingSize(product: OpenFoodFactsProduct): ServingSizeInfo {
  console.log('[OpenFoodFacts] extractServingSize called with:', {
    serving_size: product.serving_size,
    serving_quantity: product.serving_quantity,
  });

  // Default to 100g if no serving info available
  const defaultServing: ServingSizeInfo = {
    description: '100 g',
    grams: 100,
    displayText: '100 g (no serving size provided)',
    hasValidGrams: false,
  };

  // If no serving_size at all, return default immediately
  if (!product.serving_size || typeof product.serving_size !== 'string') {
    console.log('[OpenFoodFacts] No serving_size found, using default 100g');
    return defaultServing;
  }

  const servingSize = product.serving_size.trim();
  
  // Empty string check
  if (servingSize.length === 0) {
    console.log('[OpenFoodFacts] Empty serving_size, using default 100g');
    return defaultServing;
  }

  console.log('[OpenFoodFacts] Parsing serving size:', servingSize);

  try {
    // Try to extract grams from serving_size
    // Examples:
    // "1 egg (50g)" -> description: "1 egg", grams: 50
    // "2 slices (28g)" -> description: "2 slices", grams: 28
    // "1 bar (40 g)" -> description: "1 bar", grams: 40
    // "30g" -> description: "30 g", grams: 30
    // "100 g" -> description: "100 g", grams: 100

    // Pattern 1: "X unit (Yg)" or "X unit (Y g)"
    const pattern1 = /^(.+?)\s*\((\d+\.?\d*)\s*g\)$/i;
    const match1 = servingSize.match(pattern1);
    if (match1) {
      const description = match1[1].trim();
      const grams = parseFloat(match1[2]);
      
      if (!isNaN(grams) && grams > 0) {
        console.log('[OpenFoodFacts] Pattern 1 matched:', { description, grams });
        return {
          description,
          grams,
          displayText: `${description} (${Math.round(grams)} g)`,
          hasValidGrams: true,
        };
      }
    }

    // Pattern 2: Just grams "Yg" or "Y g"
    const pattern2 = /^(\d+\.?\d*)\s*g$/i;
    const match2 = servingSize.match(pattern2);
    if (match2) {
      const grams = parseFloat(match2[1]);
      
      if (!isNaN(grams) && grams > 0) {
        console.log('[OpenFoodFacts] Pattern 2 matched (pure grams):', grams);
        return {
          description: `${Math.round(grams)} g`,
          grams,
          displayText: `${Math.round(grams)} g`,
          hasValidGrams: true,
        };
      }
    }

    // Pattern 3: "X unit - Yg" or "X unit Yg"
    const pattern3 = /^(.+?)\s*[-–—]\s*(\d+\.?\d*)\s*g$/i;
    const match3 = servingSize.match(pattern3);
    if (match3) {
      const description = match3[1].trim();
      const grams = parseFloat(match3[2]);
      
      if (!isNaN(grams) && grams > 0) {
        console.log('[OpenFoodFacts] Pattern 3 matched:', { description, grams });
        return {
          description,
          grams,
          displayText: `${description} (${Math.round(grams)} g)`,
          hasValidGrams: true,
        };
      }
    }

    // Pattern 4: Try to find any number followed by g anywhere in the string
    const pattern4 = /(\d+\.?\d*)\s*g/i;
    const match4 = servingSize.match(pattern4);
    if (match4) {
      const grams = parseFloat(match4[1]);
      
      if (!isNaN(grams) && grams > 0) {
        // Try to extract description before the grams
        const description = servingSize.replace(pattern4, '').trim();
        console.log('[OpenFoodFacts] Pattern 4 matched:', { description, grams });
        
        if (description && description.length > 0) {
          return {
            description,
            grams,
            displayText: `${description} (${Math.round(grams)} g)`,
            hasValidGrams: true,
          };
        }
        
        return {
          description: `${Math.round(grams)} g`,
          grams,
          displayText: `${Math.round(grams)} g`,
          hasValidGrams: true,
        };
      }
    }

    // If we can't parse grams from serving_size, try serving_quantity
    if (product.serving_quantity) {
      const quantityStr = String(product.serving_quantity).trim();
      const grams = parseFloat(quantityStr);
      
      if (!isNaN(grams) && grams > 0) {
        console.log('[OpenFoodFacts] Using serving_quantity:', grams);
        return {
          description: servingSize,
          grams,
          displayText: `${servingSize} (${Math.round(grams)} g)`,
          hasValidGrams: true,
        };
      }
    }

    // Fallback: We have a serving description but no parseable grams
    // Return the description as-is with 100g default for calculations
    console.log('[OpenFoodFacts] Could not parse grams, using description with 100g fallback');
    return {
      description: servingSize,
      grams: 100,
      displayText: `${servingSize} (100 g default)`,
      hasValidGrams: false,
    };
  } catch (error) {
    // If ANY error occurs during parsing, return default
    console.error('[OpenFoodFacts] Error parsing serving size:', error);
    return defaultServing;
  }
}

/**
 * Fetch product by barcode from OpenFoodFacts
 * NEVER throws errors - always returns null on failure
 */
export async function fetchProductByBarcode(barcode: string): Promise<OpenFoodFactsProduct | null> {
  try {
    console.log(`[OpenFoodFacts] Fetching product by barcode: ${barcode}`);
    const response = await fetch(`https://world.openfoodfacts.org/api/v2/product/${barcode}.json`);
    
    if (!response.ok) {
      console.log(`[OpenFoodFacts] Product not found for barcode: ${barcode}`);
      return null;
    }

    const data = await response.json();
    
    if (data.status === 1 && data.product) {
      console.log(`[OpenFoodFacts] Product found:`, data.product.product_name);
      console.log(`[OpenFoodFacts] Serving size:`, data.product.serving_size);
      return data.product;
    }

    console.log(`[OpenFoodFacts] No product data for barcode: ${barcode}`);
    return null;
  } catch (error) {
    console.error('[OpenFoodFacts] Error fetching product by barcode:', error);
    return null;
  }
}

/**
 * Search products by text query from OpenFoodFacts
 */
export async function searchProducts(query: string, page: number = 1, pageSize: number = 20): Promise<OpenFoodFactsSearchResult | null> {
  try {
    console.log(`[OpenFoodFacts] Searching products: ${query}`);
    const response = await fetch(
      `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&page=${page}&page_size=${pageSize}&json=true`
    );
    
    if (!response.ok) {
      console.log(`[OpenFoodFacts] Search failed for query: ${query}`);
      return null;
    }

    const data = await response.json();
    console.log(`[OpenFoodFacts] Found ${data.count} products`);
    return data;
  } catch (error) {
    console.error('[OpenFoodFacts] Error searching products:', error);
    return null;
  }
}

/**
 * Map OpenFoodFacts product to internal Food format
 */
export function mapOpenFoodFactsToFood(product: OpenFoodFactsProduct): any {
  const nutriments = product.nutriments || {};
  
  // Parse serving size (e.g., "100g" -> 100, "g")
  let servingAmount = 100;
  let servingUnit = 'g';
  
  if (product.serving_size) {
    const match = product.serving_size.match(/(\d+\.?\d*)\s*([a-zA-Z]+)/);
    if (match) {
      servingAmount = parseFloat(match[1]);
      servingUnit = match[2];
    }
  }

  return {
    name: product.product_name || 'Unknown Product',
    brand: product.brands || undefined,
    serving_amount: servingAmount,
    serving_unit: servingUnit,
    calories: nutriments['energy-kcal_100g'] || 0,
    protein: nutriments['proteins_100g'] || 0,
    carbs: nutriments['carbohydrates_100g'] || 0,
    fats: nutriments['fat_100g'] || 0,
    fiber: nutriments['fiber_100g'] || 0,
    barcode: product.code,
    user_created: false,
    is_favorite: false,
    is_from_openfoodfacts: true, // Flag to indicate external source
  };
}
