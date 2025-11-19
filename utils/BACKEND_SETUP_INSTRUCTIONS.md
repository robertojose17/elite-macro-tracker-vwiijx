
# Backend Setup Instructions for AI Meal Estimator

The AI Meal Estimator now uses a backend API endpoint instead of calling OpenAI directly from the mobile app. This keeps your API keys secure and allows you to use any LLM provider you want.

## Quick Start (Testing)

For immediate testing without setting up a backend:

1. Open `utils/aiMealEstimator.ts`
2. Set `USE_MOCK_DATA = true` (already enabled by default)
3. The app will return mock estimations based on keywords

## Production Setup Options

### Option 1: Supabase Edge Function (Recommended)

**Advantages:**
- Free tier available
- Secure (API keys stored server-side)
- Scalable
- Easy to deploy

**Steps:**

1. **Enable Supabase in Natively**
   - Click the Supabase button in Natively
   - Connect to your Supabase project (create one if needed at https://supabase.com)

2. **Create the Edge Function**
   
   Create a new file in your Supabase project:
   `supabase/functions/ai-meal-estimate/index.ts`

   ```typescript
   import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

   const HUGGINGFACE_API_KEY = Deno.env.get("HUGGINGFACE_API_KEY")!;
   const MODEL_URL = "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2";

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

   serve(async (req) => {
     try {
       if (req.method !== "POST") {
         return new Response("Method Not Allowed", { status: 405 });
       }

       const { userDescription, optionalPhotoInfo } = await req.json();

       if (!userDescription || userDescription.trim().length < 5) {
         return new Response(
           JSON.stringify({ error: "Description must be at least 5 characters" }),
           { status: 400, headers: { "Content-Type": "application/json" } }
         );
       }

       // Build prompt
       let prompt = `${SYSTEM_PROMPT}\n\nUser meal description: ${userDescription}`;
       
       if (optionalPhotoInfo) {
         prompt += "\n\n(User also provided a photo of the meal)";
       }

       // Call Hugging Face API
       const response = await fetch(MODEL_URL, {
         method: "POST",
         headers: {
           "Authorization": `Bearer ${HUGGINGFACE_API_KEY}`,
           "Content-Type": "application/json",
         },
         body: JSON.stringify({
           inputs: prompt,
           parameters: {
             max_new_tokens: 1000,
             temperature: 0.7,
             return_full_text: false,
           },
         }),
       });

       if (!response.ok) {
         console.error("Hugging Face API error:", await response.text());
         return new Response(
           JSON.stringify({ error: "AI service temporarily unavailable" }),
           { status: 503, headers: { "Content-Type": "application/json" } }
         );
       }

       const data = await response.json();
       const generatedText = data[0]?.generated_text || "";

       // Extract JSON from response
       const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
       if (!jsonMatch) {
         throw new Error("No valid JSON in response");
       }

       const result = JSON.parse(jsonMatch[0]);

       // Validate structure
       if (!result.assumptions || !result.items || !result.totals) {
         throw new Error("Invalid response structure");
       }

       return new Response(JSON.stringify(result), {
         status: 200,
         headers: { "Content-Type": "application/json" },
       });
     } catch (error) {
       console.error("Error:", error);
       return new Response(
         JSON.stringify({ error: "AI estimation failed. Please try again." }),
         { status: 500, headers: { "Content-Type": "application/json" } }
       );
     }
   });
   ```

3. **Set Environment Variables in Supabase**
   
   In your Supabase dashboard:
   - Go to Project Settings → Edge Functions
   - Add secret: `HUGGINGFACE_API_KEY` = your Hugging Face API key
   
   Get a free Hugging Face API key at: https://huggingface.co/settings/tokens

4. **Deploy the Function**
   
   ```bash
   supabase functions deploy ai-meal-estimate
   ```

5. **Update the App**
   
   In `utils/aiMealEstimator.ts`:
   ```typescript
   const API_ENDPOINT = 'https://your-project.supabase.co/functions/v1/ai-meal-estimate';
   const USE_MOCK_DATA = false;
   ```

### Option 2: Use OpenAI via Supabase (If you prefer OpenAI)

If you want to continue using OpenAI but keep it secure:

1. Follow the same Supabase setup as above
2. Use this Edge Function instead:

   ```typescript
   import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

   const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY")!;
   const OPENAI_API_URL = "https://api.openai.com/v1/chat/completions";

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

   serve(async (req) => {
     try {
       if (req.method !== "POST") {
         return new Response("Method Not Allowed", { status: 405 });
       }

       const { userDescription, optionalPhotoInfo } = await req.json();

       if (!userDescription || userDescription.trim().length < 5) {
         return new Response(
           JSON.stringify({ error: "Description must be at least 5 characters" }),
           { status: 400, headers: { "Content-Type": "application/json" } }
         );
       }

       // Build user message content
       const userContent: any[] = [
         {
           type: "text",
           text: userDescription,
         },
       ];

       // Add image if provided
       if (optionalPhotoInfo) {
         userContent.push({
           type: "image_url",
           image_url: {
             url: optionalPhotoInfo,
           },
         });
       }

       // Call OpenAI API
       const response = await fetch(OPENAI_API_URL, {
         method: "POST",
         headers: {
           "Content-Type": "application/json",
           "Authorization": `Bearer ${OPENAI_API_KEY}`,
         },
         body: JSON.stringify({
           model: "gpt-4o-mini",
           messages: [
             {
               role: "system",
               content: SYSTEM_PROMPT,
             },
             {
               role: "user",
               content: userContent,
             },
           ],
           temperature: 0.7,
           max_tokens: 1500,
           response_format: { type: "json_object" },
         }),
       });

       if (!response.ok) {
         console.error("OpenAI API error:", await response.text());
         return new Response(
           JSON.stringify({ error: "AI service temporarily unavailable" }),
           { status: 503, headers: { "Content-Type": "application/json" } }
         );
       }

       const data = await response.json();
       const completionText = data.choices?.[0]?.message?.content;

       if (!completionText) {
         throw new Error("Empty response from AI");
       }

       const result = JSON.parse(completionText);

       // Validate structure
       if (!result.assumptions || !result.items || !result.totals) {
         throw new Error("Invalid response structure");
       }

       return new Response(JSON.stringify(result), {
         status: 200,
         headers: { "Content-Type": "application/json" },
       });
     } catch (error) {
       console.error("Error:", error);
       return new Response(
         JSON.stringify({ error: "AI estimation failed. Please try again." }),
         { status: 500, headers: { "Content-Type": "application/json" } }
       );
     }
   });
   ```

3. Set `OPENAI_API_KEY` in Supabase environment variables

### Option 3: Your Own Backend Server

If you have your own backend:

1. Create a POST endpoint at `/api/ai-meal-estimate`
2. Accept JSON body: `{ userDescription: string, optionalPhotoInfo?: string }`
3. Call any LLM provider you want (Hugging Face, Anthropic, Cohere, etc.)
4. Return JSON in the format specified above
5. Update `API_ENDPOINT` in `utils/aiMealEstimator.ts`

## Free/Cheap LLM Provider Options

### Hugging Face (Recommended for Free Tier)
- **Cost:** Free tier available (rate limited)
- **Models:** Mistral-7B, Llama-2, etc.
- **API:** https://huggingface.co/inference-api
- **Get API Key:** https://huggingface.co/settings/tokens

### Groq (Fast & Cheap)
- **Cost:** Free tier with generous limits
- **Models:** Llama-3, Mixtral, etc.
- **API:** https://console.groq.com
- **Speed:** Very fast inference

### Together AI
- **Cost:** $0.20 per 1M tokens (very cheap)
- **Models:** Many open-source models
- **API:** https://api.together.xyz

### Anthropic Claude (If budget allows)
- **Cost:** Pay-as-you-go
- **Models:** Claude 3 Haiku (cheapest)
- **API:** https://console.anthropic.com

## Testing

Once your backend is set up:

1. Set `USE_MOCK_DATA = false` in `utils/aiMealEstimator.ts`
2. Set `API_ENDPOINT` to your backend URL
3. Test the AI Meal Estimator in the app
4. Check logs for any errors

## Troubleshooting

- **"Backend API endpoint not configured"**: Update `API_ENDPOINT` and set `USE_MOCK_DATA = false`
- **"AI estimation is temporarily unavailable"**: Check your backend logs and API key
- **"Too many requests"**: You've hit rate limits - wait or upgrade your plan
- **Invalid JSON response**: The LLM didn't return valid JSON - try adjusting the prompt

## Security Notes

✅ **DO:**
- Store API keys in environment variables (Supabase secrets, etc.)
- Use HTTPS for your backend endpoint
- Validate and sanitize user input
- Implement rate limiting

❌ **DON'T:**
- Store API keys in the mobile app code
- Expose your backend endpoint without authentication (if needed)
- Trust user input without validation
