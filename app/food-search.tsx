
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Platform, ActivityIndicator, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, borderRadius, typography } from '@/styles/commonStyles';
import { useColorScheme } from '@/hooks/useColorScheme';
import { IconSymbol } from '@/components/IconSymbol';
import { searchProducts, OpenFoodFactsProduct } from '@/utils/openFoodFacts';

export default function FoodSearchScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const mealType = (params.meal as string) || 'breakfast';
  const date = (params.date as string) || new Date().toISOString().split('T')[0];

  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<OpenFoodFactsProduct[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [screenLoaded, setScreenLoaded] = useState(false);

  // Debounce timer ref
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Confirm screen is mounted
  useEffect(() => {
    console.log('[FoodSearch] Screen mounted on platform:', Platform.OS);
    console.log('[FoodSearch] Params:', { mealType, date });
    setScreenLoaded(true);
  }, []);

  // Live search with debounce
  useEffect(() => {
    // Clear previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // If search query is empty, clear results
    if (!searchQuery.trim()) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    // Set new timer for debounced search
    debounceTimerRef.current = setTimeout(() => {
      performSearch(searchQuery);
    }, 400); // 400ms debounce

    // Cleanup on unmount
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchQuery]);

  const performSearch = async (query: string) => {
    if (!query.trim()) {
      return;
    }

    setSearching(true);
    setHasSearched(true);

    try {
      console.log('[FoodSearch] Searching for:', query);
      const data = await searchProducts(query);
      
      if (data && data.products) {
        console.log('[FoodSearch] Found', data.products.length, 'products');
        setResults(data.products);
      } else {
        console.log('[FoodSearch] No results found');
        setResults([]);
      }
    } catch (error) {
      console.error('[FoodSearch] Error searching:', error);
      Alert.alert('Error', 'Failed to search for products. Please try again.');
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleSelectProduct = (product: OpenFoodFactsProduct) => {
    console.log('[FoodSearch] Selected product:', product.product_name);
    router.push({
      pathname: '/food-details',
      params: {
        meal: mealType,
        date: date,
        productData: JSON.stringify(product),
        source: 'search',
      },
    });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? colors.backgroundDark : colors.background }]} edges={['top']}>
      {/* Debug indicator - visible on mobile */}
      {screenLoaded && (
        <View style={styles.debugBanner}>
          <Text style={styles.debugText}>
            ✓ Food Library Screen Loaded ({Platform.OS})
          </Text>
        </View>
      )}

      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <IconSymbol
            ios_icon_name="chevron.left"
            android_material_icon_name="arrow_back"
            size={24}
            color={isDark ? colors.textDark : colors.text}
          />
        </TouchableOpacity>
        <Text style={[styles.title, { color: isDark ? colors.textDark : colors.text }]}>
          Search Food Library
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.searchContainer}>
        <View style={[styles.searchBar, { backgroundColor: isDark ? colors.cardDark : colors.card, borderColor: isDark ? colors.borderDark : colors.border }]}>
          <IconSymbol
            ios_icon_name="magnifyingglass"
            android_material_icon_name="search"
            size={20}
            color={isDark ? colors.textSecondaryDark : colors.textSecondary}
          />
          <TextInput
            style={[styles.searchInput, { color: isDark ? colors.textDark : colors.text }]}
            placeholder="Start typing to search (e.g., chicken)"
            placeholderTextColor={isDark ? colors.textSecondaryDark : colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus={true}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <IconSymbol
                ios_icon_name="xmark.circle.fill"
                android_material_icon_name="cancel"
                size={20}
                color={isDark ? colors.textSecondaryDark : colors.textSecondary}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {searching && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: isDark ? colors.textSecondaryDark : colors.textSecondary }]}>
              Searching OpenFoodFacts...
            </Text>
          </View>
        )}

        {!searching && hasSearched && results.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🔍</Text>
            <Text style={[styles.emptyText, { color: isDark ? colors.textDark : colors.text }]}>
              No results found
            </Text>
            <Text style={[styles.emptySubtext, { color: isDark ? colors.textSecondaryDark : colors.textSecondary }]}>
              Try a different search term
            </Text>
          </View>
        )}

        {!searching && !hasSearched && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🍽️</Text>
            <Text style={[styles.emptyText, { color: isDark ? colors.textDark : colors.text }]}>
              Search for food
            </Text>
            <Text style={[styles.emptySubtext, { color: isDark ? colors.textSecondaryDark : colors.textSecondary }]}>
              Start typing to see live results from OpenFoodFacts
            </Text>
          </View>
        )}

        {!searching && results.length > 0 && (
          <View style={styles.resultsContainer}>
            <Text style={[styles.resultsCount, { color: isDark ? colors.textSecondaryDark : colors.textSecondary }]}>
              Found {results.length} results
            </Text>
            {results.map((product, index) => {
              const nutriments = product.nutriments || {};
              const calories = nutriments['energy-kcal_100g'] || 0;
              const protein = nutriments['proteins_100g'] || 0;
              const carbs = nutriments['carbohydrates_100g'] || 0;
              const fats = nutriments['fat_100g'] || 0;

              return (
                <React.Fragment key={index}>
                  <TouchableOpacity
                    style={[styles.resultCard, { backgroundColor: isDark ? colors.cardDark : colors.card }]}
                    onPress={() => handleSelectProduct(product)}
                  >
                    <View style={styles.resultContent}>
                      <Text style={[styles.resultName, { color: isDark ? colors.textDark : colors.text }]}>
                        {product.product_name || 'Unknown Product'}
                      </Text>
                      {product.brands && (
                        <Text style={[styles.resultBrand, { color: isDark ? colors.textSecondaryDark : colors.textSecondary }]}>
                          {product.brands}
                        </Text>
                      )}
                      <Text style={[styles.resultNutrition, { color: isDark ? colors.textSecondaryDark : colors.textSecondary }]}>
                        Per 100g: {Math.round(calories)} kcal • P: {Math.round(protein)}g • C: {Math.round(carbs)}g • F: {Math.round(fats)}g
                      </Text>
                      {product.serving_size && (
                        <Text style={[styles.resultServing, { color: isDark ? colors.textSecondaryDark : colors.textSecondary }]}>
                          Serving: {product.serving_size}
                        </Text>
                      )}
                    </View>
                    <IconSymbol
                      ios_icon_name="chevron.right"
                      android_material_icon_name="chevron_right"
                      size={24}
                      color={isDark ? colors.textSecondaryDark : colors.textSecondary}
                    />
                  </TouchableOpacity>
                </React.Fragment>
              );
            })}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  debugBanner: {
    backgroundColor: colors.success,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
  },
  debugText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: Platform.OS === 'android' ? spacing.lg : 0,
    paddingBottom: spacing.md,
  },
  backButton: {
    padding: spacing.xs,
  },
  title: {
    ...typography.h3,
    flex: 1,
    textAlign: 'center',
  },
  searchContainer: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    paddingVertical: spacing.xs,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xxl,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  loadingText: {
    ...typography.body,
    marginTop: spacing.md,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  emptyText: {
    ...typography.h3,
    marginBottom: spacing.xs,
  },
  emptySubtext: {
    ...typography.body,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
  resultsContainer: {
    gap: spacing.sm,
  },
  resultsCount: {
    ...typography.caption,
    marginBottom: spacing.sm,
  },
  resultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 2,
  },
  resultContent: {
    flex: 1,
  },
  resultName: {
    ...typography.bodyBold,
    fontSize: 16,
    marginBottom: 4,
  },
  resultBrand: {
    ...typography.caption,
    marginBottom: 4,
  },
  resultNutrition: {
    ...typography.caption,
    marginBottom: 2,
  },
  resultServing: {
    ...typography.caption,
    fontStyle: 'italic',
  },
});
