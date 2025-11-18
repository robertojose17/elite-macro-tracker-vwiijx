
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Platform, Modal } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, borderRadius, typography } from '@/styles/commonStyles';
import { useColorScheme } from '@/hooks/useColorScheme';
import { IconSymbol } from '@/components/IconSymbol';
import { mockFoods } from '@/data/mockData';

export default function AddFoodScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const mealType = params.mealType as string || 'breakfast';
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'recent' | 'favorites' | 'all'>('recent');
  const [showCopyModal, setShowCopyModal] = useState(false);

  const filteredFoods = mockFoods.filter(food =>
    food.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (food.brand && food.brand.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const recentFoods = filteredFoods.slice(0, 5);
  const favoriteFoods = filteredFoods.filter(food => food.is_favorite);

  const displayFoods = activeTab === 'recent' ? recentFoods : activeTab === 'favorites' ? favoriteFoods : filteredFoods;

  const handleBarcodeScan = () => {
    console.log('Opening barcode scanner...');
    router.push('/barcode-scanner');
  };

  const handleCopyFromPreviousDays = () => {
    console.log('Opening copy from previous days...');
    setShowCopyModal(true);
  };

  const handleCloseCopyModal = () => {
    setShowCopyModal(false);
  };

  const handleCopyMeal = (date: string, meal: string) => {
    console.log(`Copying meal from ${date} - ${meal}`);
    setShowCopyModal(false);
    // In a real app, this would copy the meal items
    alert(`Copied ${meal} from ${date} to current ${mealType}`);
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
          Add Food to {mealType.charAt(0).toUpperCase() + mealType.slice(1)}
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
            placeholder="Search foods..."
            placeholderTextColor={isDark ? colors.textSecondaryDark : colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      <View style={styles.actionButtons}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.primary }]}
          onPress={handleBarcodeScan}
        >
          <IconSymbol
            ios_icon_name="barcode.viewfinder"
            android_material_icon_name="qr_code_scanner"
            size={20}
            color="#FFFFFF"
          />
          <Text style={styles.actionButtonText}>Barcode Scan</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.secondary }]}
          onPress={handleCopyFromPreviousDays}
        >
          <IconSymbol
            ios_icon_name="doc.on.doc"
            android_material_icon_name="content_copy"
            size={20}
            color="#FFFFFF"
          />
          <Text style={styles.actionButtonText}>Copy from Previous</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tabs}>
        <TabButton
          label="Recent"
          active={activeTab === 'recent'}
          onPress={() => setActiveTab('recent')}
          isDark={isDark}
        />
        <TabButton
          label="Favorites"
          active={activeTab === 'favorites'}
          onPress={() => setActiveTab('favorites')}
          isDark={isDark}
        />
        <TabButton
          label="All Foods"
          active={activeTab === 'all'}
          onPress={() => setActiveTab('all')}
          isDark={isDark}
        />
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {displayFoods.map((food, index) => (
          <React.Fragment key={index}>
          <TouchableOpacity
            style={[styles.foodCard, { backgroundColor: isDark ? colors.cardDark : colors.card }]}
            onPress={() => console.log('Select food', food.name)}
          >
            <View style={styles.foodInfo}>
              <Text style={[styles.foodName, { color: isDark ? colors.textDark : colors.text }]}>
                {food.name}
              </Text>
              {food.brand && (
                <Text style={[styles.foodBrand, { color: isDark ? colors.textSecondaryDark : colors.textSecondary }]}>
                  {food.brand}
                </Text>
              )}
              <Text style={[styles.foodServing, { color: isDark ? colors.textSecondaryDark : colors.textSecondary }]}>
                {food.serving_amount}{food.serving_unit} • {food.calories} kcal
              </Text>
            </View>
            
            <View style={styles.foodMacros}>
              <MacroPill label="P" value={food.protein} color={colors.protein} />
              <MacroPill label="C" value={food.carbs} color={colors.carbs} />
              <MacroPill label="F" value={food.fats} color={colors.fats} />
            </View>
          </TouchableOpacity>
          </React.Fragment>
        ))}

        {displayFoods.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🔍</Text>
            <Text style={[styles.emptyText, { color: isDark ? colors.textSecondaryDark : colors.textSecondary }]}>
              No foods found
            </Text>
            <TouchableOpacity
              style={[styles.createButton, { backgroundColor: colors.primary }]}
              onPress={() => console.log('Create food')}
            >
              <Text style={styles.createButtonText}>Create Custom Food</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      <CopyFromPreviousModal
        visible={showCopyModal}
        onClose={handleCloseCopyModal}
        onCopyMeal={handleCopyMeal}
        isDark={isDark}
      />
    </SafeAreaView>
  );
}

