
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, borderRadius, typography } from '@/styles/commonStyles';
import { useColorScheme } from '@/hooks/useColorScheme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { calculateGoalFromOnboarding } from '@/utils/calculations';
import { OnboardingData } from '@/types';
import { supabase } from '@/integrations/supabase/client';

export default function ResultsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [results, setResults] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadResults();
  }, []);

  const loadResults = async () => {
    const data = await AsyncStorage.getItem('onboarding_data');
    if (data) {
      const onboardingData: OnboardingData = JSON.parse(data);
      const calculatedResults = calculateGoalFromOnboarding(onboardingData);
      setResults({ ...calculatedResults, onboardingData });
    }
  };

  const handleFinish = async () => {
    setSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.error('No user found');
        setSaving(false);
        return;
      }

      const data = await AsyncStorage.getItem('onboarding_data');
      if (!data) {
        console.error('No onboarding data found');
        setSaving(false);
        return;
      }

      const onboardingData: OnboardingData = JSON.parse(data);

      // Deactivate any existing goals
      await supabase
        .from('goals')
        .update({ is_active: false })
        .eq('user_id', user.id)
        .eq('is_active', true);

      // Create new goal
      const { error: goalError } = await supabase
        .from('goals')
        .insert({
          user_id: user.id,
          goal_type: onboardingData.goal_type || 'maintain',
          goal_intensity: onboardingData.goal_intensity || 1,
          daily_calories: results.daily_calories,
          protein_g: results.protein_g,
          carbs_g: results.carbs_g,
          fats_g: results.fats_g,
          fiber_g: results.fiber_g,
          is_active: true,
        });

      if (goalError) {
        console.error('Goal creation error:', goalError);
      }

      // Mark onboarding as complete
      await supabase
        .from('users')
        .update({ onboarding_completed: true })
        .eq('id', user.id);

      // Clear onboarding data
      await AsyncStorage.removeItem('onboarding_data');
      await AsyncStorage.setItem('onboarding_complete', 'true');

      router.replace('/(tabs)/(home)/');
    } catch (error) {
      console.error('Error saving goal:', error);
    } finally {
      setSaving(false);
    }
  };

  if (!results) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: isDark ? colors.backgroundDark : colors.background }]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: isDark ? colors.textDark : colors.text }]}>
            Calculating your personalized plan...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? colors.backgroundDark : colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.successIcon}>🎉</Text>
          <Text style={[styles.title, { color: isDark ? colors.textDark : colors.text }]}>
            Your Personalized Plan
          </Text>
          <Text style={[styles.subtitle, { color: isDark ? colors.textSecondaryDark : colors.textSecondary }]}>
            Here are your daily nutrition targets
          </Text>
        </View>

        <View style={[styles.resultsCard, { backgroundColor: isDark ? colors.cardDark : colors.card }]}>
          <View style={styles.mainResult}>
            <Text style={[styles.mainValue, { color: colors.primary }]}>
              {results.daily_calories}
            </Text>
            <Text style={[styles.mainLabel, { color: isDark ? colors.textDark : colors.text }]}>
              Daily Calories
            </Text>
          </View>

          <View style={[styles.divider, { backgroundColor: isDark ? colors.borderDark : colors.border }]} />

          <View style={styles.macrosGrid}>
            <MacroResult
              label="Protein"
              value={results.protein_g}
              color={colors.protein}
              isDark={isDark}
            />
            <MacroResult
              label="Carbs"
              value={results.carbs_g}
              color={colors.carbs}
              isDark={isDark}
            />
            <MacroResult
              label="Fats"
              value={results.fats_g}
              color={colors.fats}
              isDark={isDark}
            />
            <MacroResult
              label="Fiber"
              value={results.fiber_g}
              color={colors.fiber}
              isDark={isDark}
            />
          </View>
        </View>

        <View style={[styles.tipsCard, { backgroundColor: isDark ? colors.cardDark : colors.card }]}>
          <Text style={[styles.tipsTitle, { color: isDark ? colors.textDark : colors.text }]}>
            💡 Quick Tips
          </Text>
          <Text style={[styles.tipText, { color: isDark ? colors.textSecondaryDark : colors.textSecondary }]}>
            - Log your meals consistently for best results
          </Text>
          <Text style={[styles.tipText, { color: isDark ? colors.textSecondaryDark : colors.textSecondary }]}>
            - Weigh yourself weekly at the same time
          </Text>
          <Text style={[styles.tipText, { color: isDark ? colors.textSecondaryDark : colors.textSecondary }]}>
            - Adjust targets based on progress
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary, opacity: saving ? 0.7 : 1 }]}
          onPress={handleFinish}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>Start Tracking</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function MacroResult({ label, value, color, isDark }: any) {
  return (
    <View style={styles.macroResult}>
      <Text style={[styles.macroValue, { color }]}>
        {value}g
      </Text>
      <Text style={[styles.macroLabel, { color: isDark ? colors.textSecondaryDark : colors.textSecondary }]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: Platform.OS === 'android' ? spacing.xxl : spacing.md,
    paddingBottom: spacing.xxl,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  loadingText: {
    ...typography.body,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  successIcon: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  title: {
    ...typography.h1,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body,
    textAlign: 'center',
  },
  resultsCard: {
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    boxShadow: '0px 4px 12px rgba(0, 0, 0, 0.1)',
    elevation: 3,
  },
  mainResult: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  mainValue: {
    fontSize: 48,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  mainLabel: {
    ...typography.h3,
  },
  divider: {
    height: 1,
    marginBottom: spacing.lg,
  },
  macrosGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  macroResult: {
    width: '48%',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  macroValue: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  macroLabel: {
    ...typography.caption,
  },
  tipsCard: {
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  tipsTitle: {
    ...typography.h3,
    marginBottom: spacing.md,
  },
  tipText: {
    ...typography.body,
    marginBottom: spacing.xs,
  },
  button: {
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
});
