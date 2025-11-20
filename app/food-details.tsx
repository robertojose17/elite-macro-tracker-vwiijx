
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Platform, ActivityIndicator, Alert, KeyboardAvoidingView } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, borderRadius, typography } from '@/styles/commonStyles';
import { useColorScheme } from '@/hooks/useColorScheme';
import { IconSymbol } from '@/components/IconSymbol';
import { supabase } from '@/app/integrations/supabase/client';
import { OpenFoodFactsProduct, mapOpenFoodFactsToFood } from '@/utils/openFoodFacts';

export default function FoodDetailsScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const mealType = (params.meal as string) || 'breakfast';
  const date = (params.date as string) || new Date().toISOString().split('T')[0];
  const productDataString = params.productData as string;

  const [product, setProduct] = useState<OpenFoodFactsProduct | null>(null);
  const [servings, setServings] = useState('1');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (productDataString) {
      try {
        const parsed = JSON.parse(productDataString);
        setProduct(parsed);
      } catch (error) {
        console.error('[FoodDetails] Error parsing product data:', error);
        Alert.alert('Error', 'Invalid product data');
        router.back();
      }
    }
  }, [productDataString]);

  if (!product) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: isDark ? colors.backgroundDark : colors.background }]} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  const nutriments = product.nutriments || {};
  const baseCalories = nutriments['energy-kcal_100g'] || 0;
  const baseProtein = nutriments['proteins_100g'] || 0;
  const baseCarbs = nutriments['carbohydrates_100g'] || 0;
  const baseFats = nutriments['fat_100g'] || 0;
  const baseFiber = nutriments['fiber_100g'] || 0;

  const servingMultiplier = parseFloat(servings) || 1;
  const calculatedCalories = baseCalories * servingMultiplier;
  const calculatedProtein = baseProtein * servingMultiplier;
  const calculatedCarbs = baseCarbs * servingMultiplier;
  const calculatedFats = baseFats * servingMultiplier;
  const calculatedFiber = baseFiber * servingMultiplier;

  const handleSave = async () => {
    if (!servings || parseFloat(servings) <= 0) {
      Alert.alert('Error', 'Please enter a valid serving amount');
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
            calories: baseCalories,
            protein: baseProtein,
            carbs: baseCarbs,
            fats: baseFats,
            fiber: baseFiber,
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

      // Create or get meal for the date
      const { data: existingMeal } = await supabase
        .from('meals')
        .select('id')
        .eq('user_id', user.id)
        .eq('date', date)
        .eq('meal_type', mealType)
        .maybeSingle();

      let mealId = existingMeal?.id;

      if (!mealId) {
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
      }

      // Add meal item
      const { error: mealItemError } = await supabase
        .from('meal_items')
        .insert({
          meal_id: mealId,
          food_id: foodId,
          quantity: servingMultiplier,
          calories: calculatedCalories,
          protein: calculatedProtein,
          carbs: calculatedCarbs,
          fats: calculatedFats,
          fiber: calculatedFiber,
        });

      if (mealItemError) {
        console.error('[FoodDetails] Error creating meal item:', mealItemError);
        Alert.alert('Error', 'Failed to add food to meal');
        setSaving(false);
        return;
      }

      console.log('[FoodDetails] Food added successfully');
      Alert.alert('Success', 'Food added to your diary!', [
        {
          text: 'OK',
          onPress: () => router.push('/(tabs)/(home)/'),
        },
      ]);
    } catch (error) {
      console.error('[FoodDetails] Error in handleSave:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
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
          </View>

          <View style={[styles.card, { backgroundColor: isDark ? colors.cardDark : colors.card }]}>
            <Text style={[styles.sectionTitle, { color: isDark ? colors.textDark : colors.text }]}>
              Serving Size
            </Text>
            <Text style={[styles.servingInfo, { color: isDark ? colors.textSecondaryDark : colors.textSecondary }]}>
              Nutrition values are per 100g
            </Text>
            <View style={styles.servingInput}>
              <Text style={[styles.label, { color: isDark ? colors.textDark : colors.text }]}>
                Number of 100g servings:
              </Text>
              <TextInput
                style={[styles.input, { backgroundColor: isDark ? colors.backgroundDark : colors.background, borderColor: isDark ? colors.borderDark : colors.border, color: isDark ? colors.textDark : colors.text }]}
                placeholder="1"
                placeholderTextColor={isDark ? colors.textSecondaryDark : colors.textSecondary}
                keyboardType="decimal-pad"
                value={servings}
                onChangeText={setServings}
              />
            </View>
          </View>

          <View style={[styles.card, { backgroundColor: isDark ? colors.cardDark : colors.card }]}>
            <Text style={[styles.sectionTitle, { color: isDark ? colors.textDark : colors.text }]}>
              Nutrition Facts
            </Text>
            <Text style={[styles.nutritionNote, { color: isDark ? colors.textSecondaryDark : colors.textSecondary }]}>
              For {servingMultiplier} × 100g = {Math.round(servingMultiplier * 100)}g
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
                  {Math.round(calculatedProtein)}g
                </Text>
              </View>

              <View style={styles.nutritionItem}>
                <Text style={[styles.nutritionLabel, { color: isDark ? colors.textSecondaryDark : colors.textSecondary }]}>
                  Carbs
                </Text>
                <Text style={[styles.nutritionValue, { color: colors.carbs }]}>
                  {Math.round(calculatedCarbs)}g
                </Text>
              </View>

              <View style={styles.nutritionItem}>
                <Text style={[styles.nutritionLabel, { color: isDark ? colors.textSecondaryDark : colors.textSecondary }]}>
                  Fats
                </Text>
                <Text style={[styles.nutritionValue, { color: colors.fats }]}>
                  {Math.round(calculatedFats)}g
                </Text>
              </View>

              <View style={styles.nutritionItem}>
                <Text style={[styles.nutritionLabel, { color: isDark ? colors.textSecondaryDark : colors.textSecondary }]}>
                  Fiber
                </Text>
                <Text style={[styles.nutritionValue, { color: colors.fiber }]}>
                  {Math.round(calculatedFiber)}g
                </Text>
              </View>
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
              <Text style={styles.saveButtonText}>Add to Diary</Text>
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
  },
  sectionTitle: {
    ...typography.h3,
    marginBottom: spacing.sm,
  },
  servingInfo: {
    ...typography.caption,
    marginBottom: spacing.md,
  },
  servingInput: {
    gap: spacing.xs,
  },
  label: {
    ...typography.bodyBold,
  },
  input: {
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    fontSize: 16,
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
