
# Food Library Mobile Testing Guide

## Pre-Test Setup

### Requirements:
- iPhone with Expo Go installed OR TestFlight build installed
- Active internet connection
- App logged in with a valid user account

### Before Testing:
1. Open the app on your iPhone
2. Ensure you're on the Home/Diary screen
3. Note the current date being displayed
4. Have a real food product with a barcode ready (optional, for barcode testing)

---

## Test 1: Navigation to Food Library ✓

### Steps:
1. On Home/Diary screen, find any meal (Breakfast, Lunch, Dinner, or Snacks)
2. Tap the blue "+" button next to the meal name
3. **Expected:** Add Food menu opens with 3 options
4. Look for "Search Food Library" option (should be first)
5. Tap "Search Food Library"

### Success Criteria:
- ✅ Food Library screen opens immediately
- ✅ Green banner at top shows: "✓ Food Library Screen Loaded (ios)"
- ✅ Header shows "Search Food Library"
- ✅ Back button (←) is visible in top-left
- ✅ Search bar is visible with placeholder text
- ✅ Empty state shows 🍽️ emoji and "Search for food" message

### If This Fails:
- Check console logs for: `[AddFood] Navigating to food-search`
- Check console logs for: `[FoodSearch] Screen mounted on platform: ios`
- Take a screenshot and note what you see instead

---

## Test 2: Live Search Functionality ✓

### Steps:
1. In the Food Library screen, tap the search bar
2. Type slowly: "c" then "h" then "i" then "c" then "k"
3. Watch the screen as you type each letter

### Success Criteria:
- ✅ Keyboard appears when search bar is tapped
- ✅ As you type, loading indicator appears briefly
- ✅ Results start appearing after typing a few letters
- ✅ Results update as you continue typing (live search)
- ✅ Each result shows:
  - Product name (bold)
  - Brand name (if available)
  - Nutrition info: "Per 100g: XXX kcal • P: XXg • C: XXg • F: XXg"
  - Serving size (if available)
  - Right arrow (→) on the right side

### If This Fails:
- Check console logs for: `[FoodSearch] Searching for: chicken`
- Check console logs for: `[OpenFoodFacts] Found X products`
- Check internet connection
- Try a different search term like "milk" or "bread"

---

## Test 3: Search Results Display ✓

### Steps:
1. Complete search for "chicken" (from Test 2)
2. Wait for results to fully load
3. Scroll through the results list

### Success Criteria:
- ✅ Results count shown at top: "Found X results"
- ✅ At least 10-20 results are displayed
- ✅ Each result card is tappable (visual feedback when pressed)
- ✅ Results are readable and properly formatted
- ✅ No overlapping text or cut-off content
- ✅ Scroll works smoothly

### Common Results to Expect:
- "Chicken Breast" (various brands)
- "Chicken Thighs"
- "Rotisserie Chicken"
- "Chicken Wings"
- etc.

---

## Test 4: Product Selection & Details ✓

### Steps:
1. From search results, tap on "Chicken Breast" (or any result)
2. Wait for Food Details screen to load

### Success Criteria:
- ✅ Food Details screen opens
- ✅ Header shows "Food Details"
- ✅ Back button (←) is visible
- ✅ Product information displayed:
  - Product name (large, bold)
  - Brand name (if available)
  - Typical serving size (if available)
  - Barcode number (if available)
- ✅ "Serving Size" section shows:
  - "Grams:" label with input field
  - Default value (usually 100)
  - Quick buttons: 50g, 100g, 150g, 200g
- ✅ "Nutrition Facts" section shows:
  - "For XXg" note
  - Calories (orange/red color)
  - Protein (blue color)
  - Carbs (yellow color)
  - Fats (purple color)
  - Fiber (green color)
  - "Per 100g:" summary at bottom
- ✅ "Add to [Meal]" button at bottom (blue)

---

## Test 5: Serving Size Adjustment ✓

### Steps:
1. On Food Details screen, tap the grams input field
2. Clear the current value
3. Type "150"
4. Tap outside the input to dismiss keyboard
5. Observe the nutrition values

### Success Criteria:
- ✅ Keyboard appears with number pad
- ✅ Can clear and type new value
- ✅ Nutrition values update automatically when you change grams
- ✅ Values are recalculated correctly (150g should be 1.5x the 100g values)
- ✅ Quick buttons (50g, 100g, etc.) work when tapped
- ✅ Tapping a quick button updates the input and recalculates nutrition

### Example Calculation:
If 100g = 165 kcal, then 150g should show ~248 kcal

---

## Test 6: Add Food to Meal ✓

### Steps:
1. On Food Details screen, ensure grams is set to a value (e.g., 150)
2. Tap "Add to [Meal]" button at bottom
3. Wait for the action to complete

### Success Criteria:
- ✅ Button shows loading indicator (spinner)
- ✅ After 1-2 seconds, automatically returns to Home/Diary screen
- ✅ The food appears in the correct meal section
- ✅ Food entry shows:
  - Product name
  - Brand (if available)
  - Serving amount (e.g., "150 g")
  - Calories on the right
- ✅ Meal total calories updated
- ✅ Daily total calories updated
- ✅ Macro totals (Protein, Carbs, Fats, Fiber) updated

