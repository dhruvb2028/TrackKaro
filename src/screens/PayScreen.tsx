import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  Linking,
  AppState,
  AppStateStatus,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import * as Crypto from "expo-crypto";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { colors, spacing, radius } from "../theme";
import { container } from "../adapters/container";
import { getGuestUserId } from "../domain/identity";
import { buildUpiUri, isValidVpa } from "../domain/upi";
import { addExpense } from "../domain/addExpense";
import { categorize } from "../domain/categorize";
import { Payee } from "../domain/models";

type Props = NativeStackScreenProps<RootStackParamList, "Pay">;

interface PendingPayment {
  vpa: string;
  payeeName: string;
  amount: number;
  note: string | null;
}

export default function PayScreen({ navigation }: Props) {
  const [vpa, setVpa] = useState("");
  const [payeeName, setPayeeName] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [payees, setPayees] = useState<Payee[]>([]);
  const [pending, setPending] = useState<PendingPayment | null>(null);
  const [showNudge, setShowNudge] = useState(false);
  const launchedRef = useRef(false);

  const loadPayees = useCallback(async () => {
    const uid = await getGuestUserId();
    setPayees(await container.payeeRepository.listForUser(uid));
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadPayees();
    }, [loadPayees])
  );

  // When the app returns to the foreground after a payment was launched,
  // surface the dismissible "mark as paid?" nudge (PRD §8.8).
  useEffect(() => {
    const sub = AppState.addEventListener("change", (state: AppStateStatus) => {
      if (state === "active" && launchedRef.current && pending) {
        launchedRef.current = false;
        setShowNudge(true);
      }
    });
    return () => sub.remove();
  }, [pending]);

  const canPay = isValidVpa(vpa) && payeeName.trim().length > 0 && Number(amount) > 0;

  const handlePay = async () => {
    if (!canPay) return;
    const req: PendingPayment = {
      vpa: vpa.trim(),
      payeeName: payeeName.trim(),
      amount: Number(amount),
      note: note || null,
    };

    const uid = await getGuestUserId();
    const existing = await container.payeeRepository.getByVpa(uid, req.vpa);
    const payee: Payee = existing ?? {
      id: await newId(),
      userId: uid,
      vpa: req.vpa,
      displayName: req.payeeName,
      lastUsedCategory: null,
    };
    await container.payeeRepository.save({ ...payee, displayName: req.payeeName });

    setPending(req);
    launchedRef.current = true;
    const uri = buildUpiUri(req);
    Linking.openURL(uri).catch(() => {
      // No UPI app installed / not supported on this platform.
      launchedRef.current = false;
      setShowNudge(true);
    });
  };

  const confirmPaid = async () => {
    if (!pending) return;
    const uid = await getGuestUserId();
    const { category } = await categorize(
      uid,
      pending.payeeName,
      container.categoryOverrideRepository
    );
    await addExpense({
      userId: uid,
      amount: pending.amount,
      merchant: pending.payeeName,
      category,
      note: pending.note,
      source: "upi",
    });
    setShowNudge(false);
    setPending(null);
    navigation.popTo("ExpenseList");
  };

  const dismissNudge = () => {
    setShowNudge(false);
    setPending(null);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Pay via UPI</Text>

      {payees.length > 0 && (
        <>
          <Text style={styles.label}>Recent payees</Text>
          <View style={styles.payeeRow}>
            {payees.map((p) => (
              <Pressable
                key={p.id}
                style={styles.payeeChip}
                onPress={() => {
                  setVpa(p.vpa);
                  setPayeeName(p.displayName);
                }}
              >
                <Text style={styles.payeeChipText}>{p.displayName}</Text>
              </Pressable>
            ))}
          </View>
        </>
      )}

      <Text style={styles.label}>Pay to (UPI ID)</Text>
      <TextInput
        style={styles.textInput}
        placeholder="name@bank"
        placeholderTextColor={colors.textSecondary}
        autoCapitalize="none"
        value={vpa}
        onChangeText={setVpa}
      />
      {vpa.length > 0 && !isValidVpa(vpa) && (
        <Text style={styles.hint}>Enter a valid UPI ID, e.g. name@okhdfc</Text>
      )}

      <Text style={styles.label}>Payee name</Text>
      <TextInput
        style={styles.textInput}
        placeholder="e.g. Rahul"
        placeholderTextColor={colors.textSecondary}
        value={payeeName}
        onChangeText={setPayeeName}
      />

      <Text style={styles.label}>Amount</Text>
      <TextInput
        style={styles.amountInput}
        keyboardType="decimal-pad"
        placeholder="0"
        placeholderTextColor={colors.textSecondary}
        value={amount}
        onChangeText={setAmount}
      />

      <Text style={styles.label}>Note (optional)</Text>
      <TextInput
        style={styles.textInput}
        placeholder="e.g. dinner"
        placeholderTextColor={colors.textSecondary}
        value={note}
        onChangeText={setNote}
      />

      <Pressable
        style={[styles.payButton, !canPay && styles.buttonDisabled]}
        onPress={handlePay}
        disabled={!canPay}
      >
        <Text style={styles.payButtonText}>Pay ₹{Number(amount) > 0 ? Number(amount).toFixed(0) : "0"}</Text>
      </Pressable>

      {showNudge && pending && (
        <View style={styles.nudgeOverlay}>
          <View style={styles.nudgeCard}>
            <Text style={styles.nudgeTitle}>
              Mark ₹{pending.amount.toFixed(0)} to {pending.payeeName} as paid?
            </Text>
            <Text style={styles.nudgeSubtitle}>
              Only if the payment went through. You can skip this.
            </Text>
            <View style={styles.nudgeActions}>
              <Pressable style={styles.nudgeSkip} onPress={dismissNudge}>
                <Text style={styles.nudgeSkipText}>Not now</Text>
              </Pressable>
              <Pressable style={styles.nudgeConfirm} onPress={confirmPaid}>
                <Text style={styles.nudgeConfirmText}>Yes, log it</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}
    </ScrollView>
  );
}

