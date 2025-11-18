
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, borderRadius, typography } from '@/styles/commonStyles';
import { useColorScheme } from '@/hooks/useColorScheme';
import { IconSymbol } from '@/components/IconSymbol';
import { mockMeals, mockMealItems, mockGoal } from '@/data/mockData';
import { MealType } from '@/types';

export default function DiaryScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const goal = mockGoal;
  const [meals, setMeals] = useState(mockMeals);
  const mealItems = mockMealItems;

  const getMealItems = (mealId: string) => {
    return mealItems.filter(item => item.meal_id === mealId);
  };

  const getMealTotals = (mealId: string) => {
    const items = getMealItems(mealId);
    return items.reduce(
      (acc, item) => ({
        calories: acc.calories + item.calories,
        protein: acc.protein + item.protein,
        carbs: acc.carbs + item.carbs,
        fats: acc.fats + item.fats,
      }),
      { calories: 0, protein: 0, carbs: 0, fats: 0 }
    );
  };

  const getTotalNutrition = () => {
    return meals.reduce(
      (acc, meal) => {
        const totals = getMealTotals(meal.id);
        return {
          calories: acc.calories + totals.calories,
          protein: acc.protein + totals.protein,
          carbs: acc.carbs + totals.carbs,
          fats: acc.fats + totals.fats,
        };
      },
      { calories: 0, protein: 0, carbs: 0, fats: 0 }
    );
  };

  const getMealIcon = (mealType: MealType) => {
    const icons = {
      breakfast: '🌅',
      lunch: '☀️',
      dinner: '🌙',
      snack: '🍎',
    };
    return icons[mealType];
  };

  const getMealLabel = (mealType: MealType) => {
    return mealType.charAt(0).toUpperCase() + mealType.slice(1);
  };

  const handleAddSnack = () => {
    console.log('Add Snack button pressed');
    
    // Check if a snack meal already exists for today
    const snackMeal = meals.find(meal => meal.meal_type === 'snack');
    
    if (!snackMeal) {
      // Create a new snack meal
      const newSnackMeal = {
        id: `meal-snack-${Date.now()}`,
        user_id: 'user-1',
        date: new Date().toISOString().split('T')[0],
        meal_type: 'snack' as MealType,
      };
      setMeals([...meals, newSnackMeal]);
      console.log('Created new snack meal:', newSnackMeal);
    }
    
    // Navigate to add food screen with snack meal type
    router.push({
      pathname: '/add-food',
      params: { mealType: 'snack' }
    });
  };

  const handleAddFood = (mealType: MealType) => {
    console.log('Add food for meal type:', mealType);
    router.push({
      pathname: '/add-food',
      params: { mealType }
    });
  };

  const totals = getTotalNutrition();

  // Define the order of meals to display
  const mealOrder: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];
  
  // Sort meals by the defined order
  const sortedMeals = [...meals].sort((a, b) => {
    return mealOrder.indexOf(a.meal_type) - mealOrder.indexOf(b.meal_type);
  });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? colors.backgroundDark : colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: isDark ? colors.textDark : colors.text }]}>
          Food Diary
        </Text>
        <TouchableOpacity>
          <IconSymbol
            ios_icon_name="calendar"
            android_material_icon_name="calendar_today"
            size={24}
            color={isDark ? colors.textDark : colors.text}
          />
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.summaryCard, { backgroundColor: isDark ? colors.cardDark : colors.card }]}>
          <View style={styles.summaryRow}>
            <SummaryItem label="Calories" value={Math.round(totals.calories).toString()} target={goal.daily_calories.toString()} isDark={isDark} />
            <SummaryItem label="Protein" value={`${Math.round(totals.protein)}g`} target={`${goal.protein_g}g`} isDark={isDark} />
            <SummaryItem label="Carbs" value={`${Math.round(totals.carbs)}g`} target={`${goal.carbs_g}g`} isDark={isDark} />
            <SummaryItem label="Fats" value={`${Math.round(totals.fats)}g`} target={`${goal.fats_g}g`} isDark={isDark} />
          </View>
        </View>

        {sortedMeals.map((meal, index) => {
          const items = getMealItems(meal.id);
          const mealTotals = getMealTotals(meal.id);

          return (
            <React.Fragment key={index}>
            <View style={[styles.mealCard, { backgroundColor: isDark ? colors.cardDark : colors.card }]}>
              <View style={styles.mealHeader}>
                <View style={styles.mealTitleRow}>
                  <Text style={styles.mealIcon}>{getMealIcon(meal.meal_type)}</Text>
                  <Text style={[styles.mealTitle, { color: isDark ? colors.textDark : colors.text }]}>
                    {getMealLabel(meal.meal_type)}
                  </Text>
                </View>
                <TouchableOpacity
                  style={[styles.addButton, { backgroundColor: colors.primary }]}
                  onPress={() => handleAddFood(meal.meal_type)}
                >
                  <IconSymbol
                    ios_icon_name="add"
                    android_material_icon_name="add"
                    size={20}
                    color="#FFFFFF"
                  />
                </TouchableOpacity>
              </View>

              {items.length > 0 ? (
                <>
                  {items.map((item, itemIndex) => (
                    <React.Fragment key={itemIndex}>
                    <View style={styles.foodItem}>
                      <View style={styles.foodInfo}>
                        <Text style={[styles.foodName, { color: isDark ? colors.textDark : colors.text }]}>
                          {item.food?.name}
                        </Text>
                        <Text style={[styles.foodDetails, { color: isDark ? colors.textSecondaryDark : colors.textSecondary }]}>
                          {item.quantity} × {item.food?.serving_amount}{item.food?.serving_unit}
                        </Text>
                      </View>
                      <Text style={[styles.foodCalories, { color: isDark ? colors.textDark : colors.text }]}>
                        {Math.round(item.calories)} kcal
                      </Text>
                    </View>
                    </React.Fragment>
                  ))}
                  
                  <View style={[styles.mealTotals, { borderTopColor: isDark ? colors.borderDark : colors.border }]}>
                    <Text style={[styles.totalsLabel, { color: isDark ? colors.textSecondaryDark : colors.textSecondary }]}>
                      Total
                    </Text>
                    <Text style={[styles.totalsValue, { color: isDark ? colors.textDark : colors.text }]}>
                      {Math.round(mealTotals.calories)} kcal • P: {Math.round(mealTotals.protein)}g • C: {Math.round(mealTotals.carbs)}g • F: {Math.round(mealTotals.fats)}g
                    </Text>
                  </View>
                </>
              ) : (
                <Text style={[styles.emptyText, { color: isDark ? colors.textSecondaryDark : colors.textSecondary }]}>
                  No foods logged yet
                </Text>
              )}
            </View>
            </React.Fragment>
          );
        })}

        <TouchableOpacity
          style={[styles.addMealButton, { backgroundColor: isDark ? colors.cardDark : colors.card, borderColor: isDark ? colors.borderDark : colors.border }]}
          onPress={handleAddSnack}
        >
          <IconSymbol
            ios_icon_name="add_circle"
            android_material_icon_name="add_circle"
            size={24}
            color={colors.primary}
          />
          <Text style={[styles.addMealText, { color: colors.primary }]}>
            Add Snack
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function SummaryItem({ label, value, target, isDark }: any) {
  return (
    <View style={styles.summaryItem}>
      <Text style={[styles.summaryLabel, { color: isDark ? colors.textSecondaryDark : colors.textSecondary }]}>
        {label}
      </Text>
      <Text style={[styles.summaryValue, { color: isDark ? colors.textDark : colors.text }]}>
        {value}
      </Text>
      <Text style={[styles.summaryTarget, { color: isDark ? colors.textSecondaryDark : colors.textSecondary }]}>
        / {target}
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
    ...typography.h2,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: 120,
  },
  summaryCard: {
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 2,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryLabel: {
    ...typography.small,
    marginBottom: spacing.xs,
  },
  summaryValue: {
    ...typography.bodyBold,
    fontSize: 18,
  },
  summaryTarget: {
    ...typography.small,
  },
  mealCard: {
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 2,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  mealTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  mealIcon: {
    fontSize: 24,
  },
  mealTitle: {
    ...typography.h3,
  },
  addButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  foodItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  foodInfo: {
    flex: 1,
  },
  foodName: {
    ...typography.bodyBold,
    marginBottom: 2,
  },
  foodDetails: {
    ...typography.caption,
  },
  foodCalories: {
    ...typography.bodyBold,
  },
  mealTotals: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: spacing.sm,
    marginTop: spacing.sm,
    borderTopWidth: 1,
  },
  totalsLabel: {
    ...typography.bodyBold,
  },
  totalsValue: {
    ...typography.caption,
    fontWeight: '600',
  },
  emptyText: {
    ...typography.body,
    textAlign: 'center',
    paddingVertical: spacing.md,
  },
  addMealButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  addMealText: {
    ...typography.bodyBold,
  },
});
