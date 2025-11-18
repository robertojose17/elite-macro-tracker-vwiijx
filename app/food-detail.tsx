
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, borderRadius, typography } from '@/styles/commonStyles';
import { useColorScheme } from '@/hooks/useColorScheme';
import { IconSymbol } from '@/components/IconSymbol';
import { mockFoods, mockMeals, mockMealItems } from '@/data/mockData';
import { Food } from '@/types';

export default function FoodDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const foodId = params.foodId as string;
  const mealType = params.mealType as string || 'breakfast';
  const date = params.date as string || new Date().toISOString().split('T')[0];
  const fromBarcode = params.fromBarcode === 'true';
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const food = mockFoods.find(f => f.id === foodId);
  
  const [servings, setServings] = useState('1');

  if (!food) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: isDark ? colors.backgroundDark : colors.background }]}>
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
            Food Not Found
          </Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.errorContainer}>
          <Text style={[styles.errorText, { color: isDark ? colors.textDark : colors.text }]}>
            Food not found
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const servingMultiplier = parseFloat(servings) || 1;
  const calculatedCalories = Math.round(food.calories * servingMultiplier);
  const calculatedProtein = Math.round(food.protein * servingMultiplier * 10) / 10;
  const calculatedCarbs = Math.round(food.carbs * servingMultiplier * 10) / 10;
  const calculatedFats = Math.round(food.fats * servingMultiplier * 10) / 10;
  const calculatedFiber = Math.round(food.fiber * servingMultiplier * 10) / 10;

  const handleAddToMeal = () => {
    console.log('Adding food to meal:', {
      food: food.name,
      mealType,
      date,
      servings: servingMultiplier,
      calories: calculatedCalories,
      protein: calculatedProtein,
      carbs: calculatedCarbs,
      fats: calculatedFats,
      fiber: calculatedFiber,
    });

    // In a real app, this would:
    // 1. Find or create the meal for the date/mealType
    // 2. Add a new MealItem with the calculated values
    // 3. Update the DailySummary for the date

    // Simulate adding to meal
    const newMealItem = {
      id: `item-${Date.now()}`,
      meal_id: `meal-${mealType}`,
      food_id: food.id,
      food: food,
      quantity: servingMultiplier,
      calories: calculatedCalories,
      protein: calculatedProtein,
      carbs: calculatedCarbs,
      fats: calculatedFats,
      fiber: calculatedFiber,
    };

    console.log('New meal item created:', newMealItem);

    // Show success feedback
    alert(`Added ${food.name} to ${mealType}!`);

    // Navigate back to diary
    if (fromBarcode) {
      // If from barcode, go back to diary (skip scanner screen)
      router.replace('/(tabs)/diary');
    } else {
      router.back();
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? colors.backgroundDark : colors.background }]} edges={['top']}>
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
      >
        {fromBarcode && (
          <View style={[styles.barcodeTag, { backgroundColor: colors.primary + '20' }]}>
            <IconSymbol
              ios_icon_name="barcode"
              android_material_icon_name="qr_code"
              size={20}
              color={colors.primary}
            />
            <Text style={[styles.barcodeTagText, { color: colors.primary }]}>
              Scanned from barcode
            </Text>
          </View>
        )}

        <View style={[styles.foodHeader, { backgroundColor: isDark ? colors.cardDark : colors.card }]}>
          <Text style={[styles.foodName, { color: isDark ? colors.textDark : colors.text }]}>
            {food.name}
          </Text>
          {food.brand && (
            <Text style={[styles.foodBrand, { color: isDark ? colors.textSecondaryDark : colors.textSecondary }]}>
              {food.brand}
            </Text>
          )}
          <Text style={[styles.servingInfo, { color: isDark ? colors.textSecondaryDark : colors.textSecondary }]}>
            Per {food.serving_amount}{food.serving_unit}
          </Text>
        </View>

        <View style={[styles.servingSelector, { backgroundColor: isDark ? colors.cardDark : colors.card }]}>
          <Text style={[styles.sectionTitle, { color: isDark ? colors.textDark : colors.text }]}>
            Number of Servings
          </Text>
          
          <View style={styles.servingControls}>
            <TouchableOpacity
              style={[styles.servingButton, { backgroundColor: colors.primary }]}
              onPress={() => {
                const current = parseFloat(servings) || 1;
                if (current > 0.25) {
                  setServings((current - 0.25).toFixed(2));
                }
              }}
            >
              <IconSymbol
                ios_icon_name="minus"
                android_material_icon_name="remove"
                size={24}
                color="#FFFFFF"
              />
            </TouchableOpacity>

            <TextInput
              style={[styles.servingInput, { 
                backgroundColor: isDark ? colors.backgroundDark : colors.background,
                color: isDark ? colors.textDark : colors.text,
                borderColor: isDark ? colors.borderDark : colors.border,
              }]}
              value={servings}
              onChangeText={setServings}
              keyboardType="decimal-pad"
            />

            <TouchableOpacity
              style={[styles.servingButton, { backgroundColor: colors.primary }]}
              onPress={() => {
                const current = parseFloat(servings) || 1;
                setServings((current + 0.25).toFixed(2));
              }}
            >
              <IconSymbol
                ios_icon_name="plus"
                android_material_icon_name="add"
                size={24}
                color="#FFFFFF"
              />
            </TouchableOpacity>
          </View>
        </View>

        <View style={[styles.nutritionCard, { backgroundColor: isDark ? colors.cardDark : colors.card }]}>
          <Text style={[styles.sectionTitle, { color: isDark ? colors.textDark : colors.text }]}>
            Nutrition Facts
          </Text>

          <View style={styles.caloriesRow}>
            <Text style={[styles.caloriesLabel, { color: isDark ? colors.textDark : colors.text }]}>
              Calories
            </Text>
            <Text style={[styles.caloriesValue, { color: colors.primary }]}>
              {calculatedCalories}
            </Text>
          </View>

          <View style={styles.divider} />

          <NutritionRow
            label="Protein"
            value={calculatedProtein}
            color={colors.protein}
            isDark={isDark}
          />
          <NutritionRow
            label="Carbs"
            value={calculatedCarbs}
            color={colors.carbs}
            isDark={isDark}
          />
          <NutritionRow
            label="Fats"
            value={calculatedFats}
            color={colors.fats}
            isDark={isDark}
          />
          <NutritionRow
            label="Fiber"
            value={calculatedFiber}
            color={colors.fiber}
            isDark={isDark}
          />
        </View>

        <View style={[styles.mealInfo, { backgroundColor: isDark ? colors.cardDark : colors.card }]}>
          <IconSymbol
            ios_icon_name="fork.knife"
            android_material_icon_name="restaurant"
            size={20}
            color={isDark ? colors.textSecondaryDark : colors.textSecondary}
          />
          <Text style={[styles.mealInfoText, { color: isDark ? colors.textSecondaryDark : colors.textSecondary }]}>
            Adding to {mealType.charAt(0).toUpperCase() + mealType.slice(1)}
          </Text>
        </View>
      </ScrollView>

      <View style={[styles.footer, { backgroundColor: isDark ? colors.cardDark : colors.card }]}>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.primary }]}
          onPress={handleAddToMeal}
        >
          <Text style={styles.addButtonText}>
            Add to {mealType.charAt(0).toUpperCase() + mealType.slice(1)}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

