import React, { useCallback, useState } from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { container } from "../adapters/container";
import { getActiveUserId } from "../domain/identity";
import { summarize, currentYearMonth, SpendSummary } from "../domain/spendSummary";
import { CATEGORY_LABELS } from "../domain/categoryLabels";
import { CATEGORY_COLORS } from "../domain/categoryColors";
import { formatINR } from "../domain/formatCurrency";
import { colors, spacing, radius } from "../theme";
import type { RootStackParamList } from "../navigation/RootNavigator";

type Props = NativeStackScreenProps<RootStackParamList, "SpendSummary">;

const EMPTY: SpendSummary = { monthTotal: 0, byCategory: [] };

export default function SpendSummaryScreen(_props: Props) {
  const [summary, setSummary] = useState<SpendSummary>(EMPTY);

  const load = useCallback(async () => {
    const uid = await getActiveUserId();
    const expenses = await container.expenseRepository.listForMonth(uid, currentYearMonth());
    setSummary(summarize(expenses));
  }, []);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.label}>This month</Text>
      <Text style={styles.total}>{formatINR(summary.monthTotal)}</Text>

      {summary.byCategory.length === 0 ? (
        <Text style={styles.empty}>No spending yet this month.</Text>
      ) : (
        <View style={styles.breakdown}>
          {summary.byCategory.map((row) => (
            <View key={row.category} style={styles.row}>
              <View style={styles.rowHeader}>
                <View style={styles.rowLabelGroup}>
                  <View
                    style={[styles.swatch, { backgroundColor: CATEGORY_COLORS[row.category] }]}
                  />
                  <Text style={styles.rowLabel}>{CATEGORY_LABELS[row.category]}</Text>
                </View>
                <Text style={styles.rowAmount}>{formatINR(row.total)}</Text>
              </View>
              <View style={styles.track}>
                <View
                  style={[
                    styles.fill,
                    {
                      width: `${Math.max(row.share * 100, 2)}%`,
                      backgroundColor: CATEGORY_COLORS[row.category],
                    },
                  ]}
                />
              </View>
              <Text style={styles.rowShare}>{Math.round(row.share * 100)}%</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingTop: spacing.xl, paddingBottom: spacing.xl },
  label: { color: colors.textSecondary, fontSize: 14 },
  total: { color: colors.textPrimary, fontSize: 40, fontWeight: "700", marginTop: 4, marginBottom: spacing.lg },
  empty: { color: colors.textSecondary, marginTop: spacing.lg },
  breakdown: { gap: spacing.md },
  row: { backgroundColor: colors.surface, borderRadius: radius.md, padding: spacing.md },
  rowHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: spacing.sm,
  },
  rowLabelGroup: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  swatch: { width: 10, height: 10, borderRadius: 3 },
  rowLabel: { color: colors.textPrimary, fontSize: 15, fontWeight: "600" },
  rowAmount: { color: colors.textPrimary, fontSize: 15, fontWeight: "600" },
  track: {
    height: 8,
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.sm,
    overflow: "hidden",
  },
  fill: { height: 8, borderRadius: radius.sm },
  rowShare: { color: colors.textSecondary, fontSize: 12, marginTop: spacing.xs },
});
