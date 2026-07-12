import React from "react";
import { NavigationContainer, DarkTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import ExpenseListScreen from "../screens/ExpenseListScreen";
import AddExpenseScreen from "../screens/AddExpenseScreen";
import PhotoCaptureScreen from "../screens/PhotoCaptureScreen";
import ManualQuickAddScreen from "../screens/ManualQuickAddScreen";
import SpendSummaryScreen from "../screens/SpendSummaryScreen";
import StatementImportScreen from "../screens/StatementImportScreen";
import ExpenseDetailScreen from "../screens/ExpenseDetailScreen";
import PayScreen from "../screens/PayScreen";
import { colors } from "../theme";

export type RootStackParamList = {
  ExpenseList: undefined;
  AddExpense: undefined;
  PhotoCapture: undefined;
  ManualQuickAdd: undefined;
  SpendSummary: undefined;
  StatementImport: undefined;
  ExpenseDetail: { expenseId: string };
  Pay: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const navTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.background,
    card: colors.surface,
    text: colors.textPrimary,
    border: colors.border,
    primary: colors.accent,
  },
};

export default function RootNavigator() {
  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="ExpenseList" component={ExpenseListScreen} />
        <Stack.Screen
          name="SpendSummary"
          component={SpendSummaryScreen}
          options={{
            headerShown: true,
            title: "Spending",
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.textPrimary,
          }}
        />
        <Stack.Screen
          name="AddExpense"
          component={AddExpenseScreen}
          options={{ presentation: "modal" }}
        />
        <Stack.Screen
          name="PhotoCapture"
          component={PhotoCaptureScreen}
          options={{ presentation: "modal" }}
        />
        <Stack.Screen
          name="ManualQuickAdd"
          component={ManualQuickAddScreen}
          options={{ presentation: "modal" }}
        />
        <Stack.Screen
          name="StatementImport"
          component={StatementImportScreen}
          options={{ presentation: "modal" }}
        />
        <Stack.Screen
          name="ExpenseDetail"
          component={ExpenseDetailScreen}
          options={{
            headerShown: true,
            title: "Edit expense",
            headerStyle: { backgroundColor: colors.background },
            headerTintColor: colors.textPrimary,
          }}
        />
        <Stack.Screen
          name="Pay"
          component={PayScreen}
          options={{ presentation: "modal" }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