function NutritionRow({ label, value, color, isDark }: { label: string; value: number; color: string; isDark: boolean }) {
  return (
    <View style={styles.nutritionRow}>
      <View style={styles.nutritionLabel}>
        <View style={[styles.colorDot, { backgroundColor: color }]} />
        <Text style={[styles.nutritionLabelText, { color: isDark ? colors.textDark : colors.text }]}>
          {label}
        </Text>
      </View>
      <Text style={[styles.nutritionValue, { color: isDark ? colors.textDark : colors.text }]}>
        {value}g
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    ...typography.body,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: 100,
  },
  barcodeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    alignSelf: 'flex-start',
    marginBottom: spacing.md,
  },
  barcodeTagText: {
    ...typography.caption,
    fontWeight: '600',
  },
  foodHeader: {
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
    marginBottom: spacing.xs,
  },
  servingInfo: {
    ...typography.caption,
  },
  servingSelector: {
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 2,
  },
  sectionTitle: {
    ...typography.h3,
    marginBottom: spacing.md,
  },
  servingControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  servingButton: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  servingInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  nutritionCard: {
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 2,
  },
  caloriesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  caloriesLabel: {
    ...typography.h3,
  },
  caloriesValue: {
    fontSize: 32,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginBottom: spacing.md,
  },
  nutritionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  nutritionLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  nutritionLabelText: {
    ...typography.body,
  },
  nutritionValue: {
    ...typography.bodyBold,
  },
  mealInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  mealInfoText: {
    ...typography.body,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  addButton: {
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 18,
  },
});
