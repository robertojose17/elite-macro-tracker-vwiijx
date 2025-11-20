
import React, { useEffect, useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, RefreshControl } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { IconSymbol } from '@/components/IconSymbol';
import { GlassView } from 'expo-glass-effect';
import { useTheme } from '@react-navigation/native';
import { colors, spacing, borderRadius, typography } from '@/styles/commonStyles';
import { supabase } from '@/app/integrations/supabase/client';
import { cmToFeetInches, kgToLbs } from '@/utils/calculations';

export default function ProfileScreen() {
  const theme = useTheme();
  const router = useRouter();
  const isDark = theme.dark;

  const [user, setUser] = useState<any>(null);
  const [goal, setGoal] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      console.log('[Profile iOS] Screen focused, loading data');
      loadUserData();
    }, [])
  );

  const loadUserData = async () => {
    try {
      setLoading(true);
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        console.log('[Profile iOS] No authenticated user found');
        setLoading(false);
        return;
      }

      console.log('[Profile iOS] Loading profile for user:', authUser.id);

      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .maybeSingle();

      if (userError) {
        console.error('[Profile iOS] Error loading user data:', userError);
      } else if (userData) {
        console.log('[Profile iOS] User data loaded:', userData);
        setUser({ ...authUser, ...userData });
      } else {
        console.log('[Profile iOS] No user data found in database');
        setUser(authUser);
      }

      const { data: goalData, error: goalError } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', authUser.id)
        .eq('is_active', true)
        .maybeSingle();

      if (goalError) {
        console.error('[Profile iOS] Error loading goal:', goalError);
      } else if (goalData) {
        console.log('[Profile iOS] Goal data loaded:', goalData);
        setGoal(goalData);
      } else {
        console.log('[Profile iOS] No active goal found for user');
        setGoal(null);
      }
    } catch (error) {
      console.error('[Profile iOS] Error in loadUserData:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadUserData();
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
              
              router.push('/onboarding/complete');
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

  const formatHeight = (heightCm: number, units: string) => {
    if (units === 'imperial') {
      const { feet, inches } = cmToFeetInches(heightCm);
      return `${feet}' ${inches}"`;
    }
    return `${Math.round(heightCm)} cm`;
  };

  const formatWeight = (weightKg: number, units: string) => {
    if (units === 'imperial') {
      return `${Math.round(kgToLbs(weightKg))} lbs`;
    }
    return `${Math.round(weightKg)} kg`;
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]} edges={['top']}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: theme.colors.text }]}>
            Loading profile...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]} edges={['top']}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: theme.colors.text }]}>
            No user data available
          </Text>
          <TouchableOpacity
            style={[styles.button, { backgroundColor: colors.primary }]}
            onPress={() => router.replace('/auth/welcome')}
          >
            <Text style={styles.buttonText}>Go to Login</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const units = user.preferred_units || 'metric';

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
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

        {(user.height || user.current_weight) && (
          <GlassView style={styles.section} glassEffectStyle="regular">
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Your Stats
            </Text>
            <View style={styles.statsGrid}>
              {user.height && (
                <StatItem 
                  label="Height" 
                  value={formatHeight(user.height, units)} 
                  theme={theme} 
                />
              )}
              {user.current_weight && (
                <StatItem 
                  label="Weight" 
                  value={formatWeight(user.current_weight, units)} 
                  theme={theme} 
                />
              )}
              {user.date_of_birth && (
                <StatItem label="Age" value={`${calculateAge(user.date_of_birth)} years`} theme={theme} />
              )}
              {user.sex && (
                <StatItem 
                  label="Sex" 
                  value={user.sex === 'male' ? 'Male' : user.sex === 'female' ? 'Female' : 'Other'} 
                  theme={theme} 
                />
              )}
            </View>
          </GlassView>
        )}

        {goal ? (
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
        ) : (
          <GlassView style={styles.section} glassEffectStyle="regular">
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              No Goals Set
            </Text>
            <Text style={[styles.noGoalText, { color: isDark ? '#98989D' : '#666' }]}>
              Complete onboarding to set your nutrition goals
            </Text>
            <TouchableOpacity
              style={[styles.editButton, { backgroundColor: colors.primary }]}
              onPress={() => router.push('/onboarding/complete')}
            >
              <Text style={styles.editButtonText}>Set Up Goals</Text>
            </TouchableOpacity>
          </GlassView>
        )}

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

        <TouchableOpacity
          style={[styles.logoutButton, { borderColor: colors.error }]}
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
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  loadingText: {
    ...typography.body,
  },
  button: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '600',
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
  noGoalText: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: spacing.md,
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
