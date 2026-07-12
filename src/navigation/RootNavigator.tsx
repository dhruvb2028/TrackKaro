import React from "react";
import { NavigationContainer, DarkTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import ExpenseListScreen from "../screens/ExpenseListScreen";
import AddExpenseScreen from "../screens/AddExpenseScreen";
import PhotoCaptureScreen from "../screens/PhotoCaptureScreen";
import ManualQuickAddScreen from "../screens/ManualQuickAddScreen";
import { colors } from "../theme";

export type RootStackParamList = {
  ExpenseList: undefined;
  AddExpense: undefined;
  PhotoCapture: undefined;
  ManualQuickAdd: undefined;
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
      </Stack.Navigator>
    </NavigationContainer>
  );
}
