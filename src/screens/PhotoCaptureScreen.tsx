import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  Image,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { colors, spacing, radius } from "../theme";
import { container } from "../adapters/container";
import { getDeviceId, getActiveUserId } from "../domain/identity";
import { addExpense } from "../domain/addExpense";
import { ALL_CATEGORIES, CATEGORY_LABELS } from "../domain/categoryLabels";
import { ExpenseCategory } from "../domain/models";

type Props = NativeStackScreenProps<RootStackParamList, "PhotoCapture">;
type Stage = "capturing" | "processing" | "review" | "saving";

export default function PhotoCaptureScreen({ navigation }: Props) {
  const [stage, setStage] = useState<Stage>("capturing");
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [amount, setAmount] = useState("");
  const [merchant, setMerchant] = useState("");
  const [category, setCategory] = useState<ExpenseCategory>("other");
  const [rateLimited, setRateLimited] = useState(false);

  useEffect(() => {
    capture();
  }, []);

  const capture = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      navigation.goBack();
      return;
    }
    const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
    if (result.canceled || !result.assets[0]) {
      navigation.goBack();
      return;
    }
    const uri = result.assets[0].uri;
    setImageUri(uri);
    setStage("processing");
    await extract(uri);
  };

  const extract = async (uri: string) => {
    const deviceId = await getDeviceId();
    const allowed = await container.rateLimiter.tryConsume(deviceId, "ai_extract");
    if (!allowed) {
      setRateLimited(true);
      setStage("review");
      return;
    }
    const fields = await container.aiExtractor.extractFromImage(uri);
    if (fields.amount) setAmount(String(fields.amount));
    if (fields.merchant) setMerchant(fields.merchant);
    setStage("review");
  };

  const handleSave = async () => {
    if (Number(amount) <= 0) return;
    setStage("saving");
    const userId = await getActiveUserId();
    // Storage RLS requires the first path segment to be auth.uid() (see the
    // migration's receipts_owner_all policy) — this key format is required
    // for signed-in uploads to succeed, not just a naming convention.
    const key = `${userId}/${Date.now()}.jpg`;
    const storedUri = imageUri ? await container.fileStorage.upload(imageUri, key) : null;
    await addExpense({
      userId,
      amount: Number(amount),
      merchant: merchant || null,
      category,
      source: "photo",
      receiptImageUri: storedUri,
    });
    navigation.popTo("ExpenseList");
  };

  if (stage === "capturing") {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (stage === "processing") {
    return (
      <View style={styles.centered}>
        {imageUri && <Image source={{ uri: imageUri }} style={styles.thumbnail} />}
        <ActivityIndicator color={colors.accent} style={{ marginTop: spacing.md }} />
        <Text style={styles.processingText}>Reading your receipt…</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {imageUri && <Image source={{ uri: imageUri }} style={styles.thumbnail} />}

      {rateLimited && (
        <Text style={styles.rateLimitNotice} accessibilityRole="alert">
          We couldn't auto-read this one right now — fill it in below.
        </Text>
      )}

      <Text style={styles.label}>Amount</Text>
      <TextInput
        style={styles.amountInput}
        keyboardType="decimal-pad"
        placeholder="0"
        placeholderTextColor={colors.textSecondary}
        value={amount}
        onChangeText={setAmount}
        accessibilityLabel="Amount in rupees"
      />

      <Text style={styles.label}>Merchant (optional)</Text>
      <TextInput
        style={styles.textInput}
        placeholder="e.g. Swiggy"
        placeholderTextColor={colors.textSecondary}
        value={merchant}
        onChangeText={setMerchant}
        accessibilityLabel="Merchant"
      />

      <Text style={styles.label}>Category</Text>
      <View style={styles.categoryGrid}>
        {ALL_CATEGORIES.map((cat) => (
          <Pressable
            key={cat}
            onPress={() => setCategory(cat)}
            style={[styles.categoryPill, category === cat && styles.categoryPillActive]}
            accessibilityRole="button"
            accessibilityState={{ selected: category === cat }}
            accessibilityLabel={`Category: ${CATEGORY_LABELS[cat]}`}
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

      <Pressable
        style={[styles.saveButton, (Number(amount) <= 0 || stage === "saving") && styles.saveButtonDisabled]}
        onPress={handleSave}
        disabled={Number(amount) <= 0 || stage === "saving"}
        accessibilityRole="button"
        accessibilityLabel={stage === "saving" ? "Saving expense" : "Confirm expense"}
        accessibilityState={{ disabled: Number(amount) <= 0 || stage === "saving", busy: stage === "saving" }}
      >
        <Text style={styles.saveButtonText}>{stage === "saving" ? "Saving…" : "Confirm"}</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  centered: { flex: 1, backgroundColor: colors.background, alignItems: "center", justifyContent: "center" },
  content: { padding: spacing.lg, paddingTop: spacing.xl },
  thumbnail: { width: "100%", height: 200, borderRadius: radius.md, marginBottom: spacing.md },
  processingText: { color: colors.textSecondary, marginTop: spacing.sm },
  rateLimitNotice: {
    color: colors.textSecondary,
    backgroundColor: colors.surface,
    padding: spacing.sm,
    borderRadius: radius.sm,
    marginBottom: spacing.md,
  },
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
  saveButtonDisabled: { opacity: 0.4 },
  saveButtonText: { color: colors.background, fontSize: 16, fontWeight: "700" },
});
