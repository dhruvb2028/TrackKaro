import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { colors, spacing, radius } from "../theme";
import { ALL_CATEGORIES, CATEGORY_LABELS } from "../domain/categoryLabels";
import { ExpenseCategory } from "../domain/models";
import { addExpense } from "../domain/addExpense";
import { getGuestUserId } from "../domain/identity";

type Props = NativeStackScreenProps<RootStackParamList, "ManualQuickAdd">;

export default function ManualQuickAddScreen({ navigation }: Props) {
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [category, setCategory] = useState<ExpenseCategory>("food");
  const [saving, setSaving] = useState(false);

  const canSave = Number(amount) > 0 && !saving;

  const handleSave = async () => {
    if (!canSave) return;
    setSaving(true);
    const userId = await getGuestUserId();
    await addExpense({
      userId,
      amount: Number(amount),
      category,
      note: note || null,
      source: "manual",
    });
    navigation.popTo("ExpenseList");
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Quick add</Text>

      <Text style={styles.label}>Amount</Text>
      <TextInput
        style={styles.amountInput}
        keyboardType="decimal-pad"
        placeholder="0"
        placeholderTextColor={colors.textSecondary}
        value={amount}
        onChangeText={setAmount}
        autoFocus
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
              style={[
                styles.categoryPillText,
                category === cat && styles.categoryPillTextActive,
              ]}
            >
              {CATEGORY_LABELS[cat]}
            </Text>
          </Pressable>
        ))}
      </View>

      <Text style={styles.label}>Note (optional)</Text>
      <TextInput
        style={styles.noteInput}
        placeholder="e.g. chai"
        placeholderTextColor={colors.textSecondary}
        value={note}
        onChangeText={setNote}
      />

      <Pressable
        style={[styles.saveButton, !canSave && styles.saveButtonDisabled]}
        onPress={handleSave}
        disabled={!canSave}
      >
        <Text style={styles.saveButtonText}>Save</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingTop: spacing.xl },
  title: { color: colors.textPrimary, fontSize: 22, fontWeight: "700", marginBottom: spacing.lg },
  label: { color: colors.textSecondary, fontSize: 13, marginBottom: spacing.xs, marginTop: spacing.md },
  amountInput: {
    color: colors.textPrimary,
    fontSize: 48,
    fontWeight: "700",
    borderBottomWidth: 2,
    borderBottomColor: colors.accent,
    paddingVertical: spacing.xs,
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
  noteInput: {
    color: colors.textPrimary,
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    padding: spacing.sm,
    fontSize: 15,
  },
  saveButton: {
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
    alignItems: "center",
    marginTop: spacing.xl,
  },
  saveButtonDisabled: { opacity: 0.4 },
  saveButtonText: { color: colors.background, fontSize: 16, fontWeight: "700" },
});
