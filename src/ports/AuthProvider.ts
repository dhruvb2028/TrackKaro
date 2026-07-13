export interface AuthSession {
  userId: string;
  accessToken: string;
  refreshToken: string;
}

export interface AuthProvider {
  sendOtp(email: string): Promise<void>;
  verifyOtp(email: string, code: string): Promise<AuthSession>;
  refreshToken(refreshToken: string): Promise<AuthSession>;
  revokeSession(userId: string): Promise<void>;
  /** The signed-in user's id, or null if there's no active session (e.g. a guest). */
  getCurrentUserId(): Promise<string | null>;
}
