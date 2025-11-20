
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Platform, Alert, KeyboardAvoidingView, ActivityIndicator } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, borderRadius, typography } from '@/styles/commonStyles';
import { useColorScheme } from '@/hooks/useColorScheme';
import { IconSymbol } from '@/components/IconSymbol';
import { supabase } from '@/app/integrations/supabase/client';

export default function EditFoodScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const itemId = params.itemId as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [item, setItem] = useState<any>(null);
  const [quantity, setQuantity] = useState('');
  const [foodName, setFoodName] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fats, setFats] = useState('');
  const [fiber, setFiber] = useState('');

  useEffect(() => {
    loadItem();
  }, [itemId]);

  const loadItem = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('meal_items')
        .select(`
          *,
          foods (
            id,
            name,
            brand,
            serving_amount,
            serving_unit,
            calories,
            protein,
            carbs,
            fats,
            fiber,
            user_created
          )
        `)
        .eq('id', itemId)
        .single();

      if (error) {
        console.error('[EditFood] Error loading item:', error);
        Alert.alert('Error', 'Failed to load food item');
        router.back();
        return;
      }

      console.log('[EditFood] Item loaded:', data);
      setItem(data);
      setQuantity(data.quantity?.toString() || '1');
      setFoodName(data.foods?.name || '');
      
      // Calculate per-serving values
      const perServingCalories = (data.calories || 0) / (data.quantity || 1);
      const perServingProtein = (data.protein || 0) / (data.quantity || 1);
      const perServingCarbs = (data.carbs || 0) / (data.quantity || 1);
      const perServingFats = (data.fats || 0) / (data.quantity || 1);
      const perServingFiber = (data.fiber || 0) / (data.quantity || 1);

      setCalories(perServingCalories.toFixed(1));
      setProtein(perServingProtein.toFixed(1));
      setCarbs(perServingCarbs.toFixed(1));
      setFats(perServingFats.toFixed(1));
      setFiber(perServingFiber.toFixed(1));
    } catch (error) {
      console.error('[EditFood] Error in loadItem:', error);
      Alert.alert('Error', 'An unexpected error occurred');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!quantity || parseFloat(quantity) <= 0) {
      Alert.alert('Error', 'Please enter a valid quantity');
      return;
    }

    if (item?.foods?.user_created && (!foodName.trim() || !calories.trim())) {
      Alert.alert('Error', 'Please enter at least food name and calories');
      return;
    }

    setSaving(true);

    try {
      const quantityNum = parseFloat(quantity) || 1;
      const caloriesNum = parseFloat(calories) || 0;
      const proteinNum = parseFloat(protein) || 0;
      const carbsNum = parseFloat(carbs) || 0;
      const fatsNum = parseFloat(fats) || 0;
      const fiberNum = parseFloat(fiber) || 0;

      // Calculate total values based on quantity
      const totalCalories = caloriesNum * quantityNum;
      const totalProtein = proteinNum * quantityNum;
      const totalCarbs = carbsNum * quantityNum;
      const totalFats = fatsNum * quantityNum;
      const totalFiber = fiberNum * quantityNum;

      // If it's a user-created food, update the food entry as well
      if (item?.foods?.user_created) {
        const { error: foodError } = await supabase
          .from('foods')
          .update({
            name: foodName.trim(),
            calories: caloriesNum,
            protein: proteinNum,
            carbs: carbsNum,
            fats: fatsNum,
            fiber: fiberNum,
          })
          .eq('id', item.food_id);

        if (foodError) {
          console.error('[EditFood] Error updating food:', foodError);
          Alert.alert('Error', 'Failed to update food');
          setSaving(false);
          return;
        }
      }

      // Update meal item
      const { error: itemError } = await supabase
        .from('meal_items')
        .update({
          quantity: quantityNum,
          calories: totalCalories,
          protein: totalProtein,
          carbs: totalCarbs,
          fats: totalFats,
          fiber: totalFiber,
        })
        .eq('id', itemId);

      if (itemError) {
        console.error('[EditFood] Error updating meal item:', itemError);
        Alert.alert('Error', 'Failed to update food entry');
        setSaving(false);
        return;
      }

      console.log('[EditFood] Food updated successfully');
      Alert.alert('Success', 'Food entry updated!', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      console.error('[EditFood] Error in handleSave:', error);
      Alert.alert('Error', 'An unexpected error occurred');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: isDark ? colors.backgroundDark : colors.background }]} edges={['top']}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </SafeAreaView>
    );
  }

  if (!item) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: isDark ? colors.backgroundDark : colors.background }]} edges={['top']}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.errorText, { color: isDark ? colors.textDark : colors.text }]}>
            Food item not found
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const isUserCreated = item.foods?.user_created;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? colors.backgroundDark : colors.background }]} edges={['top']}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
        keyboardVerticalOffset={0}
      >
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
            Edit Food Entry
          </Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View style={[styles.card, { backgroundColor: isDark ? colors.cardDark : colors.card }]}>
            <Text style={[styles.sectionTitle, { color: isDark ? colors.textDark : colors.text }]}>
              Food Details
            </Text>

            {isUserCreated ? (
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: isDark ? colors.textDark : colors.text }]}>
                  Food Name *
                </Text>
                <TextInput
                  style={[styles.input, { backgroundColor: isDark ? colors.backgroundDark : colors.background, borderColor: isDark ? colors.borderDark : colors.border, color: isDark ? colors.textDark : colors.text }]}
                  placeholder="e.g., Chicken Breast"
                  placeholderTextColor={isDark ? colors.textSecondaryDark : colors.textSecondary}
                  value={foodName}
                  onChangeText={setFoodName}
                  returnKeyType="next"
                />
              </View>
            ) : (
              <View style={styles.infoGroup}>
                <Text style={[styles.foodNameDisplay, { color: isDark ? colors.textDark : colors.text }]}>
                  {item.foods?.name || 'Unknown Food'}
                </Text>
                {item.foods?.brand && (
                  <Text style={[styles.foodBrandDisplay, { color: isDark ? colors.textSecondaryDark : colors.textSecondary }]}>
                    {item.foods.brand}
                  </Text>
                )}
                <Text style={[styles.infoNote, { color: isDark ? colors.textSecondaryDark : colors.textSecondary }]}>
                  This is a database food. You can only change the quantity.
                </Text>
              </View>
            )}

            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: isDark ? colors.textDark : colors.text }]}>
                Quantity (servings) *
              </Text>
              <TextInput
                style={[styles.input, { backgroundColor: isDark ? colors.backgroundDark : colors.background, borderColor: isDark ? colors.borderDark : colors.border, color: isDark ? colors.textDark : colors.text }]}
                placeholder="1"
                placeholderTextColor={isDark ? colors.textSecondaryDark : colors.textSecondary}
                keyboardType="decimal-pad"
                value={quantity}
                onChangeText={setQuantity}
                returnKeyType="next"
              />
              <Text style={[styles.helpText, { color: isDark ? colors.textSecondaryDark : colors.textSecondary }]}>
                Serving: {item.foods?.serving_amount || 1} {item.foods?.serving_unit || 'serving'}
              </Text>
            </View>
          </View>

          {isUserCreated && (
            <View style={[styles.card, { backgroundColor: isDark ? colors.cardDark : colors.card }]}>
              <Text style={[styles.sectionTitle, { color: isDark ? colors.textDark : colors.text }]}>
                Nutrition (per serving)
              </Text>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: isDark ? colors.textDark : colors.text }]}>
                  Calories *
                </Text>
                <TextInput
                  style={[styles.input, { backgroundColor: isDark ? colors.backgroundDark : colors.background, borderColor: isDark ? colors.borderDark : colors.border, color: isDark ? colors.textDark : colors.text }]}
                  placeholder="0"
                  placeholderTextColor={isDark ? colors.textSecondaryDark : colors.textSecondary}
                  keyboardType="decimal-pad"
                  value={calories}
                  onChangeText={setCalories}
                  returnKeyType="next"
                />
              </View>

              <View style={styles.macroRow}>
                <View style={styles.macroInput}>
                  <Text style={[styles.label, { color: isDark ? colors.textDark : colors.text }]}>
                    Protein (g)
                  </Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: isDark ? colors.backgroundDark : colors.background, borderColor: isDark ? colors.borderDark : colors.border, color: isDark ? colors.textDark : colors.text }]}
                    placeholder="0"
                    placeholderTextColor={isDark ? colors.textSecondaryDark : colors.textSecondary}
                    keyboardType="decimal-pad"
                    value={protein}
                    onChangeText={setProtein}
                    returnKeyType="next"
                  />
                </View>

                <View style={styles.macroInput}>
                  <Text style={[styles.label, { color: isDark ? colors.textDark : colors.text }]}>
                    Carbs (g)
                  </Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: isDark ? colors.backgroundDark : colors.background, borderColor: isDark ? colors.borderDark : colors.border, color: isDark ? colors.textDark : colors.text }]}
                    placeholder="0"
                    placeholderTextColor={isDark ? colors.textSecondaryDark : colors.textSecondary}
                    keyboardType="decimal-pad"
                    value={carbs}
                    onChangeText={setCarbs}
                    returnKeyType="next"
                  />
                </View>
              </View>

              <View style={styles.macroRow}>
                <View style={styles.macroInput}>
                  <Text style={[styles.label, { color: isDark ? colors.textDark : colors.text }]}>
                    Fats (g)
                  </Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: isDark ? colors.backgroundDark : colors.background, borderColor: isDark ? colors.borderDark : colors.border, color: isDark ? colors.textDark : colors.text }]}
                    placeholder="0"
                    placeholderTextColor={isDark ? colors.textSecondaryDark : colors.textSecondary}
                    keyboardType="decimal-pad"
                    value={fats}
                    onChangeText={setFats}
                    returnKeyType="next"
                  />
                </View>

                <View style={styles.macroInput}>
                  <Text style={[styles.label, { color: isDark ? colors.textDark : colors.text }]}>
                    Fiber (g)
                  </Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: isDark ? colors.backgroundDark : colors.background, borderColor: isDark ? colors.borderDark : colors.border, color: isDark ? colors.textDark : colors.text }]}
                    placeholder="0"
                    placeholderTextColor={isDark ? colors.textSecondaryDark : colors.textSecondary}
                    keyboardType="decimal-pad"
                    value={fiber}
                    onChangeText={setFiber}
                    returnKeyType="done"
                  />
                </View>
              </View>
            </View>
          )}

          <View style={[styles.card, { backgroundColor: isDark ? colors.cardDark : colors.card }]}>
            <Text style={[styles.sectionTitle, { color: isDark ? colors.textDark : colors.text }]}>
              Total Nutrition
            </Text>
            <Text style={[styles.totalNote, { color: isDark ? colors.textSecondaryDark : colors.textSecondary }]}>
              For {parseFloat(quantity) || 1} serving(s)
            </Text>

            <View style={styles.totalRow}>
              <Text style={[styles.totalLabel, { color: isDark ? colors.textDark : colors.text }]}>
                Calories
              </Text>
              <Text style={[styles.totalValue, { color: colors.calories }]}>
                {Math.round((parseFloat(calories) || 0) * (parseFloat(quantity) || 1))} kcal
              </Text>
            </View>

            <View style={styles.totalRow}>
              <Text style={[styles.totalLabel, { color: isDark ? colors.textDark : colors.text }]}>
                Protein
              </Text>
              <Text style={[styles.totalValue, { color: colors.protein }]}>
                {Math.round((parseFloat(protein) || 0) * (parseFloat(quantity) || 1))}g
              </Text>
            </View>

            <View style={styles.totalRow}>
              <Text style={[styles.totalLabel, { color: isDark ? colors.textDark : colors.text }]}>
                Carbs
              </Text>
              <Text style={[styles.totalValue, { color: colors.carbs }]}>
                {Math.round((parseFloat(carbs) || 0) * (parseFloat(quantity) || 1))}g
              </Text>
            </View>

            <View style={styles.totalRow}>
              <Text style={[styles.totalLabel, { color: isDark ? colors.textDark : colors.text }]}>
                Fats
              </Text>
              <Text style={[styles.totalValue, { color: colors.fats }]}>
                {Math.round((parseFloat(fats) || 0) * (parseFloat(quantity) || 1))}g
              </Text>
            </View>

            <View style={styles.totalRow}>
              <Text style={[styles.totalLabel, { color: isDark ? colors.textDark : colors.text }]}>
                Fiber
              </Text>
              <Text style={[styles.totalValue, { color: colors.fiber }]}>
                {Math.round((parseFloat(fiber) || 0) * (parseFloat(quantity) || 1))}g
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: colors.primary, opacity: saving ? 0.7 : 1 }]}
            onPress={handleSave}
            disabled={saving}
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.saveButtonText}>Save Changes</Text>
            )}
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
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    ...typography.body,
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
  card: {
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
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
  infoGroup: {
    marginBottom: spacing.md,
  },
  foodNameDisplay: {
    ...typography.h3,
    marginBottom: spacing.xs,
  },
  foodBrandDisplay: {
    ...typography.body,
    marginBottom: spacing.sm,
  },
  infoNote: {
    ...typography.caption,
    fontStyle: 'italic',
  },
  label: {
    ...typography.bodyBold,
    marginBottom: spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    fontSize: 16,
  },
  helpText: {
    ...typography.caption,
    marginTop: spacing.xs,
  },
  macroRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  macroInput: {
    flex: 1,
  },
  totalNote: {
    ...typography.caption,
    marginBottom: spacing.md,
    fontStyle: 'italic',
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  totalLabel: {
    ...typography.body,
  },
  totalValue: {
    ...typography.bodyBold,
    fontSize: 18,
  },
  saveButton: {
    borderRadius: borderRadius.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  bottomSpacer: {
    height: 100,
  },
});
