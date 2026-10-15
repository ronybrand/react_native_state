// In-memory stand-in for the native keychain (see __mocks__/expo-secure-store.ts),
// applied to every spec. Specs that need a clean slate call `__resetSecureStore()`.
jest.mock('expo-secure-store');