async function newId(): Promise<string> {
  const bytes = await Crypto.getRandomBytesAsync(16);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingTop: spacing.xl },
  title: { color: colors.textPrimary, fontSize: 22, fontWeight: "700", marginBottom: spacing.md },
  label: { color: colors.textSecondary, fontSize: 13, marginBottom: spacing.xs, marginTop: spacing.md },
  textInput: {
    color: colors.textPrimary,
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    padding: spacing.sm,
    fontSize: 15,
  },
  amountInput: {
    color: colors.textPrimary,
    fontSize: 40,
    fontWeight: "700",
    borderBottomWidth: 2,
    borderBottomColor: colors.accent,
    paddingVertical: spacing.xs,
  },
  hint: { color: colors.danger, fontSize: 12, marginTop: spacing.xs },
  payeeRow: { flexDirection: "row", flexWrap: "wrap", gap: spacing.xs },
  payeeChip: {
    backgroundColor: colors.surfaceRaised,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  payeeChipText: { color: colors.accent, fontSize: 13, fontWeight: "600" },
  payButton: {
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
    alignItems: "center",
    marginTop: spacing.xl,
  },
  buttonDisabled: { opacity: 0.4 },
  payButtonText: { color: colors.background, fontSize: 16, fontWeight: "700" },
  nudgeOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
    padding: spacing.lg,
  },
  nudgeCard: { backgroundColor: colors.surfaceRaised, borderRadius: radius.lg, padding: spacing.lg },
  nudgeTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: "700" },
  nudgeSubtitle: { color: colors.textSecondary, fontSize: 13, marginTop: spacing.xs },
  nudgeActions: { flexDirection: "row", gap: spacing.sm, marginTop: spacing.md },
  nudgeSkip: {
    flex: 1,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingVertical: spacing.sm,
    alignItems: "center",
  },
  nudgeSkipText: { color: colors.textSecondary, fontWeight: "600" },
  nudgeConfirm: {
    flex: 1,
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    paddingVertical: spacing.sm,
    alignItems: "center",
  },
  nudgeConfirmText: { color: colors.background, fontWeight: "700" },
});
