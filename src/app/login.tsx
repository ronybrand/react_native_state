import { useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { AppButton } from '@/components/AppButton';
import { FormScreen } from '@/components/FormScreen';
import { TextField } from '@/components/TextField';
import { useAuth } from '@/auth/AuthProvider';
import { useErrorMessage } from '@/hooks/useErrorMessage';
import { extractRequestId } from '@/lib/extractRequestId';
import { colors, spacing } from '@/theme/colors';

export default function LoginScreen() {
  const { signIn } = useAuth();
  const { error, requestId, setError } = useErrorMessage();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  // `submitting` only updates on the next render, so a second tap landing before
  // it would still see false - this ref is set synchronously and closes the gap.
  const inFlight = useRef(false);

  async function handleLogin() {
    if (inFlight.current) {
      return;
    }
    inFlight.current = true;
    setSubmitting(true);
    try {
      await signIn({ username, password });
      router.replace('/');
    } catch (err) {
      inFlight.current = false;
      setSubmitting(false);
      setError('Invalid username or password.', extractRequestId(err));
    }
  }

  return (
    <FormScreen title="Login" error={error} requestId={requestId}>
      <View style={styles.form}>
        <TextField
          label="Username"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="username"
          textContentType="username"
          returnKeyType="next"
        />
        <TextField
          label="Password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="current-password"
          textContentType="password"
          returnKeyType="done"
          onSubmitEditing={handleLogin}
        />
        <AppButton
          label="Log in"
          onPress={handleLogin}
          disabled={!username || !password}
          loading={submitting}
        />
      </View>
      <Text style={styles.demo} testID="demo-credentials">
        Demo credentials (intentionally public): admin / Estado-Demo-2026
      </Text>
    </FormScreen>
  );
}

const styles = StyleSheet.create({
  form: { gap: spacing.lg },
  demo: { marginTop: spacing.lg, fontSize: 13, color: colors.muted },
});
