import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/RootNavigator";
import { colors, spacing, radius } from "../theme";

type Props = NativeStackScreenProps<RootStackParamList, "AddExpense">;

export default function AddExpenseScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Add an expense</Text>

      <Pressable
        style={styles.option}
        onPress={() => navigation.navigate("PhotoCapture")}
      >
        <Text style={styles.optionIcon}>📷</Text>
        <View>
          <Text style={styles.optionTitle}>Snap a bill</Text>
          <Text style={styles.optionSubtitle}>We'll read the details for you</Text>
        </View>
      </Pressable>

      <Pressable
        style={styles.option}
        onPress={() => navigation.navigate("ManualQuickAdd")}
      >
        <Text style={styles.optionIcon}>✏️</Text>
        <View>
          <Text style={styles.optionTitle}>Quick add</Text>
          <Text style={styles.optionSubtitle}>Just an amount and category</Text>
        </View>
      </Pressable>

      <Pressable
        style={styles.option}
        onPress={() => navigation.navigate("StatementImport")}
      >
        <Text style={styles.optionIcon}>📄</Text>
        <View>
          <Text style={styles.optionTitle}>Upload statement</Text>
          <Text style={styles.optionSubtitle}>Import from a bank or UPI statement</Text>
        </View>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background, padding: spacing.lg, paddingTop: spacing.xl },
  title: { color: colors.textPrimary, fontSize: 22, fontWeight: "700", marginBottom: spacing.lg },
  option: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  optionIcon: { fontSize: 28 },
  optionTitle: { color: colors.textPrimary, fontSize: 16, fontWeight: "600" },
  optionSubtitle: { color: colors.textSecondary, fontSize: 13, marginTop: 2 },
});
