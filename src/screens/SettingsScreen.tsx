import React, { useCallback, useState } from "react";
import { View, Text, Pressable, StyleSheet, ActivityIndicator } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { colors, spacing, radius } from "../theme";
import { getGuestUserId } from "../domain/identity";
import { exportUserData } from "../domain/exportData";
import { prefs } from "../domain/prefs";

type Props = NativeStackScreenProps<RootStackParamList, "Settings">;

export default function SettingsScreen({ navigation }: Props) {
  const [exporting, setExporting] = useState(false);
  const [signedUp, setSignedUp] = useState(false);

  useFocusEffect(
    useCallback(() => {
      prefs.isSignedUp().then(setSignedUp);
    }, [])
  );

  const handleExport = async () => {
    setExporting(true);
    try {
      const uid = await getGuestUserId();
      await exportUserData(uid);
    } finally {
      setExporting(false);
    }
  };

  return (
    <View style={styles.container}>
      {!signedUp && (
        <Pressable style={styles.card} onPress={() => navigation.navigate("SignUp")}>
          <Text style={styles.cardTitle}>Back up your data</Text>
          <Text style={styles.cardSubtitle}>
            Sign up with your phone number to keep your data safe.
          </Text>
        </Pressable>
      )}

      <Pressable style={styles.card} onPress={handleExport} disabled={exporting}>
        <View style={styles.cardRow}>
          <View style={styles.cardTextGroup}>
            <Text style={styles.cardTitle}>Export my data</Text>
            <Text style={styles.cardSubtitle}>
              Save all your expenses to a file you control.
            </Text>
          </View>
          {exporting && <ActivityIndicator color={colors.accent} />}
        </View>
      </Pressable>

      {signedUp && <Text style={styles.signedUpNote}>You're signed up — data is backed up.</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.lg },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  cardRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  cardTextGroup: { flex: 1 },
  cardTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: "600" },
  cardSubtitle: { color: colors.textSecondary, fontSize: 13, marginTop: 2 },
  signedUpNote: { color: colors.accent, fontSize: 13, marginTop: spacing.md },
});
