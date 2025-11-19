
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Platform,
  ActivityIndicator,
  Image,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { colors, spacing, borderRadius, typography } from '@/styles/commonStyles';
import { useColorScheme } from '@/hooks/useColorScheme';
import { IconSymbol } from '@/components/IconSymbol';
import { estimateMealWithAI } from '@/utils/aiMealEstimator';
import { addMealItem, updateDailySummary } from '@/utils/foodDatabase';
import { getTodayString } from '@/utils/calculations';

interface EstimatedItem {
  name: string;
  serving_description: string;
  calories: number;
  protein_g: number;
  carbs_g: number;
  fats_g: number;
  fiber_g: number;
}

interface EstimationResult {
  assumptions: string;
  items: EstimatedItem[];
  totals: {
    calories: number;
    protein_g: number;
    carbs_g: number;
    fats_g: number;
    fiber_g: number;
  };
}

export default function AIMealEstimatorScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const mealType = (params.mealType as string) || 'breakfast';
  const date = (params.date as string) || getTodayString();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [description, setDescription] = useState('');
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isEstimating, setIsEstimating] = useState(false);
  const [estimationResult, setEstimationResult] = useState<EstimationResult | null>(null);
  const [editedItems, setEditedItems] = useState<EstimatedItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handlePickImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant camera roll permissions to upload photos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        setImageUri(result.assets[0].uri);
      }
    } catch (err) {
      console.error('Error picking image:', err);
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const handleTakePhoto = async () => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Required', 'Please grant camera permissions to take photos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        quality: 0.7,
        base64: true,
      });

      if (!result.canceled && result.assets[0]) {
        setImageUri(result.assets[0].uri);
      }
    } catch (err) {
      console.error('Error taking photo:', err);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
    }
  };

  const handleRemoveImage = () => {
    setImageUri(null);
  };

  const handleEstimate = async () => {
    if (description.trim().length < 5) {
      Alert.alert('Invalid Input', 'Please describe your meal in more detail (at least 5 characters).');
      return;
    }

    setIsEstimating(true);
    setError(null);
    setEstimationResult(null);

    try {
      console.log('[AI Estimator] Starting estimation...');
      const result = await estimateMealWithAI(description, imageUri);
      console.log('[AI Estimator] Estimation successful:', result);
      
      setEstimationResult(result);
      setEditedItems(result.items);
    } catch (err: any) {
      console.error('[AI Estimator] Error:', err);
      setError(err.message || 'AI estimation is temporarily unavailable. Please try again or log manually.');
    } finally {
      setIsEstimating(false);
    }
  };

  const handleRetry = () => {
    setError(null);
    setEstimationResult(null);
    setEditedItems([]);
  };

  const handleEditItem = (index: number, field: keyof EstimatedItem, value: string) => {
    const newItems = [...editedItems];
    const numValue = parseFloat(value) || 0;
    
    if (field === 'name' || field === 'serving_description') {
      newItems[index][field] = value;
    } else {
      newItems[index][field] = numValue;
    }
    
    setEditedItems(newItems);
  };

  const calculateTotals = () => {
    return editedItems.reduce(
      (acc, item) => ({
        calories: acc.calories + item.calories,
        protein_g: acc.protein_g + item.protein_g,
        carbs_g: acc.carbs_g + item.carbs_g,
        fats_g: acc.fats_g + item.fats_g,
        fiber_g: acc.fiber_g + item.fiber_g,
      }),
      { calories: 0, protein_g: 0, carbs_g: 0, fats_g: 0, fiber_g: 0 }
    );
  };

  const handleSaveToMeal = async () => {
    if (editedItems.length === 0) {
      Alert.alert('No Items', 'There are no items to save.');
      return;
    }

    setIsSaving(true);

    try {
      console.log('[AI Estimator] Saving items to meal...');
      
      for (const item of editedItems) {
        await addMealItem({
          mealType,
          date,
          foodName: item.name,
          servingDescription: item.serving_description,
          quantity: 1,
          calories: item.calories,
          protein: item.protein_g,
          carbs: item.carbs_g,
          fats: item.fats_g,
          fiber: item.fiber_g,
        });
      }

      await updateDailySummary(date);

      console.log('[AI Estimator] Items saved successfully');
      Alert.alert('Success', 'Meal items saved successfully!', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (err) {
      console.error('[AI Estimator] Error saving items:', err);
      Alert.alert('Error', 'Failed to save meal items. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const totals = estimationResult ? calculateTotals() : null;

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: isDark ? colors.backgroundDark : colors.background }]}
      edges={['top']}
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
          AI Meal Estimator
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {!estimationResult && !error && (
          <React.Fragment>
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: isDark ? colors.textDark : colors.text }]}>
                Describe your meal
              </Text>
              <TextInput
                style={[
                  styles.textArea,
                  {
                    backgroundColor: isDark ? colors.cardDark : colors.card,
                    color: isDark ? colors.textDark : colors.text,
                    borderColor: isDark ? colors.borderDark : colors.border,
                  },
                ]}
                placeholder="E.g., 'Two scrambled eggs, a slice of whole wheat toast with butter, and a medium banana'"
                placeholderTextColor={isDark ? colors.textSecondaryDark : colors.textSecondary}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={6}
                textAlignVertical="top"
              />
            </View>

            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: isDark ? colors.textDark : colors.text }]}>
                Add a photo (optional)
              </Text>
              
              {imageUri ? (
                <View style={styles.imageContainer}>
                  <Image source={{ uri: imageUri }} style={styles.image} />
                  <TouchableOpacity
                    style={[styles.removeImageButton, { backgroundColor: colors.error }]}
                    onPress={handleRemoveImage}
                  >
                    <IconSymbol
                      ios_icon_name="xmark"
                      android_material_icon_name="close"
                      size={16}
                      color="#FFFFFF"
                    />
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.photoButtons}>
                  <TouchableOpacity
                    style={[styles.photoButton, { backgroundColor: isDark ? colors.cardDark : colors.card }]}
                    onPress={handleTakePhoto}
                  >
                    <IconSymbol
                      ios_icon_name="camera"
                      android_material_icon_name="photo_camera"
                      size={24}
                      color={colors.primary}
                    />
                    <Text style={[styles.photoButtonText, { color: isDark ? colors.textDark : colors.text }]}>
                      Take Photo
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.photoButton, { backgroundColor: isDark ? colors.cardDark : colors.card }]}
                    onPress={handlePickImage}
                  >
                    <IconSymbol
                      ios_icon_name="photo"
                      android_material_icon_name="photo_library"
                      size={24}
                      color={colors.primary}
                    />
                    <Text style={[styles.photoButtonText, { color: isDark ? colors.textDark : colors.text }]}>
                      Choose from Gallery
                    </Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            <TouchableOpacity
              style={[
                styles.estimateButton,
                { backgroundColor: colors.primary },
                isEstimating && styles.estimateButtonDisabled,
              ]}
              onPress={handleEstimate}
              disabled={isEstimating}
            >
              {isEstimating ? (
                <React.Fragment>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                  <Text style={styles.estimateButtonText}>Analyzing...</Text>
                </React.Fragment>
              ) : (
                <React.Fragment>
                  <IconSymbol
                    ios_icon_name="sparkles"
                    android_material_icon_name="auto_awesome"
                    size={20}
                    color="#FFFFFF"
                  />
                  <Text style={styles.estimateButtonText}>Estimate with AI</Text>
                </React.Fragment>
              )}
            </TouchableOpacity>
          </React.Fragment>
        )}

        {error && (
          <View style={[styles.errorContainer, { backgroundColor: colors.error + '20' }]}>
            <IconSymbol
              ios_icon_name="exclamationmark.triangle"
              android_material_icon_name="error"
              size={48}
              color={colors.error}
            />
            <Text style={[styles.errorTitle, { color: colors.error }]}>Estimation Failed</Text>
            <Text style={[styles.errorMessage, { color: isDark ? colors.textDark : colors.text }]}>
              {error}
            </Text>
            <TouchableOpacity
              style={[styles.retryButton, { backgroundColor: colors.primary }]}
              onPress={handleRetry}
            >
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        )}

        {estimationResult && (
          <React.Fragment>
            <View style={[styles.resultCard, { backgroundColor: isDark ? colors.cardDark : colors.card }]}>
              <Text style={[styles.resultTitle, { color: isDark ? colors.textDark : colors.text }]}>
                AI Analysis
              </Text>
              <Text style={[styles.assumptions, { color: isDark ? colors.textSecondaryDark : colors.textSecondary }]}>
                {estimationResult.assumptions}
              </Text>
            </View>

            <Text style={[styles.itemsTitle, { color: isDark ? colors.textDark : colors.text }]}>
              Estimated Items (tap to edit)
            </Text>

            {editedItems.map((item, index) => (
              <React.Fragment key={index}>
                <View style={[styles.itemCard, { backgroundColor: isDark ? colors.cardDark : colors.card }]}>
                  <TextInput
                    style={[styles.itemName, { color: isDark ? colors.textDark : colors.text }]}
                    value={item.name}
                    onChangeText={(value) => handleEditItem(index, 'name', value)}
                  />
                  <TextInput
                    style={[styles.itemServing, { color: isDark ? colors.textSecondaryDark : colors.textSecondary }]}
                    value={item.serving_description}
                    onChangeText={(value) => handleEditItem(index, 'serving_description', value)}
                  />

                  <View style={styles.macroGrid}>
                    <View style={styles.macroInput}>
                      <Text style={[styles.macroLabel, { color: isDark ? colors.textSecondaryDark : colors.textSecondary }]}>
                        Calories
                      </Text>
                      <TextInput
                        style={[styles.macroValue, { color: isDark ? colors.textDark : colors.text }]}
                        value={String(Math.round(item.calories))}
                        onChangeText={(value) => handleEditItem(index, 'calories', value)}
                        keyboardType="numeric"
                      />
                    </View>

                    <View style={styles.macroInput}>
                      <Text style={[styles.macroLabel, { color: isDark ? colors.textSecondaryDark : colors.textSecondary }]}>
                        Protein (g)
                      </Text>
                      <TextInput
                        style={[styles.macroValue, { color: colors.protein }]}
                        value={String(Math.round(item.protein_g))}
                        onChangeText={(value) => handleEditItem(index, 'protein_g', value)}
                        keyboardType="numeric"
                      />
                    </View>

                    <View style={styles.macroInput}>
                      <Text style={[styles.macroLabel, { color: isDark ? colors.textSecondaryDark : colors.textSecondary }]}>
                        Carbs (g)
                      </Text>
                      <TextInput
                        style={[styles.macroValue, { color: colors.carbs }]}
                        value={String(Math.round(item.carbs_g))}
                        onChangeText={(value) => handleEditItem(index, 'carbs_g', value)}
                        keyboardType="numeric"
                      />
                    </View>

                    <View style={styles.macroInput}>
                      <Text style={[styles.macroLabel, { color: isDark ? colors.textSecondaryDark : colors.textSecondary }]}>
                        Fats (g)
                      </Text>
                      <TextInput
                        style={[styles.macroValue, { color: colors.fats }]}
                        value={String(Math.round(item.fats_g))}
                        onChangeText={(value) => handleEditItem(index, 'fats_g', value)}
                        keyboardType="numeric"
                      />
                    </View>

                    <View style={styles.macroInput}>
                      <Text style={[styles.macroLabel, { color: isDark ? colors.textSecondaryDark : colors.textSecondary }]}>
                        Fiber (g)
                      </Text>
                      <TextInput
                        style={[styles.macroValue, { color: isDark ? colors.textDark : colors.text }]}
                        value={String(Math.round(item.fiber_g))}
                        onChangeText={(value) => handleEditItem(index, 'fiber_g', value)}
                        keyboardType="numeric"
                      />
                    </View>
                  </View>
                </View>
              </React.Fragment>
            ))}

            {totals && (
              <View style={[styles.totalsCard, { backgroundColor: colors.primary + '20' }]}>
                <Text style={[styles.totalsTitle, { color: colors.primary }]}>Total Nutrition</Text>
                <View style={styles.totalsGrid}>
                  <View style={styles.totalItem}>
                    <Text style={[styles.totalValue, { color: isDark ? colors.textDark : colors.text }]}>
                      {Math.round(totals.calories)}
                    </Text>
                    <Text style={[styles.totalLabel, { color: isDark ? colors.textSecondaryDark : colors.textSecondary }]}>
                      Calories
                    </Text>
                  </View>
                  <View style={styles.totalItem}>
                    <Text style={[styles.totalValue, { color: colors.protein }]}>
                      {Math.round(totals.protein_g)}g
                    </Text>
                    <Text style={[styles.totalLabel, { color: isDark ? colors.textSecondaryDark : colors.textSecondary }]}>
                      Protein
                    </Text>
                  </View>
                  <View style={styles.totalItem}>
                    <Text style={[styles.totalValue, { color: colors.carbs }]}>
                      {Math.round(totals.carbs_g)}g
                    </Text>
                    <Text style={[styles.totalLabel, { color: isDark ? colors.textSecondaryDark : colors.textSecondary }]}>
                      Carbs
                    </Text>
                  </View>
                  <View style={styles.totalItem}>
                    <Text style={[styles.totalValue, { color: colors.fats }]}>
                      {Math.round(totals.fats_g)}g
                    </Text>
                    <Text style={[styles.totalLabel, { color: isDark ? colors.textSecondaryDark : colors.textSecondary }]}>
                      Fats
                    </Text>
                  </View>
                  <View style={styles.totalItem}>
                    <Text style={[styles.totalValue, { color: isDark ? colors.textDark : colors.text }]}>
                      {Math.round(totals.fiber_g)}g
                    </Text>
                    <Text style={[styles.totalLabel, { color: isDark ? colors.textSecondaryDark : colors.textSecondary }]}>
                      Fiber
                    </Text>
                  </View>
                </View>
              </View>
            )}

            <TouchableOpacity
              style={[
                styles.saveButton,
                { backgroundColor: colors.success },
                isSaving && styles.saveButtonDisabled,
              ]}
              onPress={handleSaveToMeal}
              disabled={isSaving}
            >
              {isSaving ? (
                <React.Fragment>
                  <ActivityIndicator size="small" color="#FFFFFF" />
                  <Text style={styles.saveButtonText}>Saving...</Text>
                </React.Fragment>
              ) : (
                <React.Fragment>
                  <IconSymbol
                    ios_icon_name="checkmark.circle"
                    android_material_icon_name="check_circle"
                    size={20}
                    color="#FFFFFF"
                  />
                  <Text style={styles.saveButtonText}>Save to {mealType.charAt(0).toUpperCase() + mealType.slice(1)}</Text>
                </React.Fragment>
              )}
            </TouchableOpacity>
          </React.Fragment>
        )}
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
    paddingBottom: spacing.xxl * 2,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.bodyBold,
    marginBottom: spacing.sm,
  },
  textArea: {
    borderRadius: borderRadius.md,
    borderWidth: 1,
    padding: spacing.md,
    fontSize: 16,
    minHeight: 120,
  },
  photoButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  photoButton: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  photoButtonText: {
    ...typography.small,
    fontWeight: '600',
  },
  imageContainer: {
    position: 'relative',
    borderRadius: borderRadius.md,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 200,
    borderRadius: borderRadius.md,
  },
  removeImageButton: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  estimateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
  },
  estimateButtonDisabled: {
    opacity: 0.6,
  },
  estimateButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
  errorContainer: {
    alignItems: 'center',
    padding: spacing.xl,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
  },
  errorTitle: {
    ...typography.h3,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  errorMessage: {
    ...typography.body,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  retryButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  resultCard: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
  },
  resultTitle: {
    ...typography.bodyBold,
    marginBottom: spacing.sm,
  },
  assumptions: {
    ...typography.body,
    lineHeight: 20,
  },
  itemsTitle: {
    ...typography.h3,
    marginBottom: spacing.md,
  },
  itemCard: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.md,
  },
  itemName: {
    ...typography.bodyBold,
    fontSize: 16,
    marginBottom: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: 'transparent',
  },
  itemServing: {
    ...typography.body,
    marginBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'transparent',
  },
  macroGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  macroInput: {
    flex: 1,
    minWidth: '45%',
  },
  macroLabel: {
    ...typography.small,
    marginBottom: 4,
  },
  macroValue: {
    ...typography.bodyBold,
    fontSize: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: 4,
  },
  totalsCard: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.lg,
  },
  totalsTitle: {
    ...typography.h3,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  totalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    gap: spacing.md,
  },
  totalItem: {
    alignItems: 'center',
    minWidth: '30%',
  },
  totalValue: {
    ...typography.h2,
    fontWeight: '700',
  },
  totalLabel: {
    ...typography.small,
    marginTop: 4,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
  },
  saveButtonDisabled: {
    opacity: 0.6,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 16,
  },
});
