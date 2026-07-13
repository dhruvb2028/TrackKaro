import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { colors, spacing, radius } from "../theme";
import { container } from "../adapters/container";
import { getActiveUserId } from "../domain/identity";
import { Expense, ExpenseCategory } from "../domain/models";
import { ALL_CATEGORIES, CATEGORY_LABELS } from "../domain/categoryLabels";
import { updateExpense, deleteExpense } from "../domain/addExpense";

type Props = NativeStackScreenProps<RootStackParamList, "ExpenseDetail">;

export default function ExpenseDetailScreen({ route, navigation }: Props) {
  const { expenseId } = route.params;
  const [expense, setExpense] = useState<Expense | null>(null);
  const [amount, setAmount] = useState("");
  const [merchant, setMerchant] = useState("");
  const [note, setNote] = useState("");
  const [category, setCategory] = useState<ExpenseCategory>("other");
  const [date, setDate] = useState("");

  useEffect(() => {
    (async () => {
      const uid = await getActiveUserId();
      const e = await container.expenseRepository.getById(expenseId, uid);
      if (!e) {
        navigation.goBack();
        return;
      }
      setExpense(e);
      setAmount(String(e.amount));
      setMerchant(e.merchant ?? "");
      setNote(e.note ?? "");
      setCategory(e.category);
      setDate(e.date);
    })();
  }, [expenseId]);

  const handleSave = async () => {
    if (!expense || Number(amount) <= 0) return;
    await updateExpense(expense, {
      amount: Number(amount),
      merchant: merchant || null,
      category,
      note: note || null,
      date,
    });
    navigation.goBack();
  };

  const handleDelete = () => {
    const doDelete = async () => {
      if (!expense) return;
      await deleteExpense(expense);
      navigation.goBack();
    };
    if (Platform.OS === "web") {
      doDelete();
      return;
    }
    Alert.alert("Delete expense?", "This can't be undone.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: doDelete },
    ]);
  };

  if (!expense) {
    return <View style={styles.container} />;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.label}>Amount</Text>
      <TextInput
        style={styles.amountInput}
        keyboardType="decimal-pad"
        value={amount}
        onChangeText={setAmount}
      />

      <Text style={styles.label}>Merchant</Text>
      <TextInput
        style={styles.textInput}
        placeholder="Merchant"
        placeholderTextColor={colors.textSecondary}
        value={merchant}
        onChangeText={setMerchant}
      />

      <Text style={styles.label}>Category</Text>
      <View style={styles.categoryGrid}>
        {ALL_CATEGORIES.map((cat) => (
          <Pressable
            key={cat}
            onPress={() => setCategory(cat)}
            style={[styles.categoryPill, category === cat && styles.categoryPillActive]}
          >
            <Text
              style={[styles.categoryPillText, category === cat && styles.categoryPillTextActive]}
            >
              {CATEGORY_LABELS[cat]}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>Date</Text>
      <TextInput
        style={styles.textInput}
        placeholder="YYYY-MM-DD"
        placeholderTextColor={colors.textSecondary}
        value={date}
        onChangeText={setDate}
      />

      <Text style={styles.label}>Note</Text>
      <TextInput
        style={styles.textInput}
        placeholder="Note"
        placeholderTextColor={colors.textSecondary}
        value={note}
        onChangeText={setNote}
      />

      <Pressable
        style={[styles.saveButton, Number(amount) <= 0 && styles.buttonDisabled]}
        onPress={handleSave}
        disabled={Number(amount) <= 0}
      >
        <Text style={styles.saveButtonText}>Save changes</Text>
      </Pressable>

      <Pressable style={styles.deleteButton} onPress={handleDelete}>
        <Text style={styles.deleteButtonText}>Delete expense</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg },
  label: { color: colors.textSecondary, fontSize: 13, marginBottom: spacing.xs, marginTop: spacing.md },
  amountInput: {
    color: colors.textPrimary,
    fontSize: 40,
    fontWeight: "700",
    borderBottomWidth: 2,
    borderBottomColor: colors.accent,
    paddingVertical: spacing.xs,
  },
  textInput: {
    color: colors.textPrimary,
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    padding: spacing.sm,
    fontSize: 15,
  },
  categoryGrid: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  categoryPill: {
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  categoryPillActive: { backgroundColor: colors.accent, borderColor: colors.accent },
  categoryPillText: { color: colors.textSecondary, fontSize: 13 },
  categoryPillTextActive: { color: colors.background, fontWeight: "700" },
  saveButton: {
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
    alignItems: "center",
    marginTop: spacing.xl,
  },
  buttonDisabled: { opacity: 0.4 },
  saveButtonText: { color: colors.background, fontSize: 16, fontWeight: "700" },
  deleteButton: { paddingVertical: spacing.md, alignItems: "center", marginTop: spacing.sm },
  deleteButtonText: { color: colors.danger, fontSize: 15, fontWeight: "600" },
});
