
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, borderRadius, typography } from '@/styles/commonStyles';
import { useColorScheme } from '@/hooks/useColorScheme';
import ProgressCircle from '@/components/ProgressCircle';
import MacroBar from '@/components/MacroBar';
import { mockGoal, mockDailySummary } from '@/data/mockData';
import { IconSymbol } from '@/components/IconSymbol';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function HomeScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const [onboardingComplete, setOnboardingComplete] = useState(false);

  useEffect(() => {
    checkOnboarding();
  }, []);

  const checkOnboarding = async () => {
    const complete = await AsyncStorage.getItem('onboarding_complete');
    setOnboardingComplete(complete === 'true');
  };

  const goal = mockGoal;
  const summary = mockDailySummary;

  const caloriesRemaining = goal.daily_calories - summary.total_calories;
  const streakDays = 7;

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
          {!onboardingComplete && (
            <TouchableOpacity
              style={[styles.setupButton, { backgroundColor: colors.accent }]}
              onPress={() => router.push('/onboarding/welcome')}
            >
              <Text style={styles.setupButtonText}>Setup</Text>
            </TouchableOpacity>
          )}
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
              target={goal.daily_calories}
              size={140}
              strokeWidth={12}
              color={colors.calories}
              label="kcal"
            />
            
            <View style={styles.caloriesStats}>
              <StatItem
                label="Consumed"
                value={summary.total_calories}
                unit="kcal"
                color={colors.calories}
                isDark={isDark}
              />
              <StatItem
                label="Remaining"
                value={caloriesRemaining}
                unit="kcal"
                color={caloriesRemaining >= 0 ? colors.success : colors.error}
                isDark={isDark}
              />
              <StatItem
                label="Target"
                value={goal.daily_calories}
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
              target={goal.protein_g}
              color={colors.protein}
            />
            <MacroBar
              label="Carbs"
              current={summary.total_carbs}
              target={goal.carbs_g}
              color={colors.carbs}
            />
            <MacroBar
              label="Fats"
              current={summary.total_fats}
              target={goal.fats_g}
              color={colors.fats}
            />
            <MacroBar
              label="Fiber"
              current={summary.total_fiber}
              target={goal.fiber_g}
              color={colors.fiber}
            />
          </View>
        </View>

        <View style={[styles.quickActionsCard, { backgroundColor: isDark ? colors.cardDark : colors.card }]}>
          <Text style={[styles.cardTitle, { color: isDark ? colors.textDark : colors.text }]}>
            Quick Actions
          </Text>
          
          <View style={styles.quickActions}>
            <QuickActionButton
              icon="restaurant"
              label="Add Food"
              onPress={() => router.push('/(tabs)/diary')}
              isDark={isDark}
            />
            <QuickActionButton
              icon="scale"
              label="Log Weight"
              onPress={() => router.push('/(tabs)/progress')}
              isDark={isDark}
            />
            <QuickActionButton
              icon="water_drop"
              label="Water"
              onPress={() => console.log('Log water')}
              isDark={isDark}
            />
          </View>
        </View>

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
              {summary.weight} kg
            </Text>
            <Text style={[styles.weightChange, { color: colors.success }]}>
              -2 kg this month
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatItem({ label, value, unit, color, isDark }: any) {
  return (
    <View style={styles.statItem}>
      <Text style={[styles.statValue, { color }]}>
        {Math.round(value)}
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
  setupButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  setupButtonText: {
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
  weightChange: {
    ...typography.body,
    fontWeight: '600',
  },
});
