
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, borderRadius, typography } from '@/styles/commonStyles';
import { useColorScheme } from '@/hooks/useColorScheme';
import { IconSymbol } from '@/components/IconSymbol';

export default function CreateFoodScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const barcode = params.barcode as string || '';
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [foodName, setFoodName] = useState('');
  const [brand, setBrand] = useState('');
  const [servingAmount, setServingAmount] = useState('');
  const [servingUnit, setServingUnit] = useState('g');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fats, setFats] = useState('');
  const [fiber, setFiber] = useState('');

  const handleSave = () => {
    console.log('Saving new food:', {
      foodName,
      brand,
      servingAmount,
      servingUnit,
      calories,
      protein,
      carbs,
      fats,
      fiber,
      barcode,
    });
    
    // In a real app, this would save to the database
    alert('Food created successfully!');
    router.back();
  };

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
          Create Food
        </Text>
        <TouchableOpacity onPress={handleSave}>
          <Text style={[styles.saveButton, { color: colors.primary }]}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {barcode && (
          <View style={[styles.barcodeCard, { backgroundColor: isDark ? colors.cardDark : colors.card }]}>
            <IconSymbol
              ios_icon_name="barcode"
              android_material_icon_name="qr_code"
              size={24}
              color={colors.primary}
            />
            <Text style={[styles.barcodeText, { color: isDark ? colors.textDark : colors.text }]}>
              Barcode: {barcode}
            </Text>
          </View>
        )}

        <View style={[styles.section, { backgroundColor: isDark ? colors.cardDark : colors.card }]}>
          <Text style={[styles.sectionTitle, { color: isDark ? colors.textDark : colors.text }]}>
            Basic Information
          </Text>
          
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: isDark ? colors.textSecondaryDark : colors.textSecondary }]}>
              Food Name *
            </Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: isDark ? colors.backgroundDark : colors.background,
                color: isDark ? colors.textDark : colors.text,
                borderColor: isDark ? colors.borderDark : colors.border,
              }]}
              placeholder="e.g., Chicken Breast"
              placeholderTextColor={isDark ? colors.textSecondaryDark : colors.textSecondary}
              value={foodName}
              onChangeText={setFoodName}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: isDark ? colors.textSecondaryDark : colors.textSecondary }]}>
              Brand (Optional)
            </Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: isDark ? colors.backgroundDark : colors.background,
                color: isDark ? colors.textDark : colors.text,
                borderColor: isDark ? colors.borderDark : colors.border,
              }]}
              placeholder="e.g., Tyson"
              placeholderTextColor={isDark ? colors.textSecondaryDark : colors.textSecondary}
              value={brand}
              onChangeText={setBrand}
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={[styles.label, { color: isDark ? colors.textSecondaryDark : colors.textSecondary }]}>
                Serving Amount *
              </Text>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: isDark ? colors.backgroundDark : colors.background,
                  color: isDark ? colors.textDark : colors.text,
                  borderColor: isDark ? colors.borderDark : colors.border,
                }]}
                placeholder="100"
                placeholderTextColor={isDark ? colors.textSecondaryDark : colors.textSecondary}
                value={servingAmount}
                onChangeText={setServingAmount}
                keyboardType="numeric"
              />
            </View>

            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={[styles.label, { color: isDark ? colors.textSecondaryDark : colors.textSecondary }]}>
                Unit *
              </Text>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: isDark ? colors.backgroundDark : colors.background,
                  color: isDark ? colors.textDark : colors.text,
                  borderColor: isDark ? colors.borderDark : colors.border,
                }]}
                placeholder="g"
                placeholderTextColor={isDark ? colors.textSecondaryDark : colors.textSecondary}
                value={servingUnit}
                onChangeText={setServingUnit}
              />
            </View>
          </View>
        </View>

        <View style={[styles.section, { backgroundColor: isDark ? colors.cardDark : colors.card }]}>
          <Text style={[styles.sectionTitle, { color: isDark ? colors.textDark : colors.text }]}>
            Nutrition Facts
          </Text>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: isDark ? colors.textSecondaryDark : colors.textSecondary }]}>
              Calories *
            </Text>
            <TextInput
              style={[styles.input, { 
                backgroundColor: isDark ? colors.backgroundDark : colors.background,
                color: isDark ? colors.textDark : colors.text,
                borderColor: isDark ? colors.borderDark : colors.border,
              }]}
              placeholder="165"
              placeholderTextColor={isDark ? colors.textSecondaryDark : colors.textSecondary}
              value={calories}
              onChangeText={setCalories}
              keyboardType="numeric"
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={[styles.label, { color: isDark ? colors.textSecondaryDark : colors.textSecondary }]}>
                Protein (g) *
              </Text>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: isDark ? colors.backgroundDark : colors.background,
                  color: isDark ? colors.textDark : colors.text,
                  borderColor: isDark ? colors.borderDark : colors.border,
                }]}
                placeholder="31"
                placeholderTextColor={isDark ? colors.textSecondaryDark : colors.textSecondary}
                value={protein}
                onChangeText={setProtein}
                keyboardType="numeric"
              />
            </View>

            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={[styles.label, { color: isDark ? colors.textSecondaryDark : colors.textSecondary }]}>
                Carbs (g) *
              </Text>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: isDark ? colors.backgroundDark : colors.background,
                  color: isDark ? colors.textDark : colors.text,
                  borderColor: isDark ? colors.borderDark : colors.border,
                }]}
                placeholder="0"
                placeholderTextColor={isDark ? colors.textSecondaryDark : colors.textSecondary}
                value={carbs}
                onChangeText={setCarbs}
                keyboardType="numeric"
              />
            </View>
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={[styles.label, { color: isDark ? colors.textSecondaryDark : colors.textSecondary }]}>
                Fats (g) *
              </Text>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: isDark ? colors.backgroundDark : colors.background,
                  color: isDark ? colors.textDark : colors.text,
                  borderColor: isDark ? colors.borderDark : colors.border,
                }]}
                placeholder="3.6"
                placeholderTextColor={isDark ? colors.textSecondaryDark : colors.textSecondary}
                value={fats}
                onChangeText={setFats}
                keyboardType="numeric"
              />
            </View>

            <View style={[styles.inputGroup, { flex: 1 }]}>
              <Text style={[styles.label, { color: isDark ? colors.textSecondaryDark : colors.textSecondary }]}>
                Fiber (g)
              </Text>
              <TextInput
                style={[styles.input, { 
                  backgroundColor: isDark ? colors.backgroundDark : colors.background,
                  color: isDark ? colors.textDark : colors.text,
                  borderColor: isDark ? colors.borderDark : colors.border,
                }]}
                placeholder="0"
                placeholderTextColor={isDark ? colors.textSecondaryDark : colors.textSecondary}
                value={fiber}
                onChangeText={setFiber}
                keyboardType="numeric"
              />
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={[styles.saveButtonLarge, { backgroundColor: colors.primary }]}
          onPress={handleSave}
        >
          <Text style={styles.saveButtonLargeText}>Create Food</Text>
        </TouchableOpacity>
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
  saveButton: {
    ...typography.bodyBold,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xxl,
  },
  barcodeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  barcodeText: {
    ...typography.body,
    fontWeight: '600',
  },
  section: {
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 2,
  },
  sectionTitle: {
    ...typography.h3,
    marginBottom: spacing.md,
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  label: {
    ...typography.caption,
    marginBottom: spacing.xs,
    fontWeight: '600',
  },
  input: {
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 16,
  },
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  saveButtonLarge: {
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  saveButtonLargeText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
});
