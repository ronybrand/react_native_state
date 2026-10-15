// Picked up automatically for every spec (a root-level mock of a node module).
// Real navigation needs a native navigator, so specs assert on `router` calls
// instead - the same observable contract the screens have with Expo Router.
import { Pressable, Text } from 'react-native';
import type { ReactNode } from 'react';

export const router = {
  push: jest.fn(),
  replace: jest.fn(),
  back: jest.fn(),
};

export const useRouter = () => router;
export const useLocalSearchParams = jest.fn(() => ({}));

export function __resetRouter() {
  router.push.mockClear();
  router.replace.mockClear();
  router.back.mockClear();
  useLocalSearchParams.mockReset();
  useLocalSearchParams.mockReturnValue({});
}

// Renders its destination so a spec can see that a guard redirected.
export function Redirect({ href }: { href: string }) {
  return <Text testID="redirect">{href}</Text>;
}

export function Link({
  href,
  children,
  ...rest
}: {
  href: string;
  children: ReactNode;
  accessibilityLabel?: string;
}) {
  return (
    <Pressable accessibilityRole="link" onPress={() => router.push(href)} {...rest}>
      {children}
    </Pressable>
  );
}

export function Slot() {
  return <Text testID="slot">slot</Text>;
}

function StackComponent({ children }: { children?: ReactNode }) {
  return <>{children}</>;
}
StackComponent.Screen = function Screen(_props: { name?: string; options?: unknown }) {
  return null;
};
export const Stack = StackComponent;
