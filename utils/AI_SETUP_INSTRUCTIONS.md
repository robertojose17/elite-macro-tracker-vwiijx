
# AI Meal Estimator Setup Instructions

To use the AI Meal Estimator feature, you need to configure your OpenAI API key.

## Steps:

1. **Get an OpenAI API Key:**
   - Go to https://platform.openai.com/api-keys
   - Sign up or log in to your OpenAI account
   - Create a new API key
   - Copy the API key (it starts with "sk-")

2. **Add the API Key to the App:**
   - Open the file: `utils/aiMealEstimator.ts`
   - Find the line: `const OPENAI_API_KEY = 'YOUR_OPENAI_API_KEY_HERE';`
   - Replace `'YOUR_OPENAI_API_KEY_HERE'` with your actual API key
   - Example: `const OPENAI_API_KEY = 'sk-proj-abc123...';`

3. **Save the file and restart the app**

## Important Notes:

- **Security Warning:** In a production app, you should NEVER store API keys directly in the code. This is only for development/testing purposes.
- **For Production:** Use a backend service (like Supabase Edge Functions) to securely call the OpenAI API.
- **Cost:** OpenAI API calls are not free. The AI Meal Estimator uses the `gpt-4o-mini` model which is cost-effective, but you will be charged based on usage.
- **Rate Limits:** OpenAI has rate limits. If you see "Rate limit exceeded" errors, wait a few minutes before trying again.

## How It Works:

1. User describes their meal (e.g., "Two scrambled eggs, toast with butter, and a banana")
2. Optionally adds a photo of the meal
3. The app sends this to OpenAI's GPT-4o-mini model
4. The AI analyzes the description (and photo if provided) and returns:
   - Individual food items with estimated portions
   - Calories and macros for each item
   - Assumptions made during estimation
5. User can edit any values before saving
6. Items are saved to the meal log and daily summary is updated

## Troubleshooting:

- **"OpenAI API key not configured"**: You haven't added your API key yet
- **"Invalid API key"**: Your API key is incorrect or expired
- **"Rate limit exceeded"**: You've made too many requests. Wait and try again
- **"Invalid JSON response"**: The AI returned an unexpected format. Try again with a clearer description

## Alternative: Use Supabase (Recommended for Production)

For a more secure implementation:
1. Enable Supabase in your Natively project
2. Create a Supabase Edge Function to call OpenAI
3. Store your API key as a Supabase environment variable
4. Update the `estimateMealWithAI` function to call your Supabase function instead

See the knowledge base for examples of OpenAI + Supabase integration.
