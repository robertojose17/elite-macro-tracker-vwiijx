
# FoodData Central (FDC) API Key Setup

## Overview

The Elite Macro Tracker app uses the USDA's FoodData Central (FDC) API to provide high-quality nutrition data for food search and barcode scanning.

## Getting Your API Key

1. Visit the FDC API registration page:
   https://fdc.nal.usda.gov/api-key-signup.html

2. Fill out the registration form with your:
   - Email address
   - First and last name
   - Organization (optional)

3. You'll receive your API key via email immediately.

## Configuring the API Key

### Method 1: app.json (Recommended for Expo)

Open `app.json` and add your API key to the `extra` section:

```json
{
  "expo": {
    "extra": {
      "fdcApiKey": "YOUR_API_KEY_HERE"
    }
  }
}
```

### Method 2: Environment Variables (Alternative)

Create a `.env` file in the root directory:

```
EXPO_PUBLIC_FDC_API_KEY=YOUR_API_KEY_HERE
```

Then install the dotenv package:

```bash
npm install dotenv
```

## Testing the Integration

### On Mobile (iPhone/Android):

1. **Text Search Test:**
   - Open the app
   - Go to Add Food → Search Food Library
   - Type "chicken" or "oats"
   - You should see results from FoodData Central

2. **Barcode Scan Test:**
   - Go to Add Food → Scan Barcode
   - Scan a product barcode
   - You should see the product details from FDC

### Debugging

The app includes extensive logging. Check your console for:

- `[FDC] ✓ API key loaded successfully` - API key is configured
- `[FDC] ⚠️ No API key found` - API key is missing
- `[FDC] 🔍 Searching foods: "query"` - Search request sent
- `[FDC] ✅ Found X foods` - Search successful
- `[FDC] ❌ Search failed` - API error

## Demo Key

If no API key is configured, the app will use `DEMO_KEY` which has limited requests (1000 per hour). This is sufficient for testing but not recommended for production use.

## API Rate Limits

- **Free tier:** 1000 requests per hour
- **Registered key:** Higher limits (check FDC documentation)

## Troubleshooting

### "No results found" or "Connection Error"

1. **Check your API key:**
   - Make sure it's correctly added to `app.json`
   - Restart the Expo dev server after changing `app.json`

2. **Check your internet connection:**
   - FDC API requires an active internet connection
   - Test on both WiFi and cellular data

3. **Check the console logs:**
   - Look for `[FDC]` prefixed messages
   - Check for HTTP error codes (401 = invalid key, 429 = rate limit)

4. **Verify the API key is valid:**
   - Test it directly: `https://api.nal.usda.gov/fdc/v1/foods/search?api_key=YOUR_KEY&query=chicken`

### "Request timeout"

- The app has a 15-second timeout for barcode lookups
- This usually indicates a slow internet connection
- Try again with a better connection

## Support

For FDC API issues:
- FDC Documentation: https://fdc.nal.usda.gov/api-guide.html
- FDC Support: https://www.ars.usda.gov/contact-us/

For app-specific issues:
- Check the console logs for detailed error messages
- Ensure you're running the latest version of the app
