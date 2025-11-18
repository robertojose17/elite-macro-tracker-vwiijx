
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Platform } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, borderRadius, typography } from '@/styles/commonStyles';
import { useColorScheme } from '@/hooks/useColorScheme';
import { IconSymbol } from '@/components/IconSymbol';
import { upsertFood } from '@/utils/foodDatabase';

export default function CreateFoodScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const barcode = params.barcode as string || '';
  const mealType = params.mealType as string || 'breakfast';
  const date = params.date as string || new Date().toISOString().split('T')[0];
  const fromBarcode = params.fromBarcode === 'true';
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
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    // Validate required fields
    if (!foodName || !servingAmount || !calories || !protein || !carbs || !fats) {
      alert('Please fill in all required fields (marked with *)');
      return;
    }

    setIsSaving(true);

    try {
      const newFood = {
        name: foodName,
        brand: brand || undefined,
        serving_amount: parseFloat(servingAmount),
        serving_unit: servingUnit,
        calories: parseFloat(calories),
        protein: parseFloat(protein),
        carbs: parseFloat(carbs),
        fats: parseFloat(fats),
        fiber: parseFloat(fiber) || 0,
        barcode: barcode || undefined,
        user_created: true,
        is_favorite: false,
      };

      console.log('Saving new food:', newFood);
      
      // Save to internal database
      const savedFood = await upsertFood(newFood);
      console.log('Food saved successfully:', savedFood.id);

      alert('Food created successfully!');

      // If from barcode scan, navigate to food detail to add to meal
      if (fromBarcode) {
        router.replace({
          pathname: '/food-detail',
          params: {
            foodId: savedFood.id,
            mealType: mealType,
            date: date,
            fromBarcode: 'true'
          }
        });
      } else {
        router.back();
      }
    } catch (error) {
      console.error('Error saving food:', error);
      alert('Failed to save food. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? colors.backgroundDark : colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => {
          if (fromBarcode) {
            // If from barcode, go back to diary
            router.replace('/(tabs)/diary');
          } else {
            router.back();
          }
        }}>
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
        <TouchableOpacity onPress={handleSave} disabled={isSaving}>
          <Text style={[styles.saveButton, { color: isSaving ? colors.textSecondary : colors.primary }]}>
            {isSaving ? 'Saving...' : 'Save'}
          </Text>
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
            <View style={{ flex: 1 }}>
              <Text style={[styles.barcodeLabel, { color: isDark ? colors.textSecondaryDark : colors.textSecondary }]}>
                Scanned Barcode
              </Text>
              <Text style={[styles.barcodeText, { color: isDark ? colors.textDark : colors.text }]}>
                {barcode}
              </Text>
            </View>
          </View>
        )}

        {fromBarcode && (
          <View style={[styles.infoCard, { backgroundColor: colors.primary + '15' }]}>
            <IconSymbol
              ios_icon_name="info.circle"
              android_material_icon_name="info"
              size={20}
              color={colors.primary}
            />
            <Text style={[styles.infoText, { color: colors.primary }]}>
              This barcode wasn&apos;t found in our database. Please enter the nutrition information below.
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
          style={[styles.saveButtonLarge, { backgroundColor: isSaving ? colors.textSecondary : colors.primary }]}
          onPress={handleSave}
          disabled={isSaving}
        >
          <Text style={styles.saveButtonLargeText}>
            {isSaving ? 'Saving...' : (fromBarcode ? 'Create & Add to Meal' : 'Create Food')}
          </Text>
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
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  barcodeLabel: {
    ...typography.caption,
    marginBottom: 2,
  },
  barcodeText: {
    ...typography.body,
    fontWeight: '600',
  },
  infoCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  infoText: {
    ...typography.caption,
    flex: 1,
    lineHeight: 18,
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
