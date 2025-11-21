
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
}

/**
 * Extract serving size information from OpenFoodFacts product
 * Returns the serving description and gram equivalent
 */
export function extractServingSize(product: OpenFoodFactsProduct): ServingSizeInfo {
  // Default to 100g if no serving info available
  const defaultServing: ServingSizeInfo = {
    description: '100 g',
    grams: 100,
    displayText: '100 g',
  };

  if (!product.serving_size) {
    return defaultServing;
  }

  const servingSize = product.serving_size.trim();
  console.log('[OpenFoodFacts] Parsing serving size:', servingSize);

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
    return {
      description,
      grams,
      displayText: `${description} (${Math.round(grams)} g)`,
    };
  }

  // Pattern 2: Just grams "Yg" or "Y g"
  const pattern2 = /^(\d+\.?\d*)\s*g$/i;
  const match2 = servingSize.match(pattern2);
  if (match2) {
    const grams = parseFloat(match2[1]);
    return {
      description: `${Math.round(grams)} g`,
      grams,
      displayText: `${Math.round(grams)} g`,
    };
  }

  // Pattern 3: "X unit - Yg" or "X unit Yg"
  const pattern3 = /^(.+?)\s*[-–—]\s*(\d+\.?\d*)\s*g$/i;
  const match3 = servingSize.match(pattern3);
  if (match3) {
    const description = match3[1].trim();
    const grams = parseFloat(match3[2]);
    return {
      description,
      grams,
      displayText: `${description} (${Math.round(grams)} g)`,
    };
  }

  // Pattern 4: Try to find any number followed by g
  const pattern4 = /(\d+\.?\d*)\s*g/i;
  const match4 = servingSize.match(pattern4);
  if (match4) {
    const grams = parseFloat(match4[1]);
    // Try to extract description before the grams
    const description = servingSize.replace(pattern4, '').trim();
    if (description) {
      return {
        description,
        grams,
        displayText: `${description} (${Math.round(grams)} g)`,
      };
    }
    return {
      description: `${Math.round(grams)} g`,
      grams,
      displayText: `${Math.round(grams)} g`,
    };
  }

  // If we can't parse it, try to use serving_quantity if available
  if (product.serving_quantity) {
    const grams = parseFloat(product.serving_quantity);
    if (!isNaN(grams) && grams > 0) {
      return {
        description: servingSize,
        grams,
        displayText: `${servingSize} (${Math.round(grams)} g)`,
      };
    }
  }

  // Fallback: return the serving_size as-is with 100g default
  console.log('[OpenFoodFacts] Could not parse serving size, using default 100g');
  return {
    description: servingSize,
    grams: 100,
    displayText: `${servingSize} (100 g)`,
  };
}

/**
 * Fetch product by barcode from OpenFoodFacts
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
