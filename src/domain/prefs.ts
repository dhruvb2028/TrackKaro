import AsyncStorage from "@react-native-async-storage/async-storage";

const KEYS = {
  signupNudgeDismissed: "trackkaro_signup_nudge_dismissed",
  signedUp: "trackkaro_signed_up",
} as const;

async function getFlag(key: string): Promise<boolean> {
  return (await AsyncStorage.getItem(key)) === "1";
}

async function setFlag(key: string, value: boolean): Promise<void> {
  await AsyncStorage.setItem(key, value ? "1" : "0");
}

export const prefs = {
  isSignupNudgeDismissed: () => getFlag(KEYS.signupNudgeDismissed),
  dismissSignupNudge: () => setFlag(KEYS.signupNudgeDismissed, true),
  isSignedUp: () => getFlag(KEYS.signedUp),
  setSignedUp: () => setFlag(KEYS.signedUp, true),
};
