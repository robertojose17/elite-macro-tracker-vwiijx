
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, borderRadius, typography } from '@/styles/commonStyles';
import { useColorScheme } from '@/hooks/useColorScheme';
import { ActivityLevel } from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/app/integrations/supabase/client';

export default function ActivityScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [activity, setActivity] = useState<ActivityLevel>('moderate');

  const handleContinue = async () => {
    const existingData = await AsyncStorage.getItem('onboarding_data');
    const data = existingData ? JSON.parse(existingData) : {};
    
    data.activity_level = activity;

    await AsyncStorage.setItem('onboarding_data', JSON.stringify(data));

    // Also update user profile in Supabase
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase
        .from('users')
        .update({
          activity_level: activity,
        })
        .eq('id', user.id);
    }

    router.push('/onboarding/macros');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? colors.backgroundDark : colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: isDark ? colors.textDark : colors.text }]}>
            Activity Level
          </Text>
          <Text style={[styles.subtitle, { color: isDark ? colors.textSecondaryDark : colors.textSecondary }]}>
            How active are you on a typical day?
          </Text>
        </View>

        <View style={styles.section}>
          <ActivityOption
            label="Sedentary"
            description="Little or no exercise, desk job"
            selected={activity === 'sedentary'}
            onPress={() => setActivity('sedentary')}
            isDark={isDark}
          />
          <ActivityOption
            label="Lightly Active"
            description="Light exercise 1-3 days/week"
            selected={activity === 'light'}
            onPress={() => setActivity('light')}
            isDark={isDark}
          />
          <ActivityOption
            label="Moderately Active"
            description="Moderate exercise 3-5 days/week"
            selected={activity === 'moderate'}
            onPress={() => setActivity('moderate')}
            isDark={isDark}
          />
          <ActivityOption
            label="Very Active"
            description="Hard exercise 6-7 days/week"
            selected={activity === 'active'}
            onPress={() => setActivity('active')}
            isDark={isDark}
          />
          <ActivityOption
            label="Extremely Active"
            description="Physical job + hard exercise daily"
            selected={activity === 'very_active'}
            onPress={() => setActivity('very_active')}
            isDark={isDark}
          />
        </View>

        <TouchableOpacity
          style={[styles.button, { backgroundColor: colors.primary }]}
          onPress={handleContinue}
        >
          <Text style={styles.buttonText}>Continue</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function ActivityOption({ label, description, selected, onPress, isDark }: any) {
  return (
    <TouchableOpacity
      style={[
        styles.activityOption,
        { backgroundColor: isDark ? colors.cardDark : colors.card, borderColor: isDark ? colors.borderDark : colors.border },
        selected && { backgroundColor: colors.primary, borderColor: colors.primary },
      ]}
      onPress={onPress}
    >
      <View style={styles.activityContent}>
        <Text style={[styles.activityLabel, { color: isDark ? colors.textDark : colors.text }, selected && { color: '#FFFFFF' }]}>
          {label}
        </Text>
        <Text style={[styles.activityDescription, { color: isDark ? colors.textSecondaryDark : colors.textSecondary }, selected && { color: 'rgba(255,255,255,0.8)' }]}>
          {description}
        </Text>
      </View>
      <View style={[styles.radio, { borderColor: selected ? '#FFFFFF' : (isDark ? colors.borderDark : colors.border) }]}>
        {selected && <View style={styles.radioInner} />}
      </View>
    </TouchableOpacity>
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
  header: {
    marginBottom: spacing.xl,
  },
  title: {
    ...typography.h1,
    marginBottom: spacing.sm,
  },
  subtitle: {
    ...typography.body,
  },
  section: {
    marginBottom: spacing.xl,
  },
  activityOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 2,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  activityContent: {
    flex: 1,
  },
  activityLabel: {
    ...typography.bodyBold,
    marginBottom: 2,
  },
  activityDescription: {
    ...typography.caption,
  },
  radio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
  },
  button: {
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
});
