import '@testing-library/react-native/matchers';

// In-memory stand-in for the native keychain (see __mocks__/expo-secure-store.ts),
// applied to every spec. Specs that need a clean slate call `__resetSecureStore()`.
jest.mock('expo-secure-store');

// expo-router is replaced by __mocks__/expo-router.tsx, which records navigation.
jest.mock('expo-router');

// jest-expo auto-mocks native modules, which leaves expo-crypto's randomUUID
// returning undefined. Node's implementation is a faithful stand-in.
jest.mock('expo-crypto', () => ({
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- must be required lazily inside the factory
  randomUUID: () => require('node:crypto').randomUUID(),
}));

// The library ships an official Jest mock (fixed insets, no native provider needed).
jest.mock(
  'react-native-safe-area-context',
  () =>
    // eslint-disable-next-line @typescript-eslint/no-require-imports -- must be required lazily inside the factory
    require('react-native-safe-area-context/jest/mock').default,
);
