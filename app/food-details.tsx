
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Platform, ActivityIndicator, Alert, KeyboardAvoidingView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, borderRadius, typography } from '@/styles/commonStyles';
import { useColorScheme } from '@/hooks/useColorScheme';
import { IconSymbol } from '@/components/IconSymbol';
import { supabase } from '@/app/integrations/supabase/client';
import { OpenFoodFactsProduct, mapOpenFoodFactsToFood, extractServingSize, ServingSizeInfo } from '@/utils/openFoodFacts';

export default function FoodDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const mealType = (params.meal as string) || 'breakfast';
  const date = (params.date as string) || new Date().toISOString().split('T')[0];
  const productDataString = params.productData as string;
  const source = (params.source as string) || 'search';

  const [product, setProduct] = useState<OpenFoodFactsProduct | null>(null);
  const [servingInfo, setServingInfo] = useState<ServingSizeInfo | null>(null);
  const [grams, setGrams] = useState('100');
  const [customServingDescription, setCustomServingDescription] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (productDataString) {
      try {
        const parsed = JSON.parse(productDataString);
        setProduct(parsed);
        
        // Extract serving size information from OpenFoodFacts
        const serving = extractServingSize(parsed);
        setServingInfo(serving);
        setGrams(serving.grams.toString());
        setCustomServingDescription(serving.description);
        
        console.log('[FoodDetails] Extracted serving info:', serving);
      } catch (error) {
        console.error('[FoodDetails] Error parsing product data:', error);
        Alert.alert('Error', 'Invalid product data');
        router.back();
      }
    }
  }, [productDataString]);

  if (!product || !servingInfo) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: isDark ? colors.backgroundDark : colors.background }]} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const nutriments = product.nutriments || {};
  const per100gCalories = nutriments['energy-kcal_100g'] || 0;
  const per100gProtein = nutriments['proteins_100g'] || 0;
  const per100gCarbs = nutriments['carbohydrates_100g'] || 0;
  const per100gFats = nutriments['fat_100g'] || 0;
  const per100gFiber = nutriments['fiber_100g'] || 0;

  // Calculate for the specified grams
  const gramsNum = parseFloat(grams) || servingInfo.grams;
  const multiplier = gramsNum / 100;
  
  const calculatedCalories = per100gCalories * multiplier;
  const calculatedProtein = per100gProtein * multiplier;
  const calculatedCarbs = per100gCarbs * multiplier;
  const calculatedFats = per100gFats * multiplier;
  const calculatedFiber = per100gFiber * multiplier;

  // Generate serving description for display
  const getServingDescription = (): string => {
    const currentGrams = parseFloat(grams) || servingInfo.grams;
    
    // If user hasn't changed the grams, use the original serving description
    if (Math.abs(currentGrams - servingInfo.grams) < 0.1) {
      return servingInfo.displayText;
    }
    
    // If the original serving had a unit description (not just grams)
    if (servingInfo.description !== servingInfo.displayText && !servingInfo.description.match(/^\d+\s*g$/i)) {
      // Try to scale the serving (e.g., "1 egg" -> "2 eggs", "2 slices" -> "3 slices")
      const match = servingInfo.description.match(/^(\d+\.?\d*)\s+(.+)$/);
      if (match) {
        const originalCount = parseFloat(match[1]);
        const unit = match[2];
        const gramsPerUnit = servingInfo.grams / originalCount;
        const newCount = currentGrams / gramsPerUnit;
        
        // If it's close to a whole number, use that
        if (Math.abs(newCount - Math.round(newCount)) < 0.1) {
          return `${Math.round(newCount)} ${unit} (${Math.round(currentGrams)} g)`;
        }
        
        // Otherwise show decimal
        return `${newCount.toFixed(1)} ${unit} (${Math.round(currentGrams)} g)`;
      }
    }
    
    // Fallback: just show grams
    return `${Math.round(currentGrams)} g`;
  };

  const handleSave = async () => {
    if (!grams || parseFloat(grams) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount in grams');
      return;
    }

    setSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert('Error', 'You must be logged in to add food');
        setSaving(false);
        return;
      }

      console.log('[FoodDetails] Starting save process for meal:', mealType, 'date:', date);

      // Check if this food already exists in our database (by barcode)
      let foodId: string | null = null;

      if (product.code) {
        const { data: existingFood } = await supabase
          .from('foods')
          .select('id')
          .eq('barcode', product.code)
          .maybeSingle();

        if (existingFood) {
          foodId = existingFood.id;
          console.log('[FoodDetails] Using existing food:', foodId);
        }
      }

      // If food doesn't exist, create it
      if (!foodId) {
        const foodData = mapOpenFoodFactsToFood(product);
        const { data: newFood, error: foodError } = await supabase
          .from('foods')
          .insert({
            name: foodData.name,
            brand: foodData.brand,
            serving_amount: 100, // OpenFoodFacts uses per 100g
            serving_unit: 'g',
            calories: per100gCalories,
            protein: per100gProtein,
            carbs: per100gCarbs,
            fats: per100gFats,
            fiber: per100gFiber,
            barcode: product.code,
            user_created: false,
          })
          .select()
          .single();

        if (foodError) {
          console.error('[FoodDetails] Error creating food:', foodError);
          Alert.alert('Error', 'Failed to save food');
          setSaving(false);
          return;
        }

        foodId = newFood.id;
        console.log('[FoodDetails] Created new food:', foodId);
      }

      // Find or create meal for the date and meal type
      const { data: existingMeal } = await supabase
        .from('meals')
        .select('id')
        .eq('user_id', user.id)
        .eq('date', date)
        .eq('meal_type', mealType)
        .maybeSingle();

      let mealId = existingMeal?.id;

      if (!mealId) {
        console.log('[FoodDetails] Creating new meal for', mealType, 'on', date);
        const { data: newMeal, error: mealError } = await supabase
          .from('meals')
          .insert({
            user_id: user.id,
            date: date,
            meal_type: mealType,
          })
          .select()
          .single();

        if (mealError) {
          console.error('[FoodDetails] Error creating meal:', mealError);
          Alert.alert('Error', 'Failed to create meal');
          setSaving(false);
          return;
        }

        mealId = newMeal.id;
        console.log('[FoodDetails] Created new meal:', mealId);
      } else {
        console.log('[FoodDetails] Using existing meal:', mealId);
      }

      // Generate the serving description for storage
      const finalServingDescription = getServingDescription();
      const finalGrams = parseFloat(grams);

      console.log('[FoodDetails] Saving with serving description:', finalServingDescription);
      console.log('[FoodDetails] Grams:', finalGrams);

      // ALWAYS INSERT a new meal item (never update existing ones)
      console.log('[FoodDetails] Inserting NEW meal item (not replacing)');
      const { error: mealItemError } = await supabase
        .from('meal_items')
        .insert({
          meal_id: mealId,
          food_id: foodId,
          quantity: multiplier, // Store as multiplier (e.g., 1.5 for 150g)
          calories: calculatedCalories,
          protein: calculatedProtein,
          carbs: calculatedCarbs,
          fats: calculatedFats,
          fiber: calculatedFiber,
          serving_description: finalServingDescription,
          grams: finalGrams,
        });

      if (mealItemError) {
        console.error('[FoodDetails] Error creating meal item:', mealItemError);
        Alert.alert('Error', 'Failed to add food to meal');
        setSaving(false);
        return;
      }

      console.log('[FoodDetails] Food added successfully!');
      console.log('[FoodDetails] Now navigating back to diary (dismissing all intermediate screens)');
      
      // Navigate back to the home/diary screen
      router.dismissTo('/(tabs)/(home)/');
    } catch (error) {
      console.error('[FoodDetails] Error in handleSave:', error);
      Alert.alert('Error', 'An unexpected error occurred');
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? colors.backgroundDark : colors.background }]} edges={['top']}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <IconSymbol
              ios_icon_name="chevron.left"
              android_material_icon_name="arrow_back"
              size={24}
              color={isDark ? colors.textDark : colors.text}
            />
          </TouchableOpacity>
          <Text style={[styles.title, { color: isDark ? colors.textDark : colors.text }]}>
            Food Details
          </Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[styles.card, { backgroundColor: isDark ? colors.cardDark : colors.card }]}>
            <Text style={[styles.foodName, { color: isDark ? colors.textDark : colors.text }]}>
              {product.product_name || 'Unknown Product'}
            </Text>
            {product.brands && (
              <Text style={[styles.foodBrand, { color: isDark ? colors.textSecondaryDark : colors.textSecondary }]}>
                {product.brands}
              </Text>
            )}
            {product.serving_size && (
              <View style={styles.servingSizeInfo}>
                <Text style={[styles.servingSizeLabel, { color: isDark ? colors.textSecondaryDark : colors.textSecondary }]}>
                  Label serving size:
                </Text>
                <Text style={[styles.servingSize, { color: colors.primary }]}>
                  {servingInfo.displayText}
                </Text>
              </View>
            )}
            {product.code && (
              <Text style={[styles.barcode, { color: isDark ? colors.textSecondaryDark : colors.textSecondary }]}>
                Barcode: {product.code}
              </Text>
            )}
          </View>

          <View style={[styles.card, { backgroundColor: isDark ? colors.cardDark : colors.card }]}>
            <Text style={[styles.sectionTitle, { color: isDark ? colors.textDark : colors.text }]}>
              Your Portion
            </Text>
            <Text style={[styles.servingInfo, { color: isDark ? colors.textSecondaryDark : colors.textSecondary }]}>
              Adjust the amount in grams
            </Text>
            
            <View style={styles.servingPreview}>
              <Text style={[styles.servingPreviewLabel, { color: isDark ? colors.textSecondaryDark : colors.textSecondary }]}>
                Will be logged as:
              </Text>
              <Text style={[styles.servingPreviewText, { color: colors.primary }]}>
                {getServingDescription()}
              </Text>
            </View>

            <View style={styles.servingInput}>
              <Text style={[styles.label, { color: isDark ? colors.textDark : colors.text }]}>
                Grams:
              </Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={[styles.input, { backgroundColor: isDark ? colors.backgroundDark : colors.background, borderColor: isDark ? colors.borderDark : colors.border, color: isDark ? colors.textDark : colors.text }]}
                  placeholder={servingInfo.grams.toString()}
                  placeholderTextColor={isDark ? colors.textSecondaryDark : colors.textSecondary}
                  keyboardType="decimal-pad"
                  value={grams}
                  onChangeText={setGrams}
                />
                <Text style={[styles.unitLabel, { color: isDark ? colors.textDark : colors.text }]}>g</Text>
              </View>
            </View>
            <View style={styles.quickButtons}>
              <TouchableOpacity
                style={[styles.quickButton, { backgroundColor: isDark ? colors.backgroundDark : colors.background }]}
                onPress={() => setGrams((servingInfo.grams * 0.5).toString())}
              >
                <Text style={[styles.quickButtonText, { color: isDark ? colors.textDark : colors.text }]}>½</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.quickButton, { backgroundColor: isDark ? colors.backgroundDark : colors.background }]}
                onPress={() => setGrams(servingInfo.grams.toString())}
              >
                <Text style={[styles.quickButtonText, { color: isDark ? colors.textDark : colors.text }]}>1x</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.quickButton, { backgroundColor: isDark ? colors.backgroundDark : colors.background }]}
                onPress={() => setGrams((servingInfo.grams * 1.5).toString())}
              >
                <Text style={[styles.quickButtonText, { color: isDark ? colors.textDark : colors.text }]}>1.5x</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.quickButton, { backgroundColor: isDark ? colors.backgroundDark : colors.background }]}
                onPress={() => setGrams((servingInfo.grams * 2).toString())}
              >
                <Text style={[styles.quickButtonText, { color: isDark ? colors.textDark : colors.text }]}>2x</Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={[styles.card, { backgroundColor: isDark ? colors.cardDark : colors.card }]}>
            <Text style={[styles.sectionTitle, { color: isDark ? colors.textDark : colors.text }]}>
              Nutrition Facts
            </Text>
            <Text style={[styles.nutritionNote, { color: isDark ? colors.textSecondaryDark : colors.textSecondary }]}>
              For {Math.round(gramsNum)}g
            </Text>

            <View style={styles.nutritionGrid}>
              <View style={styles.nutritionItem}>
                <Text style={[styles.nutritionLabel, { color: isDark ? colors.textSecondaryDark : colors.textSecondary }]}>
                  Calories
                </Text>
                <Text style={[styles.nutritionValue, { color: colors.calories }]}>
                  {Math.round(calculatedCalories)} kcal
                </Text>
              </View>

              <View style={styles.nutritionItem}>
                <Text style={[styles.nutritionLabel, { color: isDark ? colors.textSecondaryDark : colors.textSecondary }]}>
                  Protein
                </Text>
                <Text style={[styles.nutritionValue, { color: colors.protein }]}>
                  {calculatedProtein.toFixed(1)}g
                </Text>
              </View>

              <View style={styles.nutritionItem}>
                <Text style={[styles.nutritionLabel, { color: isDark ? colors.textSecondaryDark : colors.textSecondary }]}>
                  Carbs
                </Text>
                <Text style={[styles.nutritionValue, { color: colors.carbs }]}>
                  {calculatedCarbs.toFixed(1)}g
                </Text>
              </View>

              <View style={styles.nutritionItem}>
                <Text style={[styles.nutritionLabel, { color: isDark ? colors.textSecondaryDark : colors.textSecondary }]}>
                  Fats
                </Text>
                <Text style={[styles.nutritionValue, { color: colors.fats }]}>
                  {calculatedFats.toFixed(1)}g
                </Text>
              </View>

              <View style={styles.nutritionItem}>
                <Text style={[styles.nutritionLabel, { color: isDark ? colors.textSecondaryDark : colors.textSecondary }]}>
                  Fiber
                </Text>
                <Text style={[styles.nutritionValue, { color: colors.fiber }]}>
                  {calculatedFiber.toFixed(1)}g
                </Text>
              </View>
            </View>

            <View style={styles.per100gInfo}>
              <Text style={[styles.per100gTitle, { color: isDark ? colors.textSecondaryDark : colors.textSecondary }]}>
                Per 100g:
              </Text>
              <Text style={[styles.per100gText, { color: isDark ? colors.textSecondaryDark : colors.textSecondary }]}>
                {Math.round(per100gCalories)} kcal • P: {per100gProtein.toFixed(1)}g • C: {per100gCarbs.toFixed(1)}g • F: {per100gFats.toFixed(1)}g
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: colors.primary, opacity: saving ? 0.7 : 1 }]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.saveButtonText}>Add to {mealType.charAt(0).toUpperCase() + mealType.slice(1)}</Text>
            )}
          </TouchableOpacity>

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: Platform.OS === 'android' ? spacing.lg : 0,
    paddingBottom: spacing.md,
  },
  title: {
    ...typography.h3,
    flex: 1,
    textAlign: 'center',
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xxl,
  },
  card: {
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 2,
  },
  foodName: {
    ...typography.h2,
    marginBottom: spacing.xs,
  },
  foodBrand: {
    ...typography.body,
    marginBottom: spacing.sm,
  },
  servingSizeInfo: {
    marginBottom: spacing.sm,
  },
  servingSizeLabel: {
    ...typography.caption,
    marginBottom: 2,
  },
  servingSize: {
    ...typography.bodyBold,
    fontSize: 16,
  },
  barcode: {
    ...typography.caption,
    fontStyle: 'italic',
  },
  sectionTitle: {
    ...typography.h3,
    marginBottom: spacing.sm,
  },
  servingInfo: {
    ...typography.caption,
    marginBottom: spacing.md,
  },
  servingPreview: {
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  servingPreviewLabel: {
    ...typography.caption,
    marginBottom: 4,
  },
  servingPreviewText: {
    ...typography.bodyBold,
    fontSize: 18,
  },
  servingInput: {
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  label: {
    ...typography.bodyBold,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    fontSize: 18,
    fontWeight: '600',
  },
  unitLabel: {
    ...typography.h3,
    fontSize: 18,
  },
  quickButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  quickButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  quickButtonText: {
    ...typography.bodyBold,
    fontSize: 14,
  },
  nutritionNote: {
    ...typography.caption,
    marginBottom: spacing.md,
    fontStyle: 'italic',
  },
  nutritionGrid: {
    gap: spacing.md,
  },
  nutritionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  nutritionLabel: {
    ...typography.body,
  },
  nutritionValue: {
    ...typography.bodyBold,
    fontSize: 18,
  },
  per100gInfo: {
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.05)',
  },
  per100gTitle: {
    ...typography.caption,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  per100gText: {
    ...typography.caption,
  },
  saveButton: {
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  bottomSpacer: {
    height: 100,
  },
});