function TabButton({ label, active, onPress, isDark }: any) {
  return (
    <TouchableOpacity
      style={[
        styles.tabButton,
        active && { borderBottomColor: colors.primary, borderBottomWidth: 2 },
      ]}
      onPress={onPress}
    >
      <Text style={[
        styles.tabText,
        { color: isDark ? colors.textSecondaryDark : colors.textSecondary },
        active && { color: colors.primary, fontWeight: '600' },
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function MacroPill({ label, value, color }: any) {
  return (
    <View style={[styles.macroPill, { backgroundColor: color + '20' }]}>
      <Text style={[styles.macroPillText, { color }]}>
        {label} {Math.round(value)}g
      </Text>
    </View>
  );
}

function CopyFromPreviousModal({ visible, onClose, onCopyMeal, isDark }: any) {
  const previousDays = [
    { date: 'Yesterday', meals: ['Breakfast', 'Lunch', 'Dinner', 'Snacks'] },
    { date: '2 days ago', meals: ['Breakfast', 'Lunch', 'Dinner'] },
    { date: '3 days ago', meals: ['Breakfast', 'Lunch', 'Dinner', 'Snacks'] },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: isDark ? colors.cardDark : colors.card }]}>
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: isDark ? colors.textDark : colors.text }]}>
              Copy from Previous Days
            </Text>
            <TouchableOpacity onPress={onClose}>
              <IconSymbol
                ios_icon_name="xmark"
                android_material_icon_name="close"
                size={24}
                color={isDark ? colors.textDark : colors.text}
              />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalScroll}>
            {previousDays.map((day, dayIndex) => (
              <React.Fragment key={dayIndex}>
              <View style={styles.daySection}>
                <Text style={[styles.dayTitle, { color: isDark ? colors.textDark : colors.text }]}>
                  {day.date}
                </Text>
                {day.meals.map((meal, mealIndex) => (
                  <React.Fragment key={mealIndex}>
                  <TouchableOpacity
                    style={[styles.mealOption, { backgroundColor: isDark ? colors.backgroundDark : colors.background }]}
                    onPress={() => onCopyMeal(day.date, meal)}
                  >
                    <Text style={[styles.mealOptionText, { color: isDark ? colors.textDark : colors.text }]}>
                      {meal}
                    </Text>
                    <IconSymbol
                      ios_icon_name="chevron.right"
                      android_material_icon_name="chevron_right"
                      size={20}
                      color={isDark ? colors.textSecondaryDark : colors.textSecondary}
                    />
                  </TouchableOpacity>
                  </React.Fragment>
                ))}
              </View>
              </React.Fragment>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
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
  searchContainer: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 14,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
  },
  tabButton: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  tabText: {
    ...typography.body,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xxl,
  },
  foodCard: {
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 2,
  },
  foodInfo: {
    marginBottom: spacing.sm,
  },
  foodName: {
    ...typography.bodyBold,
    marginBottom: 2,
  },
  foodBrand: {
    ...typography.caption,
    marginBottom: 2,
  },
  foodServing: {
    ...typography.caption,
  },
  foodMacros: {
    flexDirection: 'row',
    gap: spacing.xs,
  },
  macroPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  macroPillText: {
    ...typography.small,
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
    ...typography.body,
    marginBottom: spacing.lg,
  },
  createButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  createButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xl,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.lg,
  },
  modalTitle: {
    ...typography.h3,
  },
  modalScroll: {
    paddingHorizontal: spacing.lg,
  },
  daySection: {
    marginBottom: spacing.lg,
  },
  dayTitle: {
    ...typography.bodyBold,
    marginBottom: spacing.sm,
  },
  mealOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.xs,
  },
  mealOptionText: {
    ...typography.body,
  },
});
