
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, TextInput, KeyboardAvoidingView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, borderRadius, typography } from '@/styles/commonStyles';
import { useColorScheme } from '@/hooks/useColorScheme';
import { GoalType } from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function GoalsScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [goalType, setGoalType] = useState<GoalType>('lose');
  const [intensity, setIntensity] = useState(1);
  const [targetWeight, setTargetWeight] = useState('');

  const handleContinue = async () => {
    const existingData = await AsyncStorage.getItem('onboarding_data');
    const data = existingData ? JSON.parse(existingData) : {};
    
    data.goal_type = goalType;
    data.goal_intensity = intensity;
    if (targetWeight) {
      data.target_weight = parseFloat(targetWeight);
    }

    await AsyncStorage.setItem('onboarding_data', JSON.stringify(data));
    router.push('/onboarding/activity');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? colors.backgroundDark : colors.background }]} edges={['top']}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
        keyboardVerticalOffset={0}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent} 
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.header}>
            <Text style={[styles.title, { color: isDark ? colors.textDark : colors.text }]}>
              What&apos;s your goal?
            </Text>
            <Text style={[styles.subtitle, { color: isDark ? colors.textSecondaryDark : colors.textSecondary }]}>
              Choose your primary fitness objective
            </Text>
          </View>

          <View style={styles.section}>
            <GoalOption
              icon="📉"
              label="Lose Weight"
              description="Create a calorie deficit"
              selected={goalType === 'lose'}
              onPress={() => setGoalType('lose')}
              isDark={isDark}
            />
            <GoalOption
              icon="⚖️"
              label="Maintain Weight"
              description="Stay at current weight"
              selected={goalType === 'maintain'}
              onPress={() => setGoalType('maintain')}
              isDark={isDark}
            />
            <GoalOption
              icon="📈"
              label="Gain Muscle"
              description="Build muscle mass"
              selected={goalType === 'gain'}
              onPress={() => setGoalType('gain')}
              isDark={isDark}
            />
          </View>

          {goalType !== 'maintain' && (
            <>
              <View style={styles.section}>
                <Text style={[styles.label, { color: isDark ? colors.textDark : colors.text }]}>
                  Intensity
                </Text>
                <View style={styles.intensityContainer}>
                  <IntensityOption
                    label="Slow"
                    value={0.5}
                    selected={intensity === 0.5}
                    onPress={() => setIntensity(0.5)}
                    isDark={isDark}
                  />
                  <IntensityOption
                    label="Moderate"
                    value={1}
                    selected={intensity === 1}
                    onPress={() => setIntensity(1)}
                    isDark={isDark}
                  />
                  <IntensityOption
                    label="Aggressive"
                    value={1.5}
                    selected={intensity === 1.5}
                    onPress={() => setIntensity(1.5)}
                    isDark={isDark}
                  />
                </View>
                <Text style={[styles.intensityNote, { color: isDark ? colors.textSecondaryDark : colors.textSecondary }]}>
                  {goalType === 'lose' 
                    ? `${intensity === 0.5 ? '250' : intensity === 1 ? '500' : '750'} calorie deficit per day`
                    : `${intensity === 0.5 ? '150' : intensity === 1 ? '300' : '450'} calorie surplus per day`
                  }
                </Text>
              </View>

              <View style={styles.section}>
                <Text style={[styles.label, { color: isDark ? colors.textDark : colors.text }]}>
                  Target Weight (optional)
                </Text>
                <TextInput
                  style={[styles.input, { backgroundColor: isDark ? colors.cardDark : colors.card, borderColor: isDark ? colors.borderDark : colors.border, color: isDark ? colors.textDark : colors.text }]}
                  placeholder="Enter your target weight"
                  placeholderTextColor={isDark ? colors.textSecondaryDark : colors.textSecondary}
                  keyboardType="decimal-pad"
                  value={targetWeight}
                  onChangeText={setTargetWeight}
                  returnKeyType="done"
                />
              </View>
            </>
          )}

          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary }]}
            onPress={handleContinue}
          >
            <Text style={styles.buttonText}>Continue</Text>
          </TouchableOpacity>
          
          <View style={styles.bottomSpacer} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function GoalOption({ icon, label, description, selected, onPress, isDark }: any) {
  return (
    <TouchableOpacity
      style={[
        styles.goalOption,
        { backgroundColor: isDark ? colors.cardDark : colors.card, borderColor: isDark ? colors.borderDark : colors.border },
        selected && { backgroundColor: colors.primary, borderColor: colors.primary },
      ]}
      onPress={onPress}
    >
      <Text style={styles.goalIcon}>{icon}</Text>
      <View style={styles.goalContent}>
        <Text style={[styles.goalLabel, { color: isDark ? colors.textDark : colors.text }, selected && { color: '#FFFFFF' }]}>
          {label}
        </Text>
        <Text style={[styles.goalDescription, { color: isDark ? colors.textSecondaryDark : colors.textSecondary }, selected && { color: 'rgba(255,255,255,0.8)' }]}>
          {description}
        </Text>
      </View>
      <View style={[styles.radio, { borderColor: selected ? '#FFFFFF' : (isDark ? colors.borderDark : colors.border) }]}>
        {selected && <View style={styles.radioInner} />}
      </View>
    </TouchableOpacity>
  );
}

function IntensityOption({ label, value, selected, onPress, isDark }: any) {
  return (
    <TouchableOpacity
      style={[
        styles.intensityOption,
        { backgroundColor: isDark ? colors.cardDark : colors.card, borderColor: isDark ? colors.borderDark : colors.border },
        selected && { backgroundColor: colors.primary, borderColor: colors.primary },
      ]}
      onPress={onPress}
    >
      <Text style={[styles.intensityLabel, { color: isDark ? colors.textDark : colors.text }, selected && { color: '#FFFFFF' }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
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
  label: {
    ...typography.bodyBold,
    marginBottom: spacing.md,
  },
  goalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  goalIcon: {
    fontSize: 32,
    marginRight: spacing.md,
  },
  goalContent: {
    flex: 1,
  },
  goalLabel: {
    ...typography.bodyBold,
    marginBottom: 2,
  },
  goalDescription: {
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
  intensityContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  intensityOption: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 2,
    alignItems: 'center',
  },
  intensityLabel: {
    ...typography.bodyBold,
  },
  intensityNote: {
    ...typography.caption,
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    fontSize: 16,
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
  bottomSpacer: {
    height: 100,
  },
});
