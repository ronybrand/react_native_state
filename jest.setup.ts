// In-memory stand-in for the native keychain (see __mocks__/expo-secure-store.ts),
// applied to every spec. Specs that need a clean slate call `__resetSecureStore()`.
jest.mock('expo-secure-store');

// jest-expo auto-mocks native modules, which leaves expo-crypto's randomUUID
// returning undefined. Node's implementation is a faithful stand-in.
jest.mock('expo-crypto', () => ({
  randomUUID: () => require('node:crypto').randomUUID(),
}));
