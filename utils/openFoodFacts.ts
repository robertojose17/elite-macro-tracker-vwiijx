
/**
 * OpenFoodFacts API Integration
 * Public API for food database lookup
 */

export interface OpenFoodFactsProduct {
  code: string;
  product_name?: string;
  brands?: string;
  serving_size?: string;
  nutriments?: {
    'energy-kcal_100g'?: number;
    'proteins_100g'?: number;
    'carbohydrates_100g'?: number;
    'fat_100g'?: number;
    'fiber_100g'?: number;
  };
}

export interface OpenFoodFactsSearchResult {
  products: OpenFoodFactsProduct[];
  count: number;
  page: number;
  page_size: number;
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
