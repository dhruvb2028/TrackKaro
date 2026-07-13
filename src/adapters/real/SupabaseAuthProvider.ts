import { AuthProvider, AuthSession } from "../../ports/AuthProvider";
import { getSupabase } from "./supabaseClient";

/**
 * Real email+OTP auth via Supabase. signInWithOtp({ email }) sends a
 * one-time 6-digit code (and a magic link) using Supabase's built-in email
 * sending — no separate vendor account needed, unlike phone/SMS. Also
 * creates the account on first use (shouldCreateUser defaults to true),
 * so this one call covers both sign-in and sign-up.
 */
export class SupabaseAuthProvider implements AuthProvider {
  async sendOtp(email: string): Promise<void> {
    const { error } = await getSupabase().auth.signInWithOtp({ email });
    if (error) throw error;
  }

  async verifyOtp(email: string, code: string): Promise<AuthSession> {
    const { data, error } = await getSupabase().auth.verifyOtp({
      email,
      token: code,
      type: "email",
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
