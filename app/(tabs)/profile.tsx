
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, borderRadius, typography } from '@/styles/commonStyles';
import { useColorScheme } from '@/hooks/useColorScheme';
import { IconSymbol } from '@/components/IconSymbol';
import { supabase } from '@/app/integrations/supabase/client';

export default function ProfileScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const [user, setUser] = useState<any>(null);
  const [goal, setGoal] = useState<any>(null);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) return;

      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      const { data: goalData } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', authUser.id)
        .eq('is_active', true)
        .single();

      setUser({ ...authUser, ...userData });
      setGoal(goalData);
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const handleLogout = async () => {
    Alert.alert(
      'Log Out',
      'Are you sure you want to log out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            await supabase.auth.signOut();
            router.replace('/auth/welcome');
          },
        },
      ]
    );
  };

  const handleResetOnboarding = async () => {
    Alert.alert(
      'Reset Goals',
      'This will let you set up your goals again.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            if (user) {
              await supabase
                .from('users')
                .update({ onboarding_completed: false })
                .eq('id', user.id);
              
              router.push('/onboarding/personal-info');
            }
          },
        },
      ]
    );
  };

  const calculateAge = (dob: string) => {
    if (!dob) return 'N/A';
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  if (!user) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: isDark ? colors.backgroundDark : colors.background }]} edges={['top']}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: isDark ? colors.textDark : colors.text }]}>
            Loading profile...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? colors.backgroundDark : colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: isDark ? colors.textDark : colors.text }]}>
          Profile
        </Text>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.profileCard, { backgroundColor: isDark ? colors.cardDark : colors.card }]}>
          <View style={[styles.avatar, { backgroundColor: colors.primary }]}>
            <Text style={styles.avatarText}>
              {user.email?.charAt(0).toUpperCase() || 'U'}
            </Text>
          </View>
          
          <Text style={[styles.email, { color: isDark ? colors.textDark : colors.text }]}>
            {user.email || 'Guest User'}
          </Text>
          
          <View style={[styles.badge, { backgroundColor: user.user_type === 'premium' ? colors.accent : colors.primary }]}>
            <Text style={styles.badgeText}>
              {user.user_type === 'premium' ? '⭐ Premium' : user.user_type === 'free' ? 'Free' : 'Guest'}
            </Text>
          </View>
        </View>

        {user.height && user.current_weight && (
          <View style={[styles.statsCard, { backgroundColor: isDark ? colors.cardDark : colors.card }]}>
            <Text style={[styles.sectionTitle, { color: isDark ? colors.textDark : colors.text }]}>
              Your Stats
            </Text>
            
            <View style={styles.statsGrid}>
              <StatItem label="Height" value={`${user.height} cm`} isDark={isDark} />
              <StatItem label="Weight" value={`${user.current_weight} kg`} isDark={isDark} />
              {user.date_of_birth && (
                <StatItem label="Age" value={`${calculateAge(user.date_of_birth)} years`} isDark={isDark} />
              )}
              {user.sex && (
                <StatItem label="Sex" value={user.sex === 'male' ? 'Male' : 'Female'} isDark={isDark} />
              )}
            </View>
          </View>
        )}

        {goal && (
          <View style={[styles.goalsCard, { backgroundColor: isDark ? colors.cardDark : colors.card }]}>
            <Text style={[styles.sectionTitle, { color: isDark ? colors.textDark : colors.text }]}>
              Current Goals
            </Text>
            
            <View style={styles.goalItem}>
              <Text style={[styles.goalLabel, { color: isDark ? colors.textSecondaryDark : colors.textSecondary }]}>
                Goal Type
              </Text>
              <Text style={[styles.goalValue, { color: isDark ? colors.textDark : colors.text }]}>
                {goal.goal_type === 'lose' ? 'Lose Weight' : goal.goal_type === 'gain' ? 'Gain Weight' : 'Maintain Weight'}
              </Text>
            </View>
            
            <View style={styles.goalItem}>
              <Text style={[styles.goalLabel, { color: isDark ? colors.textSecondaryDark : colors.textSecondary }]}>
                Daily Calories
              </Text>
              <Text style={[styles.goalValue, { color: isDark ? colors.textDark : colors.text }]}>
                {goal.daily_calories} kcal
              </Text>
            </View>
            
            <View style={styles.goalItem}>
              <Text style={[styles.goalLabel, { color: isDark ? colors.textSecondaryDark : colors.textSecondary }]}>
                Macros
              </Text>
              <Text style={[styles.goalValue, { color: isDark ? colors.textDark : colors.text }]}>
                P: {goal.protein_g}g • C: {goal.carbs_g}g • F: {goal.fats_g}g
              </Text>
            </View>

            <TouchableOpacity
              style={[styles.editButton, { backgroundColor: colors.primary }]}
              onPress={handleResetOnboarding}
            >
              <Text style={styles.editButtonText}>Edit Goals</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={[styles.settingsCard, { backgroundColor: isDark ? colors.cardDark : colors.card }]}>
          <Text style={[styles.sectionTitle, { color: isDark ? colors.textDark : colors.text }]}>
            Settings
          </Text>
          
          <SettingItem
            icon="notifications"
            label="Reminders"
            onPress={() => console.log('Reminders')}
            isDark={isDark}
          />
          <SettingItem
            icon="dark_mode"
            label="Theme"
            value={colorScheme === 'dark' ? 'Dark' : 'Light'}
            onPress={() => console.log('Theme')}
            isDark={isDark}
          />
          <SettingItem
            icon="language"
            label="Units"
            value="Metric"
            onPress={() => console.log('Units')}
            isDark={isDark}
          />
        </View>

        <View style={[styles.settingsCard, { backgroundColor: isDark ? colors.cardDark : colors.card }]}>
          <Text style={[styles.sectionTitle, { color: isDark ? colors.textDark : colors.text }]}>
            Developer
          </Text>
          
          <SettingItem
            icon="cloud_upload"
            label="Publish App"
            onPress={() => router.push('/publish')}
            isDark={isDark}
          />
        </View>

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
          style={[styles.logoutButton, { backgroundColor: isDark ? colors.cardDark : colors.card, borderColor: colors.error }]}
          onPress={handleLogout}
        >
          <Text style={[styles.logoutText, { color: colors.error }]}>
            Log Out
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatItem({ label, value, isDark }: any) {
  return (
    <View style={styles.statItem}>
      <Text style={[styles.statItemLabel, { color: isDark ? colors.textSecondaryDark : colors.textSecondary }]}>
        {label}
      </Text>
      <Text style={[styles.statItemValue, { color: isDark ? colors.textDark : colors.text }]}>
        {value}
      </Text>
    </View>
  );
}

function SettingItem({ icon, label, value, onPress, isDark }: any) {
  return (
    <TouchableOpacity style={styles.settingItem} onPress={onPress}>
      <View style={styles.settingLeft}>
        <IconSymbol
          ios_icon_name={icon}
          android_material_icon_name={icon}
          size={24}
          color={isDark ? colors.textDark : colors.text}
        />
        <Text style={[styles.settingLabel, { color: isDark ? colors.textDark : colors.text }]}>
          {label}
        </Text>
      </View>
      <View style={styles.settingRight}>
        {value && (
          <Text style={[styles.settingValue, { color: isDark ? colors.textSecondaryDark : colors.textSecondary }]}>
            {value}
          </Text>
        )}
        <IconSymbol
          ios_icon_name="chevron_right"
          android_material_icon_name="chevron_right"
          size={20}
          color={isDark ? colors.textSecondaryDark : colors.textSecondary}
        />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    ...typography.body,
  },
  header: {
    paddingHorizontal: spacing.md,
    paddingTop: Platform.OS === 'android' ? spacing.lg : 0,
    paddingBottom: spacing.md,
  },
  title: {
    ...typography.h2,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: 120,
  },
  profileCard: {
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.md,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 2,
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
  email: {
    ...typography.h3,
    marginBottom: spacing.sm,
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
  statsCard: {
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 2,
  },
  sectionTitle: {
    ...typography.h3,
    marginBottom: spacing.md,
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
    ...typography.caption,
    marginBottom: spacing.xs,
  },
  statItemValue: {
    ...typography.bodyBold,
  },
  goalsCard: {
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 2,
  },
  goalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  goalLabel: {
    ...typography.body,
  },
  goalValue: {
    ...typography.bodyBold,
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
  settingsCard: {
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 2,
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
    ...typography.body,
  },
  settingRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  settingValue: {
    ...typography.body,
  },
  premiumCard: {
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    marginBottom: spacing.md,
    boxShadow: '0px 4px 12px rgba(212, 175, 55, 0.3)',
    elevation: 3,
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
