
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Platform, Alert, KeyboardAvoidingView } from 'react-native';
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
  const [heightFeet, setHeightFeet] = useState('');
  const [heightInches, setHeightInches] = useState('');
  const [heightCm, setHeightCm] = useState('');
  const [weight, setWeight] = useState('');
  const [units, setUnits] = useState<'metric' | 'imperial'>('metric');

  const handleContinue = async () => {
    if (!age || !weight) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    // Validate height based on unit system
    if (units === 'imperial') {
      if (!heightFeet || !heightInches) {
        Alert.alert('Error', 'Please enter both feet and inches for height');
        return;
      }
    } else {
      if (!heightCm) {
        Alert.alert('Error', 'Please enter your height');
        return;
      }
    }

    // Convert height to cm for storage
    let heightInCm: number;
    if (units === 'imperial') {
      const totalInches = parseInt(heightFeet) * 12 + parseInt(heightInches);
      heightInCm = totalInches * 2.54; // Convert inches to cm
    } else {
      heightInCm = parseInt(heightCm);
    }

    // Convert weight to kg for storage
    let weightInKg: number;
    if (units === 'imperial') {
      weightInKg = parseFloat(weight) * 0.453592; // Convert lbs to kg
    } else {
      weightInKg = parseFloat(weight);
    }

    const data = {
      sex,
      age: parseInt(age),
      height: heightInCm, // Always store in cm
      weight: weightInKg, // Always store in kg
      preferred_units: units,
    };

    console.log('Saving personal info:', data);

    // Save to AsyncStorage for onboarding flow
    await AsyncStorage.setItem('onboarding_data', JSON.stringify(data));

    // Also update user profile in Supabase
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const dateOfBirth = new Date();
        dateOfBirth.setFullYear(dateOfBirth.getFullYear() - parseInt(age));

        const { error } = await supabase
          .from('users')
          .update({
            sex,
            date_of_birth: dateOfBirth.toISOString().split('T')[0],
            height: heightInCm,
            current_weight: weightInKg,
            preferred_units: units,
          })
          .eq('id', user.id);

        if (error) {
          console.error('Error updating user profile:', error);
        }
      }
    } catch (error) {
      console.error('Error in handleContinue:', error);
    }

    router.push('/onboarding/goals');
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
              returnKeyType="next"
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
              Height
            </Text>
            {units === 'imperial' ? (
              <View style={styles.heightRow}>
                <View style={styles.heightInputContainer}>
                  <Text style={[styles.heightLabel, { color: isDark ? colors.textSecondaryDark : colors.textSecondary }]}>
                    Feet
                  </Text>
                  <TextInput
                    style={[styles.input, styles.heightInput, { backgroundColor: isDark ? colors.cardDark : colors.card, borderColor: isDark ? colors.borderDark : colors.border, color: isDark ? colors.textDark : colors.text }]}
                    placeholder="5"
                    placeholderTextColor={isDark ? colors.textSecondaryDark : colors.textSecondary}
                    keyboardType="number-pad"
                    value={heightFeet}
                    onChangeText={setHeightFeet}
                    returnKeyType="next"
                  />
                </View>
                <View style={styles.heightInputContainer}>
                  <Text style={[styles.heightLabel, { color: isDark ? colors.textSecondaryDark : colors.textSecondary }]}>
                    Inches
                  </Text>
                  <TextInput
                    style={[styles.input, styles.heightInput, { backgroundColor: isDark ? colors.cardDark : colors.card, borderColor: isDark ? colors.borderDark : colors.border, color: isDark ? colors.textDark : colors.text }]}
                    placeholder="9"
                    placeholderTextColor={isDark ? colors.textSecondaryDark : colors.textSecondary}
                    keyboardType="number-pad"
                    value={heightInches}
                    onChangeText={setHeightInches}
                    returnKeyType="next"
                  />
                </View>
              </View>
            ) : (
              <TextInput
                style={[styles.input, { backgroundColor: isDark ? colors.cardDark : colors.card, borderColor: isDark ? colors.borderDark : colors.border, color: isDark ? colors.textDark : colors.text }]}
                placeholder="e.g., 175"
                placeholderTextColor={isDark ? colors.textSecondaryDark : colors.textSecondary}
                keyboardType="number-pad"
                value={heightCm}
                onChangeText={setHeightCm}
                returnKeyType="next"
              />
            )}
            <Text style={[styles.helperText, { color: isDark ? colors.textSecondaryDark : colors.textSecondary }]}>
              {units === 'imperial' ? 'Example: 5 ft 9 in' : 'Example: 175 cm'}
            </Text>
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
              returnKeyType="done"
            />
          </View>

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
  heightRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  heightInputContainer: {
    flex: 1,
  },
  heightLabel: {
    ...typography.caption,
    marginBottom: spacing.xs,
  },
  heightInput: {
    marginBottom: 0,
  },
  helperText: {
    ...typography.caption,
    marginTop: spacing.xs,
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
