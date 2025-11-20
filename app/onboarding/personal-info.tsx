
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, borderRadius, typography } from '@/styles/commonStyles';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Sex } from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '@/app/integrations/supabase/client';

export default function PersonalInfoScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [sex, setSex] = useState<Sex>('male');
  const [age, setAge] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [units, setUnits] = useState<'metric' | 'imperial'>('metric');

  const handleContinue = async () => {
    if (!age || !height || !weight) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    const data = {
      sex,
      age: parseInt(age),
      height: parseInt(height),
      weight: parseFloat(weight),
      preferred_units: units,
    };

    // Save to AsyncStorage for onboarding flow
    await AsyncStorage.setItem('onboarding_data', JSON.stringify(data));

    // Also update user profile in Supabase
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const dateOfBirth = new Date();
      dateOfBirth.setFullYear(dateOfBirth.getFullYear() - parseInt(age));

      await supabase
        .from('users')
        .update({
          sex,
          date_of_birth: dateOfBirth.toISOString().split('T')[0],
          height: parseInt(height),
          current_weight: parseFloat(weight),
          preferred_units: units,
        })
        .eq('id', user.id);
    }

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
          <Text style={[styles.label, { color: isDark ? colors.textDark : colors.text }]}>Preferred Units</Text>
          <View style={styles.optionRow}>
            <TouchableOpacity
              style={[
                styles.optionButton,
                units === 'metric' && styles.optionButtonActive,
                { backgroundColor: isDark ? colors.cardDark : colors.card, borderColor: isDark ? colors.borderDark : colors.border },
                units === 'metric' && { backgroundColor: colors.primary, borderColor: colors.primary },
              ]}
              onPress={() => setUnits('metric')}
            >
              <Text style={[styles.optionText, { color: isDark ? colors.textDark : colors.text }, units === 'metric' && { color: '#FFFFFF' }]}>
                Metric
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.optionButton,
                units === 'imperial' && styles.optionButtonActive,
                { backgroundColor: isDark ? colors.cardDark : colors.card, borderColor: isDark ? colors.borderDark : colors.border },
                units === 'imperial' && { backgroundColor: colors.primary, borderColor: colors.primary },
              ]}
              onPress={() => setUnits('imperial')}
            >
              <Text style={[styles.optionText, { color: isDark ? colors.textDark : colors.text }, units === 'imperial' && { color: '#FFFFFF' }]}>
                Imperial
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.label, { color: isDark ? colors.textDark : colors.text }]}>
            Height ({units === 'metric' ? 'cm' : 'inches'})
          </Text>
          <TextInput
            style={[styles.input, { backgroundColor: isDark ? colors.cardDark : colors.card, borderColor: isDark ? colors.borderDark : colors.border, color: isDark ? colors.textDark : colors.text }]}
            placeholder={units === 'metric' ? 'e.g., 175' : 'e.g., 69'}
            placeholderTextColor={isDark ? colors.textSecondaryDark : colors.textSecondary}
            keyboardType="number-pad"
            value={height}
            onChangeText={setHeight}
          />
        </View>

        <View style={styles.section}>
          <Text style={[styles.label, { color: isDark ? colors.textDark : colors.text }]}>
            Current Weight ({units === 'metric' ? 'kg' : 'lbs'})
          </Text>
          <TextInput
            style={[styles.input, { backgroundColor: isDark ? colors.cardDark : colors.card, borderColor: isDark ? colors.borderDark : colors.border, color: isDark ? colors.textDark : colors.text }]}
            placeholder={units === 'metric' ? 'e.g., 75' : 'e.g., 165'}
            placeholderTextColor={isDark ? colors.textSecondaryDark : colors.textSecondary}
            keyboardType="decimal-pad"
            value={weight}
            onChangeText={setWeight}
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
