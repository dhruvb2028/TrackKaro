export interface AuthSession {
  userId: string;
  accessToken: string;
  refreshToken: string;
}

export interface AuthProvider {
  sendOtp(phoneNumber: string): Promise<void>;
  verifyOtp(phoneNumber: string, code: string): Promise<AuthSession>;
  refreshToken(refreshToken: string): Promise<AuthSession>;
  revokeSession(userId: string): Promise<void>;
}
