
import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from "react-native";
import { useRouter } from 'expo-router';
import { SafeAreaView } from "react-native-safe-area-context";
import { IconSymbol } from "@/components/IconSymbol";
import { GlassView } from "expo-glass-effect";
import { useTheme } from "@react-navigation/native";
import { colors, spacing, borderRadius, typography } from '@/styles/commonStyles';
import { mockUser, mockGoal } from '@/data/mockData';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function ProfileScreen() {
  const theme = useTheme();
  const router = useRouter();
  const isDark = theme.dark;

  const user = mockUser;
  const goal = mockGoal;

  const handleResetOnboarding = async () => {
    Alert.alert(
      'Reset Onboarding',
      'This will clear your onboarding data and let you set up your goals again.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.removeItem('onboarding_complete');
            await AsyncStorage.removeItem('onboarding_data');
            router.push('/onboarding/welcome');
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
      >
        <GlassView style={styles.profileHeader} glassEffectStyle="regular">
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Text style={styles.avatarText}>
              {user.email?.charAt(0).toUpperCase() || 'U'}
            </Text>
          </View>
          <Text style={[styles.name, { color: theme.colors.text }]}>
            {user.email || 'Guest User'}
          </Text>
          <View style={[styles.badge, { backgroundColor: user.user_type === 'premium' ? colors.accent : colors.primary }]}>
            <Text style={styles.badgeText}>
              {user.user_type === 'premium' ? '⭐ Premium' : user.user_type === 'free' ? 'Free' : 'Guest'}
            </Text>
          </View>
        </GlassView>

        <GlassView style={styles.section} glassEffectStyle="regular">
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Your Stats
          </Text>
          <View style={styles.statsGrid}>
            <StatItem label="Height" value={`${user.height} cm`} theme={theme} />
            <StatItem label="Weight" value={`${user.weight} kg`} theme={theme} />
            <StatItem label="Age" value={`${new Date().getFullYear() - new Date(user.dob).getFullYear()} years`} theme={theme} />
            <StatItem label="Sex" value={user.sex === 'male' ? 'Male' : 'Female'} theme={theme} />
          </View>
        </GlassView>

        <GlassView style={styles.section} glassEffectStyle="regular">
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Current Goals
          </Text>
          
          <View style={styles.goalItem}>
            <Text style={[styles.goalLabel, { color: isDark ? '#98989D' : '#666' }]}>
              Goal Type
            </Text>
            <Text style={[styles.goalValue, { color: theme.colors.text }]}>
              {goal.goal_type === 'lose' ? 'Lose Weight' : goal.goal_type === 'gain' ? 'Gain Weight' : 'Maintain Weight'}
            </Text>
          </View>
          
          <View style={styles.goalItem}>
            <Text style={[styles.goalLabel, { color: isDark ? '#98989D' : '#666' }]}>
              Daily Calories
            </Text>
            <Text style={[styles.goalValue, { color: theme.colors.text }]}>
              {goal.daily_calories} kcal
            </Text>
          </View>
          
          <View style={styles.goalItem}>
            <Text style={[styles.goalLabel, { color: isDark ? '#98989D' : '#666' }]}>
              Macros
            </Text>
            <Text style={[styles.goalValue, { color: theme.colors.text }]}>
              P: {goal.protein_g}g • C: {goal.carbs_g}g • F: {goal.fats_g}g
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.editButton, { backgroundColor: colors.primary }]}
            onPress={handleResetOnboarding}
          >
            <Text style={styles.editButtonText}>Edit Goals</Text>
          </TouchableOpacity>
        </GlassView>

        <GlassView style={styles.section} glassEffectStyle="regular">
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Settings
          </Text>
          
          <SettingItem
            icon="bell.fill"
            androidIcon="notifications"
            label="Reminders"
            onPress={() => console.log('Reminders')}
            theme={theme}
          />
          <SettingItem
            icon="moon.fill"
            androidIcon="dark_mode"
            label="Theme"
            value={theme.dark ? 'Dark' : 'Light'}
            onPress={() => console.log('Theme')}
            theme={theme}
          />
          <SettingItem
            icon="globe"
            androidIcon="language"
            label="Units"
            value="Metric"
            onPress={() => console.log('Units')}
            theme={theme}
          />
        </GlassView>

        <GlassView style={styles.section} glassEffectStyle="regular">
          <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
            Developer
          </Text>
          
          <SettingItem
            icon="arrow.up.circle.fill"
            androidIcon="cloud_upload"
            label="Publish App"
            onPress={() => router.push('/publish')}
            theme={theme}
          />
        </GlassView>

        {user.user_type !== 'premium' && (
          <TouchableOpacity
            style={[styles.premiumCard, { backgroundColor: colors.accent }]}
            onPress={() => console.log('Upgrade to premium')}
          >
            <Text style={styles.premiumIcon}>⭐</Text>
            <Text style={styles.premiumTitle}>Upgrade to Premium</Text>
            <Text style={styles.premiumSubtitle}>
              Unlock advanced analytics, custom recipes, and more
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[styles.logoutButton, { borderColor: colors.error }]}
          onPress={() => console.log('Logout')}
        >
          <Text style={[styles.logoutText, { color: colors.error }]}>
            Log Out
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatItem({ label, value, theme }: any) {
  return (
    <View style={styles.statItem}>
      <Text style={[styles.statItemLabel, { color: theme.dark ? '#98989D' : '#666' }]}>
        {label}
      </Text>
      <Text style={[styles.statItemValue, { color: theme.colors.text }]}>
        {value}
      </Text>
    </View>
  );
}

function SettingItem({ icon, androidIcon, label, value, onPress, theme }: any) {
  return (
    <TouchableOpacity style={styles.settingItem} onPress={onPress}>
      <View style={styles.settingLeft}>
        <IconSymbol
          ios_icon_name={icon}
          android_material_icon_name={androidIcon}
          size={24}
          color={theme.colors.text}
        />
        <Text style={[styles.settingLabel, { color: theme.colors.text }]}>
          {label}
        </Text>
      </View>
      <View style={styles.settingRight}>
        {value && (
          <Text style={[styles.settingValue, { color: theme.dark ? '#98989D' : '#666' }]}>
            {value}
          </Text>
        )}
        <IconSymbol
          ios_icon_name="chevron.right"
          android_material_icon_name="chevron_right"
          size={20}
          color={theme.dark ? '#98989D' : '#666'}
        />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  contentContainer: {
    padding: 20,
    paddingBottom: 120,
  },
  profileHeader: {
    alignItems: 'center',
    borderRadius: 12,
    padding: 32,
    marginBottom: 16,
    gap: 12,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: '700',
  },
  badge: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  email: {
    fontSize: 16,
  },
  section: {
    borderRadius: 12,
    padding: 20,
    gap: 12,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  statItem: {
    width: '48%',
  },
  statItemLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  statItemValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  goalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  goalLabel: {
    fontSize: 14,
  },
  goalValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  editButton: {
    borderRadius: borderRadius.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  editButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  settingLabel: {
    fontSize: 16,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  settingValue: {
    fontSize: 16,
  },
  premiumCard: {
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  premiumIcon: {
    fontSize: 48,
    marginBottom: spacing.sm,
  },
  premiumTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  premiumSubtitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 14,
    textAlign: 'center',
  },
  logoutButton: {
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderWidth: 2,
    marginBottom: spacing.md,
  },
  logoutText: {
    fontWeight: '600',
    fontSize: 16,
  },
});
