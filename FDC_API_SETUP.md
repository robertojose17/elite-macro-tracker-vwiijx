
# FoodData Central (FDC) API Setup

This app now uses **FoodData Central (FDC)** from the USDA as the primary food data source instead of OpenFoodFacts. FDC provides high-quality, consistent nutrition data for branded foods, foundation foods, and survey data.

## Getting Your FDC API Key

1. Visit the FDC API website: https://fdc.nal.usda.gov/api-guide.html

2. Sign up for a free API key by clicking "Get an API Key"

3. Fill out the registration form with your email address

4. You'll receive an API key via email (usually within a few minutes)

## Setting Up the API Key

### For Development (Expo Go / Local Development)

Create a `.env` file in the root of your project:

```bash
EXPO_PUBLIC_FDC_API_KEY=your_api_key_here
```

**Important:** Add `.env` to your `.gitignore` file to keep your API key private!

### For Production (EAS Build)

When building with EAS, set the environment variable in your `eas.json`:

```json
{
  "build": {
    "production": {
      "env": {
        "EXPO_PUBLIC_FDC_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

Or use EAS Secrets (recommended):

```bash
eas secret:create --scope project --name EXPO_PUBLIC_FDC_API_KEY --value your_api_key_here
```

## Demo Key

If you don't have an API key yet, the app will use `DEMO_KEY` which has limited requests per hour. This is fine for testing but you should get your own key for production use.

## API Rate Limits

- **Free tier:** 1,000 requests per hour
- **Registered key:** Higher limits (check FDC documentation for current limits)

## Features Using FDC

- ✅ Barcode scanning (UPC/GTIN lookup)
- ✅ Food search (branded foods, foundation foods, survey data)
- ✅ Nutrition data (calories, protein, carbs, fat, fiber, sugars)
- ✅ Serving size information (household servings, grams, etc.)

## Data Types

FDC provides several types of food data:

- **Branded:** Commercial food products with UPC codes
- **Foundation:** Basic foods with detailed nutrient profiles
- **Survey (FNDDS):** Foods from USDA food surveys
- **SR Legacy:** Standard Reference legacy database

The app prioritizes **Branded** foods for barcode scans and search results, with automatic fallback to other types.

## Troubleshooting

### "No API key found" warning

Make sure you've set the `EXPO_PUBLIC_FDC_API_KEY` environment variable and restarted your development server.

### "Request timeout" or "Failed to fetch"

- Check your internet connection
- Verify your API key is valid
- Check if you've exceeded the rate limit (wait an hour or get a registered key)

### "Food not found in database"

Not all products are in FDC. The database focuses on:
- US-based branded foods
- Common foundation foods
- USDA survey foods

For products not in FDC, users can use the "Add Manually" option.

## Migration from OpenFoodFacts

All existing food entries in your database will continue to work. New scans and searches will use FDC. The app stores both:
- `barcode` - for backward compatibility
- `fdc_id` - for FDC-sourced foods
- `data_type` - to identify the FDC data type

## Support

For FDC API issues, visit: https://fdc.nal.usda.gov/help.html

For app-specific issues, check the console logs which include detailed FDC API interaction information.
