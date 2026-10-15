import { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { AppButton } from './AppButton';
import { TextField } from './TextField';
import { createNewStateSchema, type NewState } from '@/interfaces/state';
import { spacing } from '@/theme/colors';

interface StateFormProps {
  initialValues?: NewState;
  disabled?: boolean;
  existingAbbreviations?: string[];
  onSubmitState: (state: NewState) => void;
}

const EMPTY: NewState = { abbreviation: '', name: '' };

export function StateForm({
  initialValues,
  disabled = false,
  existingAbbreviations,
  onSubmitState,
}: StateFormProps) {
  const schema = useMemo(
    () => createNewStateSchema(existingAbbreviations, initialValues?.abbreviation),
    [existingAbbreviations, initialValues?.abbreviation],
  );

  const {
    control,
    handleSubmit,
    formState: { errors, isValid, isDirty },
  } = useForm<NewState>({
    // Errors appear once a field has been left, then follow every keystroke.
    mode: 'onTouched',
    resolver: zodResolver(schema),
    defaultValues: EMPTY,
    // The edit screen loads the state asynchronously: `values` re-syncs the form.
    values: initialValues,
  });

  return (
    <View style={styles.form}>
      <Controller
        control={control}
        name="abbreviation"
        render={({ field }) => (
          <TextField
            label="Abbreviation"
            value={field.value}
            onChangeText={(text) => field.onChange(text.toUpperCase())}
            onBlur={field.onBlur}
            error={errors.abbreviation?.message}
            maxLength={2}
            autoCapitalize="characters"
            autoCorrect={false}
          />
        )}
      />
      <Controller
        control={control}
        name="name"
        render={({ field }) => (
          <TextField
            label="Name"
            value={field.value}
            onChangeText={field.onChange}
            onBlur={field.onBlur}
            error={errors.name?.message}
            placeholder="Enter the state name..."
            autoCapitalize="words"
            returnKeyType="done"
          />
        )}
      />
      <AppButton
        label="Save"
        // Wrapped: handleSubmit also passes the form event, which the parent should not see.
        onPress={handleSubmit((values) => onSubmitState(values))}
        disabled={!isValid || disabled || !isDirty}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  form: { gap: spacing.lg },
});
