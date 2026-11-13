export const CHAT_LIMITS = {
  bodyBytes: 128 * 1024,
  messages: 40,
  userCharacters: 8_000,
  totalCharacters: 48_000,
  contextCharacters: 160_000,
  outputTokens: 16_000,
  durationMs: 180_000,
  bodyDurationMs: 20_000,
  requestsPerMinute: 20,
  concurrentPerUser: 2,
  concurrentPerProcess: 20,
} as const;
