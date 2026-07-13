import * as Crypto from "expo-crypto";
import { AuthProvider, AuthSession } from "../../ports/AuthProvider";

/**
 * Local stand-in for a real OTP vendor (MSG91/Twilio/Firebase Auth, etc).
 * The OTP is fixed and logged instead of sent over SMS, so the rest of the
 * app can be built without a live vendor account. Swap for a real
 * AuthProvider implementation later without touching any calling code.
 */
export class MockAuthProvider implements AuthProvider {
  private static readonly FIXED_OTP = "000000";
  private pendingPhones = new Set<string>();

  async sendOtp(phoneNumber: string): Promise<void> {
    this.pendingPhones.add(phoneNumber);
    console.log(`[MockAuthProvider] OTP for ${phoneNumber}: ${MockAuthProvider.FIXED_OTP}`);
  }

  async verifyOtp(phoneNumber: string, code: string): Promise<AuthSession> {
    if (!this.pendingPhones.has(phoneNumber)) {
      throw new Error("No OTP was requested for this phone number.");
    }
    if (code !== MockAuthProvider.FIXED_OTP) {
      throw new Error("Incorrect code.");
    }
    this.pendingPhones.delete(phoneNumber);
    const userId = await hash(phoneNumber);
    return {
      userId,
      accessToken: await randomToken(),
      refreshToken: await randomToken(),
    };
  }

  async refreshToken(refreshToken: string): Promise<AuthSession> {
    return {
      userId: await hash(refreshToken),
      accessToken: await randomToken(),
      refreshToken: await randomToken(),
    };
  }

  async revokeSession(_userId: string): Promise<void> {
    // No server-side session to revoke yet; a real adapter would invalidate refresh tokens here.
  }

  async getCurrentUserId(): Promise<string | null> {
    // The mock never persists a session — "signed up" locally is tracked
    // separately by prefs.isSignedUp() purely for UI, and guests always
    // keep using their device id (see identity.ts / migrateGuestData.ts).
    return null;
  }
}

async function hash(value: string): Promise<string> {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, value);
}

async function randomToken(): Promise<string> {
  const bytes = await Crypto.getRandomBytesAsync(32);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
