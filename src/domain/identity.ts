import * as SecureStore from "expo-secure-store";
import * as Crypto from "expo-crypto";

const DEVICE_ID_KEY = "trackkaro_device_id";
const GUEST_USER_ID_KEY = "trackkaro_guest_user_id";

async function getOrCreate(key: string): Promise<string> {
  const existing = await SecureStore.getItemAsync(key);
  if (existing) return existing;
  const bytes = await Crypto.getRandomBytesAsync(16);
  const id = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  await SecureStore.setItemAsync(key, id);
  return id;
}

/** Stable per-device identity used to rate-limit guests (PRD §4.4/§8.5). */
export function getDeviceId(): Promise<string> {
  return getOrCreate(DEVICE_ID_KEY);
}

/**
 * Local guest "user id" scoping on-device data before sign-up.
 * On sign-up, data under this id is migrated to the real account id.
 */
export function getGuestUserId(): Promise<string> {
  return getOrCreate(GUEST_USER_ID_KEY);
}
