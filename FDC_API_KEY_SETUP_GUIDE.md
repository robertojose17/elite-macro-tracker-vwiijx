
# FoodData Central API Key Setup Guide

This guide will help you configure your FoodData Central (FDC) API key for the Elite Macro Tracker app.

## Step 1: Get Your API Key

1. Visit the FDC API Key Signup page: https://fdc.nal.usda.gov/api-key-signup.html
2. Fill out the form with your information
3. You'll receive your API key via email

## Step 2: Configure the API Key

You have **two options** for setting the API key:

### Option A: Using app.json (Recommended for Expo)

1. Open `app.json` in your project root
2. Find the `extra` section
3. Replace the placeholder with your actual API key:

```json
{
  "expo": {
    "extra": {
      "fooddataCentralApiKey": "YOUR_ACTUAL_API_KEY_HERE"
    }
  }
}
```

### Option B: Using Environment Variable (Recommended for Production)

1. Create a `.env` file in your project root (if it doesn't exist)
2. Add your API key:

```
FOODDATA_CENTRAL_API_KEY=YOUR_ACTUAL_API_KEY_HERE
```

3. Update `app.json` to use the environment variable:

```json
{
  "expo": {
    "extra": {
      "fooddataCentralApiKey": "${FOODDATA_CENTRAL_API_KEY}"
    }
  }
}
```

## Step 3: Restart the Development Server

After setting the API key, you **MUST** restart your development server:

```bash
# Stop the current server (Ctrl+C)
# Then restart:
npm run dev
# or
npx expo start
```

## Step 4: Test the Integration

### Test Search Food Library:

1. Open the app on your device
2. Navigate to "Add Food" → "Search Food Library"
3. Type "egg" or "chicken"
4. You should see results from FoodData Central (USDA)

### Test Barcode Scanner:

1. Navigate to "Add Food" → "Scan Barcode"
2. Scan a product with a valid UPC/EAN barcode
3. The product details should appear from FoodData Central

## Troubleshooting

### Error: "FDC API key invalid or misconfigured"

**Possible causes:**
- The API key is not set correctly
- The API key contains typos or extra spaces
- The development server wasn't restarted after setting the key

**Solutions:**
1. Double-check your API key for typos
2. Make sure there are no extra spaces before/after the key
3. Restart the development server
4. Clear the app cache: `npx expo start --clear`

### Error: "Connection Error"

**Possible causes:**
- No internet connection
- FDC service is temporarily unavailable
- API key is missing or invalid

**Solutions:**
1. Check your internet connection
2. Verify the API key is set correctly
3. Check the console logs for detailed error messages
4. Try again in a few minutes (FDC may be experiencing issues)

### No Results Found

**Possible causes:**
- The search term doesn't match any foods in FDC
- The barcode is not in the FDC database

**Solutions:**
- Try different search terms
- For barcodes: FDC primarily contains US-branded foods
- Use "Add Manually" or "Quick Add" for foods not in the database

## API Key Security

**Important:**
- Never commit your API key to version control
- Add `.env` to your `.gitignore` file
- For production builds, use environment variables or secure secret management

## API Rate Limits

FoodData Central has rate limits:
- **Demo Key:** 1,000 requests per hour
- **Registered Key:** Higher limits (check FDC documentation)

If you exceed the rate limit, you'll see authentication errors. Wait an hour or request a higher limit from FDC.

## Additional Resources

- FDC API Documentation: https://fdc.nal.usda.gov/api-guide.html
- FDC API Key Signup: https://fdc.nal.usda.gov/api-key-signup.html
- FDC Search Foods Endpoint: https://fdc.nal.usda.gov/api-spec/fdc_api.html#/FDC/getFood

## Support

If you continue to experience issues:
1. Check the console logs for detailed error messages
2. Verify your API key is valid by testing it directly with the FDC API
3. Ensure you're using the latest version of the app
