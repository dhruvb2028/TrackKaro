import React, { useCallback, useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  Pressable,
  Platform,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Expense } from "../domain/models";
import { container } from "../adapters/container";
import { getActiveUserId } from "../domain/identity";
import { CATEGORY_LABELS, ALL_CATEGORIES } from "../domain/categoryLabels";
import { setExpenseCategory } from "../domain/addExpense";
import { formatINR } from "../domain/formatCurrency";
import { prefs } from "../domain/prefs";
import { colors, spacing, radius } from "../theme";
import type { RootStackParamList } from "../navigation/RootNavigator";

type Props = NativeStackScreenProps<RootStackParamList, "ExpenseList">;

export default function ExpenseListScreen({ navigation }: Props) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [categoryPickerFor, setCategoryPickerFor] = useState<Expense | null>(null);
  const [showNudge, setShowNudge] = useState(false);

  const load = useCallback(async () => {
    const uid = await getActiveUserId();
    setUserId(uid);
    const list = await container.expenseRepository.listForUser(uid);
    setExpenses(list);

    // Soft sign-up nudge: only after the first expense, once, non-blocking (§4.4).
    const [dismissed, signedUp] = await Promise.all([
      prefs.isSignupNudgeDismissed(),
      prefs.isSignedUp(),
    ]);
    setShowNudge(list.length > 0 && !dismissed && !signedUp);
  }, []);

  const dismissNudge = async () => {
    setShowNudge(false);
    await prefs.dismissSignupNudge();
  };

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  const monthTotal = expenses
    .filter((e) => e.date.slice(0, 7) === new Date().toISOString().slice(0, 7))
    .reduce((sum, e) => sum + e.amount, 0);

  const handlePickCategory = async (category: (typeof ALL_CATEGORIES)[number]) => {
    if (!categoryPickerFor) return;
    await setExpenseCategory(categoryPickerFor, category);
    setCategoryPickerFor(null);
    load();
  };

  return (
    <View style={styles.container}>
      <View style={styles.headerBar}>
        <Pressable
          style={styles.header}
          onPress={() => navigation.navigate("SpendSummary")}
          accessibilityRole="button"
          accessibilityLabel={`This month, ${formatINR(monthTotal)}. View spending breakdown`}
        >
          <Text style={styles.headerLabel}>This month ›</Text>
          <Text style={styles.headerAmount}>{formatINR(monthTotal)}</Text>
        </Pressable>
        <View style={styles.headerActions}>
          <Pressable
            style={styles.payButton}
            onPress={() => navigation.navigate("Pay")}
            accessibilityRole="button"
            accessibilityLabel="Pay via UPI"
          >
            <Text style={styles.payButtonText}>Pay</Text>
          </Pressable>
          <Pressable
            style={styles.settingsButton}
            onPress={() => navigation.navigate("Settings")}
            accessibilityRole="button"
            accessibilityLabel="Settings"
          >
            <Text style={styles.settingsIcon}>⚙︎</Text>
          </Pressable>
        </View>
      </View>

      {showNudge && (
        <Pressable
          style={styles.nudge}
          onPress={() => navigation.navigate("SignUp")}
          accessibilityRole="button"
          accessibilityLabel="Back up your data. Sign up to keep it safe on any device"
        >
          <View style={styles.nudgeText}>
            <Text style={styles.nudgeTitle}>Back up your data</Text>
            <Text style={styles.nudgeSubtitle}>Sign up to keep it safe on any device.</Text>
          </View>
          <Pressable
            hitSlop={8}
            onPress={dismissNudge}
            accessibilityRole="button"
            accessibilityLabel="Dismiss backup reminder"
          >
            <Text style={styles.nudgeClose}>✕</Text>
          </Pressable>
        </Pressable>
      )}

      {expenses.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No expenses yet</Text>
          <Text style={styles.emptySubtitle}>
            Snap a bill or add one manually to get started.
          </Text>
        </View>
      ) : (
        <FlatList
          data={expenses}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.row}>
              <Pressable
                style={styles.rowLeft}
                onPress={() => navigation.navigate("ExpenseDetail", { expenseId: item.id })}
                accessibilityRole="button"
                accessibilityLabel={`${item.merchant ?? "Expense"}, ${formatINR(item.amount)}, ${item.date}`}
                accessibilityHint="Opens expense details to edit or delete"
              >
                <Text style={styles.merchant}>{item.merchant ?? "Expense"}</Text>
                <Text style={styles.date}>{item.date}</Text>
              </Pressable>
              <View style={styles.rowRight}>
                <Text style={styles.amount}>{formatINR(item.amount)}</Text>
                <Pressable
                  onPress={() => setCategoryPickerFor(item)}
                  style={styles.categoryChip}
                  accessibilityRole="button"
                  accessibilityLabel={`Category: ${CATEGORY_LABELS[item.category]}. Change`}
                >
                  <Text style={styles.categoryChipText}>
                    {CATEGORY_LABELS[item.category]}
                  </Text>
                </Pressable>
              </View>
            </View>
          )}
        />
      )}

      {categoryPickerFor && (
        <View
          style={styles.pickerOverlay}
          accessibilityViewIsModal
          accessibilityRole="menu"
        >
          <View style={styles.pickerCard}>
            <Text style={styles.pickerTitle}>Set category</Text>
            {ALL_CATEGORIES.map((cat) => (
              <Pressable
                key={cat}
                style={styles.pickerOption}
                onPress={() => handlePickCategory(cat)}
                accessibilityRole="menuitem"
                accessibilityLabel={CATEGORY_LABELS[cat]}
              >
                <Text style={styles.pickerOptionText}>{CATEGORY_LABELS[cat]}</Text>
              </Pressable>
            ))}
            <Pressable
              onPress={() => setCategoryPickerFor(null)}
              accessibilityRole="button"
              accessibilityLabel="Cancel"
            >
              <Text style={styles.pickerCancel}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      )}

      <Pressable
        style={styles.fab}
        onPress={() => navigation.navigate("AddExpense")}
        accessibilityRole="button"
        accessibilityLabel="Add expense"
      >
        <Text style={styles.fabIcon}>＋</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  headerBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingRight: spacing.lg,
  },
  header: { padding: spacing.lg, paddingTop: Platform.OS === "ios" ? spacing.xl : spacing.lg },
  headerLabel: { color: colors.textSecondary, fontSize: 14 },
  headerActions: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  payButton: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  payButtonText: { color: colors.accent, fontWeight: "700", fontSize: 15 },
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceRaised,
    alignItems: "center",
    justifyContent: "center",
  },
  settingsIcon: { color: colors.textSecondary, fontSize: 18 },
  nudge: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.md,
    padding: spacing.md,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.sm,
  },
  nudgeText: { flex: 1 },
  nudgeTitle: { color: colors.textPrimary, fontSize: 15, fontWeight: "700" },
  nudgeSubtitle: { color: colors.textSecondary, fontSize: 13, marginTop: 2 },
  nudgeClose: { color: colors.textSecondary, fontSize: 16, paddingLeft: spacing.md },
  headerAmount: { color: colors.textPrimary, fontSize: 40, fontWeight: "700", marginTop: 4 },
  emptyState: { flex: 1, alignItems: "center", justifyContent: "center", padding: spacing.lg },
  emptyTitle: { color: colors.textPrimary, fontSize: 18, fontWeight: "600" },
  emptySubtitle: { color: colors.textSecondary, marginTop: spacing.xs, textAlign: "center" },
  list: { paddingHorizontal: spacing.lg, paddingBottom: 120 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  rowLeft: {},
  merchant: { color: colors.textPrimary, fontSize: 16, fontWeight: "600" },
  date: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
  rowRight: { alignItems: "flex-end" },
  amount: { color: colors.textPrimary, fontSize: 16, fontWeight: "600" },
  categoryChip: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    marginTop: 4,
  },
  categoryChipText: { color: colors.accent, fontSize: 12, fontWeight: "600" },
  fab: {
    position: "absolute",
    right: spacing.lg,
    bottom: spacing.lg,
    width: 60,
    height: 60,
    borderRadius: radius.pill,
    backgroundColor: colors.accent,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: colors.accent,
    shadowOpacity: 0.4,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  fabIcon: { fontSize: 28, color: colors.background, fontWeight: "700" },
  pickerOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    padding: spacing.lg,
  },
  pickerCard: { backgroundColor: colors.surfaceRaised, borderRadius: radius.lg, padding: spacing.lg },
  pickerTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: "700", marginBottom: spacing.sm },
  pickerOption: { paddingVertical: spacing.sm },
  pickerOptionText: { color: colors.textPrimary, fontSize: 15 },
  pickerCancel: { color: colors.textSecondary, marginTop: spacing.sm, textAlign: "center" },
});
