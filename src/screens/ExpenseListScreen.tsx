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
import { getGuestUserId } from "../domain/identity";
import { CATEGORY_LABELS, ALL_CATEGORIES } from "../domain/categoryLabels";
import { setExpenseCategory } from "../domain/addExpense";
import { colors, spacing, radius } from "../theme";
import type { RootStackParamList } from "../navigation/RootNavigator";

type Props = NativeStackScreenProps<RootStackParamList, "ExpenseList">;

export default function ExpenseListScreen({ navigation }: Props) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [categoryPickerFor, setCategoryPickerFor] = useState<Expense | null>(null);

  const load = useCallback(async () => {
    const uid = await getGuestUserId();
    setUserId(uid);
    const list = await container.expenseRepository.listForUser(uid);
    setExpenses(list);
  }, []);

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
      <View style={styles.header}>
        <Text style={styles.headerLabel}>This month</Text>
        <Text style={styles.headerAmount}>₹{monthTotal.toFixed(0)}</Text>
      </View>

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
              <View style={styles.rowLeft}>
                <Text style={styles.merchant}>{item.merchant ?? "Expense"}</Text>
                <Text style={styles.date}>{item.date}</Text>
              </View>
              <View style={styles.rowRight}>
                <Text style={styles.amount}>₹{item.amount.toFixed(0)}</Text>
                <Pressable
                  onPress={() => setCategoryPickerFor(item)}
                  style={styles.categoryChip}
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
        <View style={styles.pickerOverlay}>
          <View style={styles.pickerCard}>
            <Text style={styles.pickerTitle}>Set category</Text>
            {ALL_CATEGORIES.map((cat) => (
              <Pressable
                key={cat}
                style={styles.pickerOption}
                onPress={() => handlePickCategory(cat)}
              >
                <Text style={styles.pickerOptionText}>{CATEGORY_LABELS[cat]}</Text>
              </Pressable>
            ))}
            <Pressable onPress={() => setCategoryPickerFor(null)}>
              <Text style={styles.pickerCancel}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      )}

      <Pressable
        style={styles.fab}
        onPress={() => navigation.navigate("AddExpense")}
      >
        <Text style={styles.fabIcon}>＋</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: { padding: spacing.lg, paddingTop: Platform.OS === "ios" ? spacing.xl : spacing.lg },
  headerLabel: { color: colors.textSecondary, fontSize: 14 },
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
