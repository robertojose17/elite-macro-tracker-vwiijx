
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Platform, KeyboardAvoidingView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, borderRadius, typography } from '@/styles/commonStyles';
import { useColorScheme } from '@/hooks/useColorScheme';
import { MacroPreference } from '@/types';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function MacrosScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [preference, setPreference] = useState<MacroPreference>('balanced');
  const [customProtein, setCustomProtein] = useState('');
  const [customCarbs, setCustomCarbs] = useState('');
  const [customFats, setCustomFats] = useState('');

  const handleContinue = async () => {
    const existingData = await AsyncStorage.getItem('onboarding_data');
    const data = existingData ? JSON.parse(existingData) : {};
    
    data.macro_preference = preference;
    if (preference === 'custom') {
      data.custom_protein = parseInt(customProtein);
      data.custom_carbs = parseInt(customCarbs);
      data.custom_fats = parseInt(customFats);
    }

    await AsyncStorage.setItem('onboarding_data', JSON.stringify(data));
    router.push('/onboarding/results');
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
              Macro Preferences
            </Text>
            <Text style={[styles.subtitle, { color: isDark ? colors.textSecondaryDark : colors.textSecondary }]}>
              Choose how to distribute your macronutrients
            </Text>
          </View>

          <View style={styles.section}>
            <MacroOption
              label="High Protein"
              description="2.2g/kg protein, 25% fats"
              selected={preference === 'high_protein'}
              onPress={() => setPreference('high_protein')}
              isDark={isDark}
            />
            <MacroOption
              label="Balanced"
              description="1.8g/kg protein, 30% fats"
              selected={preference === 'balanced'}
              onPress={() => setPreference('balanced')}
              isDark={isDark}
            />
            <MacroOption
              label="Custom"
              description="Set your own targets"
              selected={preference === 'custom'}
              onPress={() => setPreference('custom')}
              isDark={isDark}
            />
          </View>

          {preference === 'custom' && (
            <View style={styles.customSection}>
              <Text style={[styles.label, { color: isDark ? colors.textDark : colors.text }]}>
                Custom Macros (grams per day)
              </Text>
              <View style={styles.inputRow}>
                <View style={styles.inputContainer}>
                  <Text style={[styles.inputLabel, { color: isDark ? colors.textSecondaryDark : colors.textSecondary }]}>
                    Protein
                  </Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: isDark ? colors.cardDark : colors.card, borderColor: isDark ? colors.borderDark : colors.border, color: isDark ? colors.textDark : colors.text }]}
                    placeholder="160"
                    placeholderTextColor={isDark ? colors.textSecondaryDark : colors.textSecondary}
                    keyboardType="number-pad"
                    value={customProtein}
                    onChangeText={setCustomProtein}
                    returnKeyType="next"
                  />
                </View>
                <View style={styles.inputContainer}>
                  <Text style={[styles.inputLabel, { color: isDark ? colors.textSecondaryDark : colors.textSecondary }]}>
                    Carbs
                  </Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: isDark ? colors.cardDark : colors.card, borderColor: isDark ? colors.borderDark : colors.border, color: isDark ? colors.textDark : colors.text }]}
                    placeholder="220"
                    placeholderTextColor={isDark ? colors.textSecondaryDark : colors.textSecondary}
                    keyboardType="number-pad"
                    value={customCarbs}
                    onChangeText={setCustomCarbs}
                    returnKeyType="next"
                  />
                </View>
                <View style={styles.inputContainer}>
                  <Text style={[styles.inputLabel, { color: isDark ? colors.textSecondaryDark : colors.textSecondary }]}>
                    Fats
                  </Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: isDark ? colors.cardDark : colors.card, borderColor: isDark ? colors.borderDark : colors.border, color: isDark ? colors.textDark : colors.text }]}
                    placeholder="61"
                    placeholderTextColor={isDark ? colors.textSecondaryDark : colors.textSecondary}
                    keyboardType="number-pad"
                    value={customFats}
                    onChangeText={setCustomFats}
                    returnKeyType="done"
                  />
                </View>
              </View>
            </View>
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

function MacroOption({ label, description, selected, onPress, isDark }: any) {
  return (
    <TouchableOpacity
      style={[
        styles.macroOption,
        { backgroundColor: isDark ? colors.cardDark : colors.card, borderColor: isDark ? colors.borderDark : colors.border },
        selected && { backgroundColor: colors.primary, borderColor: colors.primary },
      ]}
      onPress={onPress}
    >
      <View style={styles.macroContent}>
        <Text style={[styles.macroLabel, { color: isDark ? colors.textDark : colors.text }, selected && { color: '#FFFFFF' }]}>
          {label}
        </Text>
        <Text style={[styles.macroDescription, { color: isDark ? colors.textSecondaryDark : colors.textSecondary }, selected && { color: 'rgba(255,255,255,0.8)' }]}>
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
  macroOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 2,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  macroContent: {
    flex: 1,
  },
  macroLabel: {
    ...typography.bodyBold,
    marginBottom: 2,
  },
  macroDescription: {
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
  customSection: {
    marginBottom: spacing.xl,
  },
  inputRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  inputContainer: {
    flex: 1,
  },
  inputLabel: {
    ...typography.caption,
    marginBottom: spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    fontSize: 16,
    textAlign: 'center',
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
