
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, borderRadius, typography } from '@/styles/commonStyles';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Sex, ActivityLevel } from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function PersonalInfoScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [sex, setSex] = useState<Sex>('male');
  const [age, setAge] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [activity, setActivity] = useState<ActivityLevel>('moderate');

  const handleContinue = async () => {
    if (!age || !height || !weight) {
      alert('Please fill in all fields');
      return;
    }

    const data = {
      sex,
      age: parseInt(age),
      height: parseInt(height),
      weight: parseFloat(weight),
      activity_level: activity,
    };

    await AsyncStorage.setItem('onboarding_data', JSON.stringify(data));
    router.push('/onboarding/goals');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? colors.backgroundDark : colors.background }]}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: isDark ? colors.textDark : colors.text }]}>
            Tell us about yourself
          </Text>
          <Text style={[styles.subtitle, { color: isDark ? colors.textSecondaryDark : colors.textSecondary }]}>
            We&apos;ll use this to calculate your personalized goals
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.label, { color: isDark ? colors.textDark : colors.text }]}>Sex</Text>
          <View style={styles.optionRow}>
            <TouchableOpacity
              style={[
                styles.optionButton,
                sex === 'male' && styles.optionButtonActive,
                { backgroundColor: isDark ? colors.cardDark : colors.card, borderColor: isDark ? colors.borderDark : colors.border },
                sex === 'male' && { backgroundColor: colors.primary, borderColor: colors.primary },
              ]}
              onPress={() => setSex('male')}
            >
              <Text style={[styles.optionText, { color: isDark ? colors.textDark : colors.text }, sex === 'male' && { color: '#FFFFFF' }]}>
                Male
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.optionButton,
                sex === 'female' && styles.optionButtonActive,
                { backgroundColor: isDark ? colors.cardDark : colors.card, borderColor: isDark ? colors.borderDark : colors.border },
                sex === 'female' && { backgroundColor: colors.primary, borderColor: colors.primary },
              ]}
              onPress={() => setSex('female')}
            >
              <Text style={[styles.optionText, { color: isDark ? colors.textDark : colors.text }, sex === 'female' && { color: '#FFFFFF' }]}>
                Female
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.label, { color: isDark ? colors.textDark : colors.text }]}>Age</Text>
          <TextInput
            style={[styles.input, { backgroundColor: isDark ? colors.cardDark : colors.card, borderColor: isDark ? colors.borderDark : colors.border, color: isDark ? colors.textDark : colors.text }]}
            placeholder="Enter your age"
            placeholderTextColor={isDark ? colors.textSecondaryDark : colors.textSecondary}
            keyboardType="number-pad"
            value={age}
            onChangeText={setAge}
          />
        </View>

        <View style={styles.section}>
          <Text style={[styles.label, { color: isDark ? colors.textDark : colors.text }]}>Height (cm)</Text>
          <TextInput
            style={[styles.input, { backgroundColor: isDark ? colors.cardDark : colors.card, borderColor: isDark ? colors.borderDark : colors.border, color: isDark ? colors.textDark : colors.text }]}
            placeholder="Enter your height"
            placeholderTextColor={isDark ? colors.textSecondaryDark : colors.textSecondary}
            keyboardType="number-pad"
            value={height}
            onChangeText={setHeight}
          />
        </View>

        <View style={styles.section}>
          <Text style={[styles.label, { color: isDark ? colors.textDark : colors.text }]}>Weight (kg)</Text>
          <TextInput
            style={[styles.input, { backgroundColor: isDark ? colors.cardDark : colors.card, borderColor: isDark ? colors.borderDark : colors.border, color: isDark ? colors.textDark : colors.text }]}
            placeholder="Enter your weight"
            placeholderTextColor={isDark ? colors.textSecondaryDark : colors.textSecondary}
            keyboardType="decimal-pad"
            value={weight}
            onChangeText={setWeight}
          />
        </View>

        <View style={styles.section}>
          <Text style={[styles.label, { color: isDark ? colors.textDark : colors.text }]}>Activity Level</Text>
          <ActivityOption
            label="Sedentary"
            description="Little or no exercise"
            selected={activity === 'sedentary'}
            onPress={() => setActivity('sedentary')}
            isDark={isDark}
          />
          <ActivityOption
            label="Lightly Active"
            description="Exercise 1-3 days/week"
            selected={activity === 'light'}
            onPress={() => setActivity('light')}
            isDark={isDark}
          />
          <ActivityOption
            label="Moderately Active"
            description="Exercise 3-5 days/week"
            selected={activity === 'moderate'}
            onPress={() => setActivity('moderate')}
            isDark={isDark}
          />
          <ActivityOption
            label="Very Active"
            description="Exercise 6-7 days/week"
            selected={activity === 'active'}
            onPress={() => setActivity('active')}
            isDark={isDark}
          />
          <ActivityOption
            label="Extremely Active"
            description="Physical job + exercise"
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
    marginBottom: spacing.lg,
  },
  label: {
    ...typography.bodyBold,
    marginBottom: spacing.sm,
  },
  optionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  optionButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    alignItems: 'center',
  },
  optionButtonActive: {
    // Styles applied inline
  },
  optionText: {
    ...typography.bodyBold,
  },
  input: {
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    fontSize: 16,
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
