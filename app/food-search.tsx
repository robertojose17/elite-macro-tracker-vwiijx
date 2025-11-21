
import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Platform, ActivityIndicator, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, borderRadius, typography } from '@/styles/commonStyles';
import { useColorScheme } from '@/hooks/useColorScheme';
import { IconSymbol } from '@/components/IconSymbol';
import { searchFoods, FDCFood, extractNutrition } from '@/utils/foodDataCentral';

export default function FoodSearchScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const mealType = (params.meal as string) || 'breakfast';
  const date = (params.date as string) || new Date().toISOString().split('T')[0];

  const [searchQuery, setSearchQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<FDCFood[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [screenLoaded, setScreenLoaded] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<'auth' | 'network' | 'unknown' | null>(null);

  // Debounce timer ref
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Confirm screen is mounted
  useEffect(() => {
    console.log('[FoodSearch] ✓ Screen mounted on platform:', Platform.OS);
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
      setErrorMessage(null);
      setErrorType(null);
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
    setErrorMessage(null);
    setErrorType(null);

    try {
      console.log('[FoodSearch] 🔍 Searching FDC for:', query);
      console.log('[FoodSearch] 📱 Running on:', Platform.OS);
      
      const data = await searchFoods(query);
      
      if (data === null) {
        console.error('[FoodSearch] ❌ Search returned null (API error)');
        
        // Try to determine error type from console logs
        // In a real scenario, we'd return error info from searchFoods
        setErrorType('network');
        setErrorMessage('Failed to connect to FoodData Central. This could be due to:\n\n• Invalid or missing API key\n• Network connection issues\n• FDC service temporarily unavailable\n\nPlease check the console logs for details.');
        setResults([]);
      } else if (data.foods && data.foods.length > 0) {
        console.log('[FoodSearch] ✅ Found', data.foods.length, 'foods from FDC');
        
        // Sort results: Branded first, then Foundation, then others
        const sortedFoods = [...data.foods].sort((a, b) => {
          const typeOrder: { [key: string]: number } = {
            'Branded': 1,
            'Foundation': 2,
            'Survey (FNDDS)': 3,
            'SR Legacy': 4,
          };
          
          const orderA = typeOrder[a.dataType] || 999;
          const orderB = typeOrder[b.dataType] || 999;
          
          return orderA - orderB;
        });
        
        setResults(sortedFoods);
        setErrorMessage(null);
        setErrorType(null);
      } else {
        console.log('[FoodSearch] ⚠️ No results found for query:', query);
        setResults([]);
        setErrorMessage(null);
        setErrorType(null);
      }
    } catch (error) {
      console.error('[FoodSearch] ❌ Error searching:', error);
      
      // Check if it's an API key configuration error
      if (error instanceof Error && error.message.includes('API key')) {
        setErrorType('auth');
        setErrorMessage('FDC API key invalid or misconfigured.\n\nPlease set the FOODDATA_CENTRAL_API_KEY environment variable and restart the app.');
      } else {
        setErrorType('unknown');
        setErrorMessage('An unexpected error occurred. Please try again.');
      }
      
      setResults([]);
    } finally {
      setSearching(false);
    }
  };

  const handleSelectFood = (food: FDCFood) => {
    console.log('[FoodSearch] Selected food:', food.description);
    router.push({
      pathname: '/food-details',
      params: {
        meal: mealType,
        date: date,
        fdcData: JSON.stringify(food),
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
            ✓ Food Library (FDC) - {Platform.OS}
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
            placeholder="Start typing to search (e.g., egg, chicken)"
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
              Searching FoodData Central (USDA)...
            </Text>
            <Text style={[styles.loadingSubtext, { color: isDark ? colors.textSecondaryDark : colors.textSecondary }]}>
              Platform: {Platform.OS}
            </Text>
          </View>
        )}

        {errorMessage && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorIcon}>
              {errorType === 'auth' ? '🔐' : '⚠️'}
            </Text>
            <Text style={[styles.errorTitle, { color: isDark ? colors.textDark : colors.text }]}>
              {errorType === 'auth' ? 'API Key Error' : 'Connection Error'}
            </Text>
            <Text style={[styles.errorText, { color: isDark ? colors.textSecondaryDark : colors.textSecondary }]}>
              {errorMessage}
            </Text>
            <TouchableOpacity
              style={[styles.retryButton, { backgroundColor: colors.primary }]}
              onPress={() => performSearch(searchQuery)}
            >
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>
          </View>
        )}

        {!searching && !errorMessage && hasSearched && results.length === 0 && (
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

        {!searching && !errorMessage && !hasSearched && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🍽️</Text>
            <Text style={[styles.emptyText, { color: isDark ? colors.textDark : colors.text }]}>
              Search for food
            </Text>
            <Text style={[styles.emptySubtext, { color: isDark ? colors.textSecondaryDark : colors.textSecondary }]}>
              Start typing to see live results from FoodData Central (USDA)
            </Text>
          </View>
        )}

        {!searching && !errorMessage && results.length > 0 && (
          <View style={styles.resultsContainer}>
            <Text style={[styles.resultsCount, { color: isDark ? colors.textSecondaryDark : colors.textSecondary }]}>
              Found {results.length} results
            </Text>
            {results.map((food, index) => {
              const nutrition = extractNutrition(food);
              const brandText = food.brandOwner || food.brandName || '';
              
              return (
                <React.Fragment key={index}>
                  <TouchableOpacity
                    style={[styles.resultCard, { backgroundColor: isDark ? colors.cardDark : colors.card }]}
                    onPress={() => handleSelectFood(food)}
                  >
                    <View style={styles.resultContent}>
                      <View style={styles.resultHeader}>
                        <Text style={[styles.resultName, { color: isDark ? colors.textDark : colors.text }]}>
                          {food.description || 'Unknown Product'}
                        </Text>
                        <View style={[styles.dataTypeBadge, { 
                          backgroundColor: food.dataType === 'Branded' ? colors.primary : 
                                         food.dataType === 'Foundation' ? colors.success : 
                                         colors.textSecondary 
                        }]}>
                          <Text style={styles.dataTypeBadgeText}>
                            {food.dataType === 'Branded' ? 'BRANDED' : 
                             food.dataType === 'Foundation' ? 'FOUNDATION' : 
                             food.dataType.toUpperCase()}
                          </Text>
                        </View>
                      </View>
                      
                      {brandText && (
                        <Text style={[styles.resultBrand, { color: isDark ? colors.textSecondaryDark : colors.textSecondary }]}>
                          {brandText}
                        </Text>
                      )}
                      
                      <Text style={[styles.resultNutrition, { color: isDark ? colors.textSecondaryDark : colors.textSecondary }]}>
                        Per 100g: {Math.round(nutrition.calories)} kcal • P: {Math.round(nutrition.protein)}g • C: {Math.round(nutrition.carbs)}g • F: {Math.round(nutrition.fat)}g
                      </Text>
                      
                      {food.householdServingFullText && (
                        <Text style={[styles.resultServing, { color: isDark ? colors.textSecondaryDark : colors.textSecondary }]}>
                          Serving: {food.householdServingFullText}
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
  loadingSubtext: {
    ...typography.caption,
    marginTop: spacing.xs,
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
    paddingHorizontal: spacing.lg,
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: spacing.md,
  },
  errorTitle: {
    ...typography.h3,
    marginBottom: spacing.sm,
  },
  errorText: {
    ...typography.body,
    textAlign: 'center',
    marginBottom: spacing.lg,
    lineHeight: 22,
  },
  retryButton: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
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
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 4,
    gap: spacing.sm,
  },
  resultName: {
    ...typography.bodyBold,
    fontSize: 16,
    flex: 1,
  },
  dataTypeBadge: {
    paddingHorizontal: spacing.xs,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  dataTypeBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '700',
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
