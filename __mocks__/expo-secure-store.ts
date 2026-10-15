// Jest picks this up automatically for `jest.mock('expo-secure-store')`.
// The real module needs the native keychain/keystore, which jsdom-less Jest
// (jest-expo) does not have.
let store = new Map<string, string>();

export const getItemAsync = jest.fn(async (key: string) => store.get(key) ?? null);
export const setItemAsync = jest.fn(async (key: string, value: string) => {
  store.set(key, value);
});
export const deleteItemAsync = jest.fn(async (key: string) => {
  store.delete(key);
});

export function __resetSecureStore() {
  store = new Map();
  getItemAsync.mockClear();
  setItemAsync.mockClear();
  deleteItemAsync.mockClear();
}
