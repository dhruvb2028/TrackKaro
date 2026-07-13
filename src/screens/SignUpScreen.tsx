import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { colors, spacing, radius } from "../theme";
import { container } from "../adapters/container";
import { isSupabaseConfigured } from "../adapters/real/supabaseClient";
import { prefs } from "../domain/prefs";
import { getGuestUserId } from "../domain/identity";
import { migrateGuestData } from "../domain/migrateGuestData";

type Props = NativeStackScreenProps<RootStackParamList, "SignUp">;
type Stage = "phone" | "otp" | "working";

export default function SignUpScreen({ navigation }: Props) {
  const [stage, setStage] = useState<Stage>("phone");
  const [phone, setPhone] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  const sendOtp = async () => {
    setError(null);
    setStage("working");
    try {
      await container.authProvider.sendOtp(phone.trim());
      setStage("otp");
    } catch (e: any) {
      setError(e?.message ?? "Couldn't send the code.");
      setStage("phone");
    }
  };

  const verify = async () => {
    setError(null);
    setStage("working");
    try {
      const guestUserId = await getGuestUserId();
      const session = await container.authProvider.verifyOtp(phone.trim(), code.trim());
      // Only a real backend has a distinct account to migrate into — with
      // the mock provider, "signed up" is still the same local storage
      // under the same guest id, so there's nothing to move.
      if (isSupabaseConfigured()) {
        await migrateGuestData(guestUserId, session.userId);
      }
      await prefs.setSignedUp();
      navigation.goBack();
    } catch (e: any) {
      setError(e?.message ?? "That code didn't work.");
      setStage("otp");
    }
  };

  if (stage === "working") {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Back up your data</Text>
      <Text style={styles.subtitle}>
        Sign up so your expenses are safe and available on any device.
      </Text>

      {stage === "phone" ? (
        <>
          <Text style={styles.label}>Phone number</Text>
          <TextInput
            style={styles.input}
            keyboardType="phone-pad"
            placeholder="9876543210"
            placeholderTextColor={colors.textSecondary}
            value={phone}
            onChangeText={setPhone}
            autoFocus
          />
          {error && <Text style={styles.error}>{error}</Text>}
          <Pressable
            style={[styles.button, phone.trim().length < 10 && styles.buttonDisabled]}
            disabled={phone.trim().length < 10}
            onPress={sendOtp}
          >
            <Text style={styles.buttonText}>Send code</Text>
          </Pressable>
        </>
      ) : (
        <>
          <Text style={styles.label}>Enter the 6-digit code</Text>
          <TextInput
            style={styles.input}
            keyboardType="number-pad"
            placeholder="000000"
            placeholderTextColor={colors.textSecondary}
            value={code}
            onChangeText={setCode}
            autoFocus
          />
          {error && <Text style={styles.error}>{error}</Text>}
          <Pressable
            style={[styles.button, code.trim().length < 6 && styles.buttonDisabled]}
            disabled={code.trim().length < 6}
            onPress={verify}
          >
            <Text style={styles.buttonText}>Verify</Text>
          </Pressable>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.lg, paddingTop: spacing.xl },
  centered: { flex: 1, backgroundColor: colors.background, alignItems: "center", justifyContent: "center" },
  title: { color: colors.textPrimary, fontSize: 22, fontWeight: "700" },
  subtitle: { color: colors.textSecondary, fontSize: 14, marginTop: spacing.xs, marginBottom: spacing.lg },
  label: { color: colors.textSecondary, fontSize: 13, marginBottom: spacing.xs, marginTop: spacing.md },
  input: {
    color: colors.textPrimary,
    backgroundColor: colors.surface,
    borderRadius: radius.sm,
    padding: spacing.md,
    fontSize: 18,
  },
  error: { color: colors.danger, marginTop: spacing.sm },
  button: {
    backgroundColor: colors.accent,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
    alignItems: "center",
    marginTop: spacing.lg,
  },
  buttonDisabled: { opacity: 0.4 },
  buttonText: { color: colors.background, fontSize: 16, fontWeight: "700" },
});
