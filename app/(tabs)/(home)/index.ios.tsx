
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, RefreshControl, Alert } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, borderRadius, typography } from '@/styles/commonStyles';
import { useColorScheme } from '@/hooks/useColorScheme';
import ProgressCircle from '@/components/ProgressCircle';
import MacroBar from '@/components/MacroBar';
import { IconSymbol } from '@/components/IconSymbol';
import { supabase } from '@/app/integrations/supabase/client';

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
  });
  const [foodItems, setFoodItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());

  useFocusEffect(
    useCallback(() => {
      console.log('[Home iOS] Screen focused, loading data');
      loadData();
    }, [selectedDate])
  );

  const loadData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.log('[Home iOS] No user found');
        setLoading(false);
        return;
      }

      console.log('[Home iOS] Loading data for user:', user.id);

      // Load goal
      const { data: goalData, error: goalError } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (goalError) {
        console.error('[Home iOS] Error loading goal:', goalError);
      } else if (goalData) {
        console.log('[Home iOS] Goal loaded:', goalData);
        setGoal(goalData);
      } else {
        console.log('[Home iOS] No active goal found, using defaults');
        setGoal({
          daily_calories: 2000,
          protein_g: 150,
          carbs_g: 200,
          fats_g: 65,
          fiber_g: 30,
        });
      }

      // Load meals for selected date
      const dateString = selectedDate.toISOString().split('T')[0];
      const { data: mealsData, error: mealsError } = await supabase
        .from('meals')
        .select(`
          id,
          meal_type,
          meal_items (
            id,
            quantity,
            calories,
            protein,
            carbs,
            fats,
            fiber,
            foods (
              id,
              name,
              brand,
              user_created
            )
          )
        `)
        .eq('user_id', user.id)
        .eq('date', dateString);

      if (mealsError) {
        console.error('[Home iOS] Error loading meals:', mealsError);
      } else {
        console.log('[Home iOS] Meals loaded:', mealsData);
        
        // Flatten meal items for display
        const items: any[] = [];
        let totals = {
          total_calories: 0,
          total_protein: 0,
          total_carbs: 0,
          total_fats: 0,
          total_fiber: 0,
        };

        if (mealsData && mealsData.length > 0) {
          mealsData.forEach((meal: any) => {
            if (meal.meal_items) {
              meal.meal_items.forEach((item: any) => {
                items.push({
                  ...item,
                  meal_type: meal.meal_type,
                });
                totals.total_calories += item.calories || 0;
                totals.total_protein += item.protein || 0;
                totals.total_carbs += item.carbs || 0;
                totals.total_fats += item.fats || 0;
                totals.total_fiber += item.fiber || 0;
              });
            }
          });
        }

        console.log('[Home iOS] Food items:', items.length);
        console.log('[Home iOS] Totals:', totals);
        setFoodItems(items);
        setSummary(totals);
      }
    } catch (error) {
      console.error('[Home iOS] Error in loadData:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  const handleAddFood = () => {
    console.log('[Home iOS] Opening add food screen');
    const dateString = selectedDate.toISOString().split('T')[0];
    router.push(`/add-food-simple?date=${dateString}`);
  };

  const handleEditFood = (item: any) => {
    console.log('[Home iOS] Opening edit food:', item.id);
    const dateString = selectedDate.toISOString().split('T')[0];
    router.push({
      pathname: '/edit-food',
      params: {
        itemId: item.id,
        date: dateString,
      },
    });
  };

  const handleDeleteFood = (item: any) => {
    Alert.alert(
      'Delete Food',
      `Are you sure you want to delete ${item.foods?.name || 'this food'}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('meal_items')
                .delete()
                .eq('id', item.id);

              if (error) {
                console.error('[Home iOS] Error deleting food:', error);
                Alert.alert('Error', 'Failed to delete food');
              } else {
                console.log('[Home iOS] Food deleted successfully');
                loadData();
              }
            } catch (error) {
              console.error('[Home iOS] Error in handleDeleteFood:', error);
              Alert.alert('Error', 'An unexpected error occurred');
            }
          },
        },
      ]
    );
  };

  const goToPreviousDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() - 1);
    setSelectedDate(newDate);
  };

  const goToNextDay = () => {
    const newDate = new Date(selectedDate);
    newDate.setDate(newDate.getDate() + 1);
    setSelectedDate(newDate);
  };

  const goToToday = () => {
    setSelectedDate(new Date());
  };

  const isToday = () => {
    const today = new Date();
    return selectedDate.toDateString() === today.toDateString();
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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? colors.backgroundDark : colors.background }]} edges={['top']}>
      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Date Navigation */}
        <View style={[styles.dateNavigation, { backgroundColor: isDark ? colors.cardDark : colors.card }]}>
          <TouchableOpacity onPress={goToPreviousDay} style={styles.dateButton}>
            <IconSymbol
              ios_icon_name="chevron.left"
              android_material_icon_name="chevron_left"
              size={24}
              color={isDark ? colors.textDark : colors.text}
            />
          </TouchableOpacity>
          
          <View style={styles.dateCenter}>
            <Text style={[styles.dateLabel, { color: isDark ? colors.textSecondaryDark : colors.textSecondary }]}>
              {isToday() ? 'Today' : selectedDate.toLocaleDateString('en-US', { weekday: 'short' })}
            </Text>
            <Text style={[styles.dateText, { color: isDark ? colors.textDark : colors.text }]}>
              {selectedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </Text>
          </View>

          <TouchableOpacity onPress={goToNextDay} style={styles.dateButton}>
            <IconSymbol
              ios_icon_name="chevron.right"
              android_material_icon_name="chevron_right"
              size={24}
              color={isDark ? colors.textDark : colors.text}
            />
          </TouchableOpacity>
        </View>

        {!isToday() && (
          <TouchableOpacity 
            style={[styles.todayButton, { backgroundColor: colors.primary }]}
            onPress={goToToday}
          >
            <Text style={styles.todayButtonText}>Go to Today</Text>
          </TouchableOpacity>
        )}

        <View style={[styles.caloriesCard, { backgroundColor: isDark ? colors.cardDark : colors.card }]}>
          <Text style={[styles.cardTitle, { color: isDark ? colors.textDark : colors.text }]}>
            Calories
          </Text>
          
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

        <View style={[styles.foodsCard, { backgroundColor: isDark ? colors.cardDark : colors.card }]}>
          <View style={styles.foodsHeader}>
            <Text style={[styles.cardTitle, { color: isDark ? colors.textDark : colors.text }]}>
              Foods
            </Text>
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: colors.primary }]}
              onPress={handleAddFood}
            >
              <IconSymbol
                ios_icon_name="add"
                android_material_icon_name="add"
                size={20}
                color="#FFFFFF"
              />
              <Text style={styles.addButtonText}>Add Food</Text>
            </TouchableOpacity>
          </View>

          {foodItems.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyIcon}>🍽️</Text>
              <Text style={[styles.emptyText, { color: isDark ? colors.textSecondaryDark : colors.textSecondary }]}>
                No foods logged for this date
              </Text>
              <Text style={[styles.emptySubtext, { color: isDark ? colors.textSecondaryDark : colors.textSecondary }]}>
                Tap &quot;Add Food&quot; to start tracking
              </Text>
            </View>
          ) : (
            <View style={styles.foodsList}>
              {foodItems.map((item, index) => (
                <React.Fragment key={index}>
                  <TouchableOpacity 
                    style={styles.foodItem}
                    onPress={() => handleEditFood(item)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.foodInfo}>
                      <Text style={[styles.foodName, { color: isDark ? colors.textDark : colors.text }]}>
                        {item.foods?.name || 'Unknown Food'}
                      </Text>
                      {item.foods?.brand && (
                        <Text style={[styles.foodBrand, { color: isDark ? colors.textSecondaryDark : colors.textSecondary }]}>
                          {item.foods.brand}
                        </Text>
                      )}
                      <Text style={[styles.foodMacros, { color: isDark ? colors.textSecondaryDark : colors.textSecondary }]}>
                        {Math.round(item.calories)} kcal • P: {Math.round(item.protein)}g • C: {Math.round(item.carbs)}g • F: {Math.round(item.fats)}g
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={styles.deleteButton}
                      onPress={() => handleDeleteFood(item)}
                    >
                      <IconSymbol
                        ios_icon_name="trash"
                        android_material_icon_name="delete"
                        size={20}
                        color={colors.error}
                      />
                    </TouchableOpacity>
                  </TouchableOpacity>
                </React.Fragment>
              ))}
            </View>
          )}
        </View>
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
  dateNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 2,
  },
  dateButton: {
    padding: spacing.sm,
  },
  dateCenter: {
    alignItems: 'center',
    flex: 1,
  },
  dateLabel: {
    ...typography.caption,
    marginBottom: 2,
  },
  dateText: {
    ...typography.h3,
  },
  todayButton: {
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  todayButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  caloriesCard: {
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 2,
  },
  cardTitle: {
    ...typography.h3,
    marginBottom: spacing.md,
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
    gap: spacing.md,
  },
  foodsCard: {
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 2,
  },
  foodsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.sm,
  },
  emptyText: {
    ...typography.body,
    marginBottom: spacing.xs,
  },
  emptySubtext: {
    ...typography.caption,
  },
  foodsList: {
    gap: spacing.sm,
  },
  foodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  foodInfo: {
    flex: 1,
  },
  foodName: {
    ...typography.bodyBold,
    marginBottom: 2,
  },
  foodBrand: {
    ...typography.caption,
    marginBottom: 2,
  },
  foodMacros: {
    ...typography.caption,
  },
  deleteButton: {
    padding: spacing.xs,
    marginLeft: spacing.sm,
  },
});
