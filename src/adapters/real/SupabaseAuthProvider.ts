import { AuthProvider, AuthSession } from "../../ports/AuthProvider";
import { getSupabase } from "./supabaseClient";

/**
 * Real phone+OTP auth via Supabase. Requires an SMS provider (Twilio,
 * MessageBird, etc.) configured under Authentication > Providers > Phone
 * in the Supabase dashboard — Supabase does not send SMS itself.
 */
export class SupabaseAuthProvider implements AuthProvider {
  async sendOtp(phoneNumber: string): Promise<void> {
    const { error } = await getSupabase().auth.signInWithOtp({ phone: phoneNumber });
    if (error) throw error;
  }

  async verifyOtp(phoneNumber: string, code: string): Promise<AuthSession> {
    const { data, error } = await getSupabase().auth.verifyOtp({
      phone: phoneNumber,
      token: code,
      type: "sms",
    });
    if (error) throw error;
    if (!data.session || !data.user) throw new Error("Verification did not return a session.");
    return {
      userId: data.user.id,
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
    };
  }

  async refreshToken(refreshToken: string): Promise<AuthSession> {
    const { data, error } = await getSupabase().auth.refreshSession({ refresh_token: refreshToken });
    if (error) throw error;
    if (!data.session || !data.user) throw new Error("Refresh did not return a session.");
    return {
      userId: data.user.id,
      accessToken: data.session.access_token,
      refreshToken: data.session.refresh_token,
    };
  }

  async revokeSession(_userId: string): Promise<void> {
    const { error } = await getSupabase().auth.signOut();
    if (error) throw error;
  }

  async getCurrentUserId(): Promise<string | null> {
    const { data } = await getSupabase().auth.getSession();
    return data.session?.user.id ?? null;
  }
}
