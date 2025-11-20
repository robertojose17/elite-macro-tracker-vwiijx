
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, borderRadius, typography } from '@/styles/commonStyles';
import { useColorScheme } from '@/hooks/useColorScheme';
import { IconSymbol } from '@/components/IconSymbol';

export default function AddFoodScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const mealType = (params.meal as string) || 'breakfast';
  const mealLabels: Record<string, string> = {
    breakfast: 'Breakfast',
    lunch: 'Lunch',
    dinner: 'Dinner',
    snack: 'Snacks',
  };

  const options = [
    {
      id: 'search',
      title: 'Search Food Library',
      description: 'Search OpenFoodFacts database',
      icon: 'search',
      route: `/food-search?meal=${mealType}`,
    },
    {
      id: 'barcode',
      title: 'Scan Barcode',
      description: 'Scan product barcode',
      icon: 'qr_code_scanner',
      route: `/barcode-scan?meal=${mealType}`,
    },
    {
      id: 'quick',
      title: 'Quick Add',
      description: 'Manually enter calories & macros',
      icon: 'edit',
      route: `/quick-add?meal=${mealType}`,
    },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? colors.backgroundDark : colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <IconSymbol
            ios_icon_name="chevron.left"
            android_material_icon_name="arrow_back"
            size={24}
            color={isDark ? colors.textDark : colors.text}
          />
        </TouchableOpacity>
        <Text style={[styles.title, { color: isDark ? colors.textDark : colors.text }]}>
          Add Food to {mealLabels[mealType]}
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.subtitle, { color: isDark ? colors.textSecondaryDark : colors.textSecondary }]}>
          Choose how you&apos;d like to add food:
        </Text>

        {options.map((option, index) => (
          <React.Fragment key={index}>
            <TouchableOpacity
              style={[styles.optionCard, { backgroundColor: isDark ? colors.cardDark : colors.card }]}
              onPress={() => router.push(option.route as any)}
            >
              <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
                <IconSymbol
                  ios_icon_name={option.icon}
                  android_material_icon_name={option.icon}
                  size={28}
                  color={colors.primary}
                />
              </View>
              <View style={styles.optionContent}>
                <Text style={[styles.optionTitle, { color: isDark ? colors.textDark : colors.text }]}>
                  {option.title}
                </Text>
                <Text style={[styles.optionDescription, { color: isDark ? colors.textSecondaryDark : colors.textSecondary }]}>
                  {option.description}
                </Text>
              </View>
              <IconSymbol
                ios_icon_name="chevron.right"
                android_material_icon_name="chevron_right"
                size={24}
                color={isDark ? colors.textSecondaryDark : colors.textSecondary}
              />
            </TouchableOpacity>
          </React.Fragment>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: Platform.OS === 'android' ? spacing.lg : 0,
    paddingBottom: spacing.md,
  },
  title: {
    ...typography.h3,
    flex: 1,
    textAlign: 'center',
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xxl,
  },
  subtitle: {
    ...typography.body,
    marginBottom: spacing.lg,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 2,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    ...typography.bodyBold,
    fontSize: 18,
    marginBottom: 4,
  },
  optionDescription: {
    ...typography.caption,
  },
});
