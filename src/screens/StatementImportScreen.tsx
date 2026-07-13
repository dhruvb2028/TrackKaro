import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { colors, spacing, radius } from "../theme";
import { container } from "../adapters/container";
import { getActiveUserId } from "../domain/identity";
import { importStatement, ImportSummary, ReviewItem } from "../domain/statementImport";
import { addExpense } from "../domain/addExpense";
import { categorize } from "../domain/categorize";

type Props = NativeStackScreenProps<RootStackParamList, "StatementImport">;
type Stage = "idle" | "picking" | "parsing" | "summary";

interface PickedFile {
  uri: string;
  name: string;
  mimeType: string | null;
}

export default function StatementImportScreen({ navigation }: Props) {
  const [stage, setStage] = useState<Stage>("idle");
  const [error, setError] = useState<string | null>(null);
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [reviewQueue, setReviewQueue] = useState<ReviewItem[]>([]);

  const pickFile = async () => {
    setError(null);
    setStage("picking");
    const result = await DocumentPicker.getDocumentAsync({
      // PDF deliberately excluded — RealStatementParser doesn't support it
      // yet (see its doc comment), so don't invite a pick that can only fail.
      type: ["text/csv", "text/comma-separated-values",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"],
      copyToCacheDirectory: true,
    });
    if (result.canceled || !result.assets[0]) {
      setStage("idle");
      return;
    }
    const asset = result.assets[0];
    await runParse({
      uri: asset.uri,
      name: asset.name,
      mimeType: asset.mimeType ?? null,
    });
  };

  const runParse = async (picked: PickedFile) => {
    setStage("parsing");
    setError(null);
    const parseResult = await container.statementParser.parse(picked.uri, picked.mimeType, picked.name);

    // No adapter currently returns "password_required" (real PDF parsing
    // isn't implemented — see RealStatementParser), but the port allows for
    // one that does; treat it the same as "unsupported" rather than getting
    // stuck with no way forward for the user.
    if (parseResult.status === "unsupported" || parseResult.status === "password_required") {
      setError(
        parseResult.status === "unsupported"
          ? parseResult.reason
          : "This file needs a password we can't ask for yet — try a CSV or Excel export instead."
      );
      setStage("idle");
      return;
    }

    const userId = await getActiveUserId();
    const result = await importStatement(userId, parseResult.transactions);
    setSummary(result);
    setReviewQueue(result.needsReview);
    setStage("summary");
  };

  const resolveReview = async (item: ReviewItem, keep: boolean) => {
    if (keep) {
      const userId = await getActiveUserId();
      const { category } = await categorize(
        userId,
        item.merchantSignal,
        container.categoryOverrideRepository
      );
      await addExpense({
        userId,
        amount: item.transaction.amount,
        merchant: item.merchantSignal,
        category: item.reason === "needs_category" ? "family_transfer" : category,
        date: item.transaction.date,
        source: "statement",
      });
    }
    setReviewQueue((q) => q.filter((r) => r !== item));
  };

  if (stage === "parsing" || stage === "picking") {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.accent} />
        <Text style={styles.processingText}>
          {stage === "picking" ? "Opening files…" : "Reading your statement…"}
        </Text>
      </View>
    );
  }

  if (stage === "summary" && summary) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Statement imported</Text>
        <Text style={styles.summaryLine}>
          {summary.added} added
          {summary.skippedDuplicates > 0
            ? ` · ${summary.skippedDuplicates} duplicate${summary.skippedDuplicates > 1 ? "s" : ""} skipped`
            : ""}
        </Text>

        {reviewQueue.length > 0 ? (
          <>
            <Text style={styles.reviewHeader}>
              {reviewQueue.length} need a quick look
            </Text>
            {reviewQueue.map((item, i) => (
              <View key={i} style={styles.reviewCard}>
                <Text style={styles.reviewNarration} numberOfLines={1}>
                  {item.merchantSignal ?? item.transaction.narration}
                </Text>
                <Text style={styles.reviewMeta}>
                  ₹{item.transaction.amount.toFixed(0)} · {item.transaction.date} ·{" "}
                  {item.reason === "possible_duplicate" ? "Possible duplicate" : "Transfer"}
                </Text>
                <View style={styles.reviewActions}>
                  <Pressable style={styles.skipButton} onPress={() => resolveReview(item, false)}>
                    <Text style={styles.skipButtonText}>Skip</Text>
                  </Pressable>
                  <Pressable style={styles.keepButton} onPress={() => resolveReview(item, true)}>
                    <Text style={styles.keepButtonText}>Add</Text>
                  </Pressable>
                </View>
              </View>
            ))}
          </>
        ) : (
          <Text style={styles.allDone}>All set — nothing left to review.</Text>
        )}

        <Pressable style={styles.primaryButton} onPress={() => navigation.popTo("ExpenseList")}>
          <Text style={styles.primaryButtonText}>Done</Text>
        </Pressable>
      </ScrollView>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Upload a statement</Text>
      <Text style={styles.subtitle}>
        CSV or Excel from your bank or UPI app. We'll add the transactions for you.
      </Text>
      {error && <Text style={styles.error}>{error}</Text>}
      <Pressable style={styles.primaryButton} onPress={pickFile}>
        <Text style={styles.primaryButtonText}>Choose file</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.lg, paddingTop: spacing.xl },
  content: { padding: spacing.lg, paddingTop: spacing.xl },
  centered: { flex: 1, backgroundColor: colors.background, alignItems: "center", justifyContent: "center" },
  processingText: { color: colors.textSecondary, marginTop: spacing.md },
  title: { color: colors.textPrimary, fontSize: 22, fontWeight: "700", marginBottom: spacing.sm },
  subtitle: { color: colors.textSecondary, fontSize: 14, marginBottom: spacing.lg },
  error: { color: colors.danger, marginBottom: spacing.md },
  summaryLine: { color: colors.textSecondary, fontSize: 15, marginBottom: spacing.lg },
  reviewHeader: { color: colors.textPrimary, fontSize: 16, fontWeight: "600", marginBottom: spacing.sm },
  reviewCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  reviewNarration: { color: colors.textPrimary, fontSize: 15, fontWeight: "600" },
  reviewMeta: { color: colors.textSecondary, fontSize: 13, marginTop: 2 },
  reviewActions: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.sm },
  skipButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingVertical: spacing.sm,
    alignItems: "center",
  },
  skipButtonText: { color: colors.textSecondary, fontWeight: "600" },
  keepButton: {
    flex: 1,
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    paddingVertical: spacing.sm,
    alignItems: "center",
  },
  keepButtonText: { color: colors.background, fontWeight: "700" },
  allDone: { color: colors.textSecondary, marginBottom: spacing.lg },
  primaryButton: {
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
    alignItems: "center",
    marginTop: spacing.md,
  },
  buttonDisabled: { opacity: 0.4 },
  primaryButtonText: { color: colors.background, fontSize: 16, fontWeight: "700" },
});
