
# Mobile FDC Integration Testing Guide

## Pre-Testing Checklist

Before testing on your iPhone, ensure:

1. ✅ FDC API key is configured in `app.json`
2. ✅ Expo dev server is restarted after adding the API key
3. ✅ iPhone is connected to the internet (WiFi or cellular)
4. ✅ Camera permissions are granted for barcode scanning

## Test 1: Food Library Search (Text)

### Steps:

1. Open the Elite Macro Tracker app on your iPhone
2. Tap on any meal (Breakfast, Lunch, Dinner, or Snacks)
3. Tap "Search Food Library"
4. You should see a green banner at the top: "✓ Food Library (FDC) - ios"

### Test Case A: Search for "chicken"

1. Type "chicken" in the search bar
2. **Expected:** Loading indicator appears
3. **Expected:** After 1-2 seconds, you see a list of chicken products
4. **Expected:** Each result shows:
   - Product name
   - Brand (if available)
   - Data type badge (BRANDED, FOUNDATION, etc.)
   - Nutrition per 100g
   - Serving size (if available)

### Test Case B: Search for "oats"

1. Clear the search bar
2. Type "oats"
3. **Expected:** Similar results as above with oat products

### Test Case C: Invalid search

1. Type "xyzabc123" (nonsense query)
2. **Expected:** "No results found" message
3. **Expected:** NOT a blank screen or infinite loading

### What to Check:

- ✅ Results appear within 2-3 seconds
- ✅ Results show real product names and nutrition data
- ✅ Tapping a result opens the Food Details screen
- ✅ No crashes or freezes

### If It Fails:

Check the console logs for:
- `[FDC] ❌ Search failed` - API error
- `[FDC] ⚠️ No API key found` - API key not configured
- `[FDC] 📥 Response status: 401` - Invalid API key
- `[FDC] 📥 Response status: 429` - Rate limit exceeded

## Test 2: Barcode Scanning

### Steps:

1. From the meal screen, tap "Scan Barcode"
2. Grant camera permission if prompted
3. You should see the camera view with a scanning frame

### Test Case A: Scan a common product

**Recommended test products:**
- Coca-Cola can (UPC: 049000050103)
- Cheerios cereal (UPC: 016000275287)
- Lay's chips (UPC: 028400056489)
- Any product with a visible barcode

1. Point the camera at the barcode
2. **Expected:** Camera stops immediately after reading the barcode
3. **Expected:** Loading screen appears: "Looking up product in FoodData Central..."
4. **Expected:** After 2-5 seconds, Food Details screen opens
5. **Expected:** Product details are displayed:
   - Product name
   - Brand
   - Serving size
   - Nutrition facts

### Test Case B: Scan an unknown barcode

1. Scan a barcode that's not in the FDC database (e.g., a local store brand)
2. **Expected:** "Food not found in database" screen appears
3. **Expected:** Two buttons are shown:
   - "Scan Another Barcode"
   - "Add Manually"

### Test Case C: Network error

1. Turn off WiFi and cellular data
2. Scan a barcode
3. **Expected:** "Connection Error" screen appears
4. **Expected:** Error message explains the issue
5. **Expected:** "Try Again" button is available

### What to Check:

- ✅ Camera starts immediately
- ✅ Barcode is read quickly (< 1 second)
- ✅ Loading screen appears (not stuck on camera)
- ✅ Food Details screen opens with correct product
- ✅ No infinite loading or blank screens
- ✅ Error messages are clear and actionable

### If It Fails:

Check the console logs for:
- `[BarcodeScanner] 📷 Scanned barcode: XXXXXXXXX` - Barcode was read
- `[FDC] 📷 Searching by barcode: XXXXXXXXX` - FDC search initiated
- `[FDC] ✅ Found X foods` - Product found
- `[FDC] ❌ No foods found` - Product not in database
- `[FDC] ❌ Error searching by barcode` - API error

## Test 3: Food Details Screen

### Steps:

1. After searching or scanning, open a Food Details screen
2. Verify all information is displayed correctly

### What to Check:

- ✅ Product name is displayed
- ✅ Brand name is shown (if available)
- ✅ "✓ FoodData Central (USDA)" badge is visible
- ✅ Data type is shown (Branded, Foundation, etc.)
- ✅ Serving size is displayed (not always "100 g")
- ✅ Nutrition facts are shown:
  - Calories
  - Protein
  - Carbs
  - Fats
  - Fiber
- ✅ Gram input field is editable
- ✅ Quick buttons (½, 1x, 1.5x, 2x) work
- ✅ "Add to [Meal]" button is visible

### Test Case: Add to meal

1. Adjust the portion if desired
2. Tap "Add to [Meal]"
3. **Expected:** Returns to the diary screen
4. **Expected:** Food is added to the meal
5. **Expected:** Serving description is shown (e.g., "1 cup (240 g)", not "100 g")

## Test 4: Multiple Foods Per Meal

### Steps:

1. Add a food to Breakfast
2. Go back and add another food to Breakfast
3. **Expected:** Both foods are shown in Breakfast
4. **Expected:** Totals reflect the sum of both foods

### What to Check:

- ✅ Multiple foods can be added to the same meal
- ✅ Each food is listed separately
- ✅ Totals are calculated correctly
- ✅ No food is overwritten or replaced

## Common Issues and Solutions

### Issue: "No results found" for all searches

**Possible causes:**
1. API key not configured
2. API key is invalid
3. No internet connection
4. FDC API is down

**Solution:**
- Check `app.json` for the API key
- Restart the Expo dev server
- Test internet connection
- Check console logs for error details

### Issue: Barcode scanner gets stuck on loading

**Possible causes:**
1. Network timeout
2. FDC API is slow
3. Invalid barcode format

**Solution:**
- Wait up to 15 seconds (timeout)
- Check internet connection
- Try a different barcode
- Check console logs for errors

### Issue: Food Details screen shows "100 g" for everything

**Possible causes:**
1. FDC data doesn't include serving size
2. Serving size parsing failed

**Solution:**
- This is expected for some products
- User can manually adjust grams
- Check console logs for serving size extraction

### Issue: App crashes when adding food

**Possible causes:**
1. Database error
2. Missing meal or food ID
3. Invalid nutrition data

**Solution:**
- Check console logs for database errors
- Verify Supabase connection
- Check that all required fields are present

## Success Criteria

The FDC integration is working correctly if:

1. ✅ Text search returns results from FoodData Central
2. ✅ Barcode scanning finds products in FDC
3. ✅ Food Details screen displays complete information
4. ✅ Foods can be added to meals successfully
5. ✅ Multiple foods can be added to the same meal
6. ✅ Serving sizes are displayed correctly (not always "100 g")
7. ✅ Errors are handled gracefully with clear messages
8. ✅ No infinite loading or blank screens
9. ✅ Console logs show successful API calls

## Reporting Issues

When reporting issues, include:

1. **Device:** iPhone model and iOS version
2. **Test case:** Which test failed
3. **Expected behavior:** What should happen
4. **Actual behavior:** What actually happened
5. **Console logs:** Copy relevant `[FDC]` and `[BarcodeScanner]` logs
6. **Screenshots:** If applicable

## Next Steps

After successful testing:

1. Test on Android device (if available)
2. Test with different internet connections (WiFi, 4G, 5G)
3. Test with various product barcodes
4. Test edge cases (very long product names, missing nutrition data, etc.)
5. Monitor API usage to ensure you're within rate limits
