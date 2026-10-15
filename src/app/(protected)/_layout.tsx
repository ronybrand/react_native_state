import { Redirect, Stack } from 'expo-router';
import { useAuth } from '@/auth/AuthProvider';
import { LoadingIndicator } from '@/components/LoadingIndicator';
import { stackScreenOptions } from '@/theme/navigation';

// Only the mutating screens require a session, matching the backend's
// "reads are public" rule - the list stays outside this group. Guards run on the
// client only, so they are a UX hint: the backend authorizes every request.
export default function ProtectedLayout() {
  const { status } = useAuth();

  // Not judged yet: redirecting now would bounce a logged-in user to /login on
  // every cold start while the keychain is still being read.
  if (status === 'loading') {
    return <LoadingIndicator />;
  }

  if (status === 'unauthenticated') {
    return <Redirect href="/login" />;
  }

  return (
    <Stack screenOptions={stackScreenOptions}>
      {/* Empty header title: each screen already renders its own heading, and
          repeating it in the native header would show it twice. */}
      <Stack.Screen name="state/new" options={{ title: '' }} />
      <Stack.Screen name="state/[id]/edit" options={{ title: '' }} />
    </Stack>
  );
}
