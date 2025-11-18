
import React from 'react';
import { View, Text, StyleSheet, ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing, borderRadius, typography } from '@/styles/commonStyles';
import { useColorScheme } from '@/hooks/useColorScheme';
import { mockWeightLog, mockGoal } from '@/data/mockData';

export default function ProgressScreen() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const weightData = mockWeightLog;
  const currentWeight = weightData[weightData.length - 1].weight;
  const startWeight = weightData[0].weight;
  const weightChange = currentWeight - startWeight;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: isDark ? colors.backgroundDark : colors.background }]} edges={['top']}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: isDark ? colors.textDark : colors.text }]}>
          Progress
        </Text>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.weightCard, { backgroundColor: isDark ? colors.cardDark : colors.card }]}>
          <Text style={[styles.cardTitle, { color: isDark ? colors.textDark : colors.text }]}>
            Weight Progress
          </Text>
          
          <View style={styles.weightStats}>
            <StatBox
              label="Current"
              value={`${currentWeight} kg`}
              isDark={isDark}
            />
            <StatBox
              label="Start"
              value={`${startWeight} kg`}
              isDark={isDark}
            />
            <StatBox
              label="Change"
              value={`${weightChange > 0 ? '+' : ''}${weightChange.toFixed(1)} kg`}
              color={weightChange < 0 ? colors.success : colors.error}
              isDark={isDark}
            />
          </View>

          <View style={[styles.chartPlaceholder, { backgroundColor: isDark ? colors.backgroundDark : colors.background }]}>
            <Text style={[styles.chartText, { color: isDark ? colors.textSecondaryDark : colors.textSecondary }]}>
              📊 Weight Chart
            </Text>
            <Text style={[styles.chartSubtext, { color: isDark ? colors.textSecondaryDark : colors.textSecondary }]}>
              Track your weight over time
            </Text>
          </View>

          <View style={styles.weightHistory}>
            {weightData.slice().reverse().map((entry, index) => (
              <React.Fragment key={index}>
              <View key={entry.date} style={styles.historyItem}>
                <Text style={[styles.historyDate, { color: isDark ? colors.textSecondaryDark : colors.textSecondary }]}>
                  {new Date(entry.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </Text>
                <Text style={[styles.historyWeight, { color: isDark ? colors.textDark : colors.text }]}>
                  {entry.weight} kg
                </Text>
              </View>
              </React.Fragment>
            ))}
          </View>
        </View>

        <View style={[styles.adherenceCard, { backgroundColor: isDark ? colors.cardDark : colors.card }]}>
          <Text style={[styles.cardTitle, { color: isDark ? colors.textDark : colors.text }]}>
            Weekly Adherence
          </Text>
          
          <View style={styles.adherenceStats}>
            <AdherenceItem
              label="Calories Hit"
              value="5/7 days"
              percentage={71}
              color={colors.calories}
              isDark={isDark}
            />
            <AdherenceItem
              label="Protein Hit"
              value="6/7 days"
              percentage={86}
              color={colors.protein}
              isDark={isDark}
            />
            <AdherenceItem
              label="Logged Meals"
              value="19/21 meals"
              percentage={90}
              color={colors.success}
              isDark={isDark}
            />
          </View>
        </View>

        <View style={[styles.macroTrendsCard, { backgroundColor: isDark ? colors.cardDark : colors.card }]}>
          <Text style={[styles.cardTitle, { color: isDark ? colors.textDark : colors.text }]}>
            Macro Trends (7 Days)
          </Text>
          
          <View style={[styles.chartPlaceholder, { backgroundColor: isDark ? colors.backgroundDark : colors.background }]}>
            <Text style={[styles.chartText, { color: isDark ? colors.textSecondaryDark : colors.textSecondary }]}>
              📈 Macro Trends Chart
            </Text>
            <Text style={[styles.chartSubtext, { color: isDark ? colors.textSecondaryDark : colors.textSecondary }]}>
              View your macro distribution over time
            </Text>
          </View>

          <View style={styles.macroAverages}>
            <MacroAverage label="Protein" value="152g" target={mockGoal.protein_g} color={colors.protein} isDark={isDark} />
            <MacroAverage label="Carbs" value="215g" target={mockGoal.carbs_g} color={colors.carbs} isDark={isDark} />
            <MacroAverage label="Fats" value="58g" target={mockGoal.fats_g} color={colors.fats} isDark={isDark} />
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatBox({ label, value, color, isDark }: any) {
  return (
    <View style={styles.statBox}>
      <Text style={[styles.statLabel, { color: isDark ? colors.textSecondaryDark : colors.textSecondary }]}>
        {label}
      </Text>
      <Text style={[styles.statValue, { color: color || (isDark ? colors.textDark : colors.text) }]}>
        {value}
      </Text>
    </View>
  );
}

function AdherenceItem({ label, value, percentage, color, isDark }: any) {
  return (
    <View style={styles.adherenceItem}>
      <View style={styles.adherenceHeader}>
        <Text style={[styles.adherenceLabel, { color: isDark ? colors.textDark : colors.text }]}>
          {label}
        </Text>
        <Text style={[styles.adherenceValue, { color: isDark ? colors.textSecondaryDark : colors.textSecondary }]}>
          {value}
        </Text>
      </View>
      <View style={[styles.adherenceBar, { backgroundColor: isDark ? colors.borderDark : colors.border }]}>
        <View style={[styles.adherenceBarFill, { width: `${percentage}%`, backgroundColor: color }]} />
      </View>
      <Text style={[styles.adherencePercentage, { color }]}>
        {percentage}%
      </Text>
    </View>
  );
}

function MacroAverage({ label, value, target, color, isDark }: any) {
  return (
    <View style={styles.macroAverage}>
      <View style={[styles.macroColorDot, { backgroundColor: color }]} />
      <View style={styles.macroAverageContent}>
        <Text style={[styles.macroAverageLabel, { color: isDark ? colors.textDark : colors.text }]}>
          {label}
        </Text>
        <Text style={[styles.macroAverageValue, { color: isDark ? colors.textSecondaryDark : colors.textSecondary }]}>
          Avg: {value} / Target: {target}g
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  weightCard: {
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 2,
  },
  cardTitle: {
    ...typography.h3,
    marginBottom: spacing.md,
  },
  weightStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.lg,
  },
  statBox: {
    alignItems: 'center',
  },
  statLabel: {
    ...typography.caption,
    marginBottom: spacing.xs,
  },
  statValue: {
    ...typography.h3,
  },
  chartPlaceholder: {
    borderRadius: borderRadius.md,
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  chartText: {
    ...typography.h3,
    marginBottom: spacing.xs,
  },
  chartSubtext: {
    ...typography.caption,
    textAlign: 'center',
  },
  weightHistory: {
    gap: spacing.sm,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  historyDate: {
    ...typography.body,
  },
  historyWeight: {
    ...typography.bodyBold,
  },
  adherenceCard: {
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 2,
  },
  adherenceStats: {
    gap: spacing.lg,
  },
  adherenceItem: {
    gap: spacing.xs,
  },
  adherenceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  adherenceLabel: {
    ...typography.bodyBold,
  },
  adherenceValue: {
    ...typography.caption,
  },
  adherenceBar: {
    height: 8,
    borderRadius: borderRadius.full,
    overflow: 'hidden',
  },
  adherenceBarFill: {
    height: '100%',
    borderRadius: borderRadius.full,
  },
  adherencePercentage: {
    ...typography.small,
    fontWeight: '600',
    alignSelf: 'flex-end',
  },
  macroTrendsCard: {
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    boxShadow: '0px 2px 8px rgba(0, 0, 0, 0.08)',
    elevation: 2,
  },
  macroAverages: {
    gap: spacing.md,
  },
  macroAverage: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  macroColorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  macroAverageContent: {
    flex: 1,
  },
  macroAverageLabel: {
    ...typography.bodyBold,
    marginBottom: 2,
  },
  macroAverageValue: {
    ...typography.caption,
  },
});
