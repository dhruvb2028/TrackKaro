export interface RateLimiter {
  /** Returns true if the action is allowed and records the attempt; false if the identity is over its limit. */
  tryConsume(identityKey: string, action: string): Promise<boolean>;
}
