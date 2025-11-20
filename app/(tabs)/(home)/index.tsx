
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, borderRadius, typography } from '@/styles/commonStyles';
import { useColorScheme } from '@/hooks/useColorScheme';
import ProgressCircle from '@/components/ProgressCircle';
import MacroBar from '@/components/MacroBar';
import { IconSymbol } from '@/components/IconSymbol';
import { supabase } from '@/app/integrations/supabase/client';
import { MealType } from '@/types';

export default function HomeScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  const [goal, setGoal] = useState<any>(null);
  const [summary, setSummary] = useState<any>({
    total_calories: 0,
    total_protein: 0,
    total_carbs: 0,
    total_fats: 0,
    total_fiber: 0,
    weight: 0,
  });
  const [meals, setMeals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('No user found');
        setLoading(false);
        return;
      }

      // Load goal with maybeSingle() to handle 0 rows gracefully
      const { data: goalData, error: goalError } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (goalError) {
        console.error('Error loading goal:', goalError);
      } else if (goalData) {
        console.log('Goal loaded:', goalData);
        setGoal(goalData);
      } else {
        console.log('No active goal found, using defaults');
        // Set default goal if none exists
        setGoal({
          daily_calories: 2000,
          protein_g: 150,
          carbs_g: 200,
          fats_g: 65,
          fiber_g: 30,
        });
      }

      // Load today's meals
      const today = new Date().toISOString().split('T')[0];
      const { data: mealsData, error: mealsError } = await supabase
        .from('meals')
        .select(`
          *,
          meal_items (
            *,
            foods (*)
          )
        `)
        .eq('user_id', user.id)
        .eq('date', today);

      if (mealsError) {
        console.error('Error loading meals:', mealsError);
      } else {
        console.log('Meals loaded:', mealsData);
        setMeals(mealsData || []);
        
        // Calculate totals from meals
        if (mealsData && mealsData.length > 0) {
          const totals = mealsData.reduce((acc: any, meal: any) => {
            if (meal.meal_items) {
              meal.meal_items.forEach((item: any) => {
                acc.total_calories += item.calories || 0;
                acc.total_protein += item.protein || 0;
                acc.total_carbs += item.carbs || 0;
                acc.total_fats += item.fats || 0;
                acc.total_fiber += item.fiber || 0;
              });
            }
            return acc;
          }, {
            total_calories: 0,
            total_protein: 0,
            total_carbs: 0,
            total_fats: 0,
            total_fiber: 0,
          });
          setSummary(totals);
        }
      }

      // Load daily summary
      const { data: summaryData } = await supabase
        .from('daily_summary')
        .select('*')
        .eq('user_id', user.id)
        .eq('date', today)
        .maybeSingle();

      if (summaryData) {
        setSummary((prev: any) => ({ ...prev, weight: summaryData.weight }));
      }
    } catch (error) {
      console.error('Error in loadData:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddFood = (mealType: MealType) => {
    console.log('Add food for meal type:', mealType);
    router.push({
      pathname: '/add-food',
      params: { mealType }
    });
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

  const getMealTotals = (meal: any) => {
    if (!meal.meal_items || meal.meal_items.length === 0) {
      return { calories: 0, protein: 0, carbs: 0, fats: 0 };
    }
    return meal.meal_items.reduce(
      (acc: any, item: any) => ({
        calories: acc.calories + (item.calories || 0),
        protein: acc.protein + (item.protein || 0),
        carbs: acc.carbs + (item.carbs || 0),
        fats: acc.fats + (item.fats || 0),
      }),
      { calories: 0, protein: 0, carbs: 0, fats: 0 }
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: isDark ? colors.backgroundDark : colors.background }]} edges={['top']}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: isDark ? colors.textDark : colors.text }]}>
            Loading...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const caloriesRemaining = (goal?.daily_calories || 2000) - summary.total_calories;
  const streakDays = 7;

  // Define meal order
  const mealOrder: MealType[] = ['breakfast', 'lunch', 'dinner', 'snack'];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? colors.backgroundDark : colors.background }]} edges={['top']}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: isDark ? colors.textSecondaryDark : colors.textSecondary }]}>
              Today&apos;s Progress
            </Text>
            <Text style={[styles.date, { color: isDark ? colors.textDark : colors.text }]}>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </Text>
          </View>
        </View>

        <View style={[styles.caloriesCard, { backgroundColor: isDark ? colors.cardDark : colors.card }]}>
          <View style={styles.caloriesHeader}>
            <Text style={[styles.cardTitle, { color: isDark ? colors.textDark : colors.text }]}>
              Calories
            </Text>
            <View style={styles.streakBadge}>
              <Text style={styles.streakIcon}>🔥</Text>
              <Text style={[styles.streakText, { color: isDark ? colors.textDark : colors.text }]}>
                {streakDays} day streak
              </Text>
            </View>
          </View>
          
          <View style={styles.caloriesContent}>
            <ProgressCircle
              current={summary.total_calories}
              target={goal?.daily_calories || 2000}
              size={140}
              strokeWidth={12}
              color={colors.calories}
              label="kcal"
            />
            
            <View style={styles.caloriesStats}>
              <StatItem
                label="Consumed"
                value={Math.round(summary.total_calories)}
                unit="kcal"
                color={colors.calories}
                isDark={isDark}
              />
              <StatItem
                label="Remaining"
                value={Math.round(caloriesRemaining)}
                unit="kcal"
                color={caloriesRemaining >= 0 ? colors.success : colors.error}
                isDark={isDark}
              />
              <StatItem
                label="Target"
                value={goal?.daily_calories || 2000}
                unit="kcal"
                color={isDark ? colors.textSecondaryDark : colors.textSecondary}
                isDark={isDark}
              />
            </View>
          </View>
        </View>

        <View style={[styles.macrosCard, { backgroundColor: isDark ? colors.cardDark : colors.card }]}>
          <Text style={[styles.cardTitle, { color: isDark ? colors.textDark : colors.text }]}>
            Macronutrients
          </Text>
          
          <View style={styles.macrosContent}>
            <MacroBar
              label="Protein"
              current={summary.total_protein}
              target={goal?.protein_g || 150}
              color={colors.protein}
            />
            <MacroBar
              label="Carbs"
              current={summary.total_carbs}
              target={goal?.carbs_g || 200}
              color={colors.carbs}
            />
            <MacroBar
              label="Fats"
              current={summary.total_fats}
              target={goal?.fats_g || 65}
              color={colors.fats}
            />
            <MacroBar
              label="Fiber"
              current={summary.total_fiber}
              target={goal?.fiber_g || 30}
              color={colors.fiber}
            />
          </View>
        </View>

        {/* Today's Diary Section */}
        <View style={[styles.diaryCard, { backgroundColor: isDark ? colors.cardDark : colors.card }]}>
          <Text style={[styles.cardTitle, { color: isDark ? colors.textDark : colors.text }]}>
            Today&apos;s Diary
          </Text>
          
          {mealOrder.map((mealType, index) => {
            const meal = meals.find(m => m.meal_type === mealType);
            const mealTotals = meal ? getMealTotals(meal) : { calories: 0, protein: 0, carbs: 0, fats: 0 };
            const hasItems = meal && meal.meal_items && meal.meal_items.length > 0;

            return (
              <React.Fragment key={index}>
                <View style={styles.mealRow}>
                  <View style={styles.mealInfo}>
                    <View style={styles.mealTitleRow}>
                      <Text style={styles.mealIcon}>{getMealIcon(mealType)}</Text>
                      <Text style={[styles.mealTitle, { color: isDark ? colors.textDark : colors.text }]}>
                        {getMealLabel(mealType)}
                      </Text>
                    </View>
                    {hasItems && (
                      <Text style={[styles.mealCalories, { color: isDark ? colors.textSecondaryDark : colors.textSecondary }]}>
                        {Math.round(mealTotals.calories)} kcal
                      </Text>
                    )}
                  </View>
                  <TouchableOpacity
                    style={[styles.addMealButton, { backgroundColor: colors.primary }]}
                    onPress={() => handleAddFood(mealType)}
                  >
                    <IconSymbol
                      ios_icon_name="add"
                      android_material_icon_name="add"
                      size={20}
                      color="#FFFFFF"
                    />
                  </TouchableOpacity>
                </View>
              </React.Fragment>
            );
          })}
        </View>

        <View style={[styles.quickActionsCard, { backgroundColor: isDark ? colors.cardDark : colors.card }]}>
          <Text style={[styles.cardTitle, { color: isDark ? colors.textDark : colors.text }]}>
            Quick Actions
          </Text>
          
          <View style={styles.quickActions}>
            <QuickActionButton
              icon="camera"
              label="AI Meal Estimator"
              onPress={() => router.push('/ai-meal-estimator')}
              isDark={isDark}
            />
            <QuickActionButton
              icon="qr_code_scanner"
              label="Barcode Scan"
              onPress={() => router.push('/barcode-scanner')}
              isDark={isDark}
            />
            <QuickActionButton
              icon="scale"
              label="Log Weight"
              onPress={() => router.push('/(tabs)/progress')}
              isDark={isDark}
            />
          </View>
        </View>

        {summary.weight > 0 && (
          <View style={[styles.weightCard, { backgroundColor: isDark ? colors.cardDark : colors.card }]}>
            <View style={styles.weightHeader}>
              <Text style={[styles.cardTitle, { color: isDark ? colors.textDark : colors.text }]}>
                Current Weight
              </Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/progress')}>
                <Text style={[styles.viewAllText, { color: colors.primary }]}>
                  View Chart
                </Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.weightContent}>
              <Text style={[styles.weightValue, { color: isDark ? colors.textDark : colors.text }]}>
                {Math.round(summary.weight)} kg
              </Text>
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function StatItem({ label, value, unit, color, isDark }: any) {
  return (
    <View style={styles.statItem}>
      <Text style={[styles.statValue, { color }]}>
        {value}
      </Text>
      <Text style={[styles.statLabel, { color: isDark ? colors.textSecondaryDark : colors.textSecondary }]}>
        {label}
      </Text>
    </View>
  );
}

function QuickActionButton({ icon, label, onPress, isDark }: any) {
  return (
    <TouchableOpacity
      style={[styles.quickActionButton, { backgroundColor: isDark ? colors.backgroundDark : colors.background }]}
      onPress={onPress}
    >
      <IconSymbol
        ios_icon_name={icon}
        android_material_icon_name={icon}
        size={28}
        color={colors.primary}
      />
      <Text style={[styles.quickActionLabel, { color: isDark ? colors.textDark : colors.text }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    ...typography.body,
  },
  scrollContent: {
    paddingTop: Platform.OS === 'android' ? spacing.lg : 0,
    paddingHorizontal: spacing.md,
    paddingBottom: 120,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  greeting: {
    ...typography.caption,
    marginBottom: spacing.xs,
  },
  date: {
    ...typography.h2,
  },
  caloriesCard: {
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 2,
  },
  caloriesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  cardTitle: {
    ...typography.h3,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  streakIcon: {
    fontSize: 16,
  },
  streakText: {
    ...typography.caption,
    fontWeight: '600',
  },
  caloriesContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  caloriesStats: {
    flex: 1,
    gap: spacing.md,
  },
  statItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statValue: {
    ...typography.bodyBold,
    fontSize: 18,
  },
  statLabel: {
    ...typography.caption,
  },
  macrosCard: {
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 2,
  },
  macrosContent: {
    marginTop: spacing.md,
  },
  diaryCard: {
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 2,
  },
  mealRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  mealInfo: {
    flex: 1,
  },
  mealTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  mealIcon: {
    fontSize: 20,
  },
  mealTitle: {
    ...typography.bodyBold,
  },
  mealCalories: {
    ...typography.caption,
  },
  addMealButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  quickActionsCard: {
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 2,
  },
  quickActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  quickActionButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  quickActionLabel: {
    ...typography.small,
    fontWeight: '600',
    textAlign: 'center',
  },
  weightCard: {
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 2,
  },
  weightHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  viewAllText: {
    ...typography.caption,
    fontWeight: '600',
  },
  weightContent: {
    alignItems: 'center',
  },
  weightValue: {
    fontSize: 36,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
});