### Console Logs to Check:
```
[FoodDetails] Food added successfully
[Home] Screen focused, loading data
[Home] Meals loaded: [...]
```

---

## Test 7: Back Navigation ✓

### Steps:
1. From Home/Diary, tap Add Food → Search Food Library
2. Tap Back button (←) in top-left
3. **Expected:** Returns to Add Food menu
4. Tap Back button (←) again
5. **Expected:** Returns to Home/Diary

### Success Criteria:
- ✅ Back button always visible and tappable
- ✅ Back button has good contrast (not white on white)
- ✅ Navigation is smooth without delays
- ✅ No crashes or errors
- ✅ Returns to correct previous screen

---

## Test 8: Search Error Handling ✓

### Steps:
1. Go to Food Library screen
2. Search for nonsense: "xyzabc123456"
3. Wait for results

### Success Criteria:
- ✅ Loading indicator appears
- ✅ After loading, shows "No results found" message
- ✅ Shows 🔍 emoji
- ✅ Shows "Try a different search term" suggestion
- ✅ Can search again with a different term

---

## Test 9: Network Error Handling ✓

### Steps:
1. Turn on Airplane Mode on your iPhone
2. Go to Food Library screen
3. Try to search for "chicken"

### Success Criteria:
- ✅ Loading indicator appears
- ✅ Error alert pops up with message
- ✅ Alert has "OK" button
- ✅ Can dismiss alert
- ✅ Can try again after turning off Airplane Mode

---

## Test 10: Multiple Additions ✓

### Steps:
1. Add "Chicken Breast" (150g) to Breakfast
2. Go back to Home/Diary
3. Add "Rice" (200g) to Lunch
4. Go back to Home/Diary
5. Add "Broccoli" (100g) to Dinner

### Success Criteria:
- ✅ Each food appears in the correct meal
- ✅ Totals update correctly after each addition
- ✅ No duplicate entries
- ✅ Can add multiple foods without issues
- ✅ App remains responsive

---

## Test 11: Edit and Delete Food ✓

### Steps:
1. From Home/Diary, tap on a food entry you added
2. Edit screen should open (if implemented)
3. Tap the trash icon next to a food entry
4. Confirm deletion

### Success Criteria:
- ✅ Can tap food entries
- ✅ Delete button (trash icon) is visible
- ✅ Confirmation dialog appears
- ✅ Food is removed after confirmation
- ✅ Totals update after deletion

---

## Test 12: Barcode Scanner Integration ✓

### Steps:
1. From Add Food menu, tap "Scan Barcode"
2. Grant camera permission if prompted
3. Point camera at a real product barcode
4. Wait for scan to complete

### Success Criteria:
- ✅ Camera opens in full screen
- ✅ Scan frame is visible with corner markers
- ✅ Back button visible and works
- ✅ When barcode detected:
  - Loading overlay appears
  - "Looking up product..." message shows
  - If found: Opens Food Details screen
  - If not found: Shows "Food not found" screen with options

---

## Common Issues & Solutions

### Issue: Food Library screen is blank
**Solution:**
- Check console logs for errors
- Verify internet connection
- Try force-closing and reopening the app
- Check if the green debug banner appears

### Issue: Search doesn't return results
**Solution:**
- Verify internet connection
- Try a common food like "milk" or "bread"
- Check console logs for API errors
- Wait a few seconds for debounce

### Issue: Back button doesn't work
**Solution:**
- Check if button is visible (not white on white)
- Try tapping slightly to the right of the arrow
- Check console logs for navigation errors

### Issue: Food doesn't appear after adding
**Solution:**
- Check console logs for database errors
- Verify user is logged in
- Try refreshing the Home/Diary screen (pull down)
- Check if the food was added to the correct date

---

## Success Metrics

### Minimum Passing Criteria:
- ✅ Food Library screen opens on mobile
- ✅ Search bar is visible and functional
- ✅ Search returns results from OpenFoodFacts
- ✅ Can select a product and see details
- ✅ Can add food to a meal
- ✅ Food appears in the diary
- ✅ Back navigation works throughout

### Ideal Performance:
- All 12 tests pass without issues
- No console errors
- Smooth animations and transitions
- Fast search results (< 2 seconds)
- Accurate nutrition calculations
- Reliable back navigation

---

## Reporting Issues

If any test fails, please provide:

1. **Test number and name** (e.g., "Test 2: Live Search Functionality")
2. **What you expected** (from Success Criteria)
3. **What actually happened** (describe or screenshot)
4. **Console logs** (if available)
5. **Device info** (iPhone model, iOS version, Expo Go or TestFlight)
6. **Steps to reproduce** (if different from test steps)

---

## Post-Testing Cleanup

After confirming everything works:

1. Remove the green debug banner from `food-search.tsx`
2. Remove the debug card from `add-food.tsx`
3. Keep console logs for future debugging
4. Update documentation with any findings
5. Deploy to production

---

## Notes

- OpenFoodFacts API is free and public (no API key needed)
- Search results are limited to 20 items per query
- Live search has 400ms debounce to reduce API calls
- All nutrition values are per 100g from OpenFoodFacts
- Some products may have incomplete nutrition data
- Barcode scanner works best in good lighting
- Internet connection required for all Food Library features
