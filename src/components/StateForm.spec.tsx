import { render, screen, userEvent, waitFor } from '@testing-library/react-native';
import { StateForm } from './StateForm';

const save = () => screen.getByRole('button', { name: 'Save' });

async function fill(abbreviation: string, name: string) {
  const user = userEvent.setup();
  await user.type(screen.getByLabelText('Abbreviation'), abbreviation);
  await user.type(screen.getByLabelText('Name'), name);
  return user;
}

describe('StateForm', () => {
  it('keeps Save disabled while the form is invalid', async () => {
    await render(<StateForm onSubmitState={jest.fn()} />);
    expect(save()).toBeDisabled();
  });

  it('enables Save when abbreviation and name are valid', async () => {
    await render(<StateForm onSubmitState={jest.fn()} />);
    await fill('SP', 'Sao Paulo');
    await waitFor(() => expect(save()).toBeEnabled());
  });

  it('upper-cases the abbreviation as the user types', async () => {
    await render(<StateForm onSubmitState={jest.fn()} />);
    await userEvent.setup().type(screen.getByLabelText('Abbreviation'), 'sp');
    expect(screen.getByLabelText('Abbreviation').props.value).toBe('SP');
  });

  it('limits the abbreviation to 2 characters and asks the keyboard for capitals', async () => {
    await render(<StateForm onSubmitState={jest.fn()} />);
    const input = screen.getByLabelText('Abbreviation');
    expect(input).toHaveProp('maxLength', 2);
    expect(input).toHaveProp('autoCapitalize', 'characters');
  });

  it('shows no error before a field has been touched', async () => {
    await render(<StateForm onSubmitState={jest.fn()} />);
    // skipBlur: by default `type` blurs the field when done, which would touch it.
    await userEvent.setup().type(screen.getByLabelText('Abbreviation'), 'S', { skipBlur: true });
    expect(screen.queryByText('Enter the state abbreviation with 2 letters.')).toBeNull();
  });

  it('flags the abbreviation once the field loses focus', async () => {
    const user = userEvent.setup();
    await render(<StateForm onSubmitState={jest.fn()} />);
    await user.type(screen.getByLabelText('Abbreviation'), 'S');
    await user.type(screen.getByLabelText('Name'), 'x');
    expect(
      await screen.findByText('Enter the state abbreviation with 2 letters.'),
    ).toBeOnTheScreen();
  });

  it('shows the min and max name messages', async () => {
    const user = userEvent.setup();
    await render(<StateForm onSubmitState={jest.fn()} />);
    const name = screen.getByLabelText('Name');
    await user.type(name, 'AB');
    await user.type(screen.getByLabelText('Abbreviation'), 'S');
    expect(
      await screen.findByText('Enter the state name with at least 3 characters.'),
    ).toBeOnTheScreen();

    await user.clear(name);
    await user.paste(name, 'A'.repeat(101));
    await user.type(screen.getByLabelText('Abbreviation'), 'P');
    expect(
      await screen.findByText('Enter the state name with at most 100 characters.'),
    ).toBeOnTheScreen();
  });

  it('rejects an abbreviation that already exists', async () => {
    const user = userEvent.setup();
    await render(<StateForm existingAbbreviations={['SP']} onSubmitState={jest.fn()} />);
    await user.type(screen.getByLabelText('Abbreviation'), 'SP');
    await user.type(screen.getByLabelText('Name'), 'Another');
    expect(
      await screen.findByText('A state with this abbreviation already exists.'),
    ).toBeOnTheScreen();
    expect(save()).toBeDisabled();
  });

  it('prefills initial values and keeps Save disabled until something changes', async () => {
    const user = userEvent.setup();
    await render(
      <StateForm
        initialValues={{ abbreviation: 'SP', name: 'Sao Paulo' }}
        existingAbbreviations={['SP']}
        onSubmitState={jest.fn()}
      />,
    );
    expect(screen.getByLabelText('Abbreviation').props.value).toBe('SP');
    expect(screen.getByLabelText('Name').props.value).toBe('Sao Paulo');
    expect(save()).toBeDisabled();

    await user.type(screen.getByLabelText('Name'), '!');
    await waitFor(() => expect(save()).toBeEnabled());
  });

  it('is disabled while the parent says a request is in flight', async () => {
    await render(<StateForm disabled onSubmitState={jest.fn()} />);
    await fill('SP', 'Sao Paulo');
    expect(save()).toBeDisabled();
  });

  it('submits the trimmed, normalised values', async () => {
    const onSubmitState = jest.fn();
    await render(<StateForm onSubmitState={onSubmitState} />);
    const user = await fill('sp', '  Sao Paulo  ');
    await waitFor(() => expect(save()).toBeEnabled());
    await user.press(save());
    await waitFor(() =>
      expect(onSubmitState).toHaveBeenCalledWith({ abbreviation: 'SP', name: 'Sao Paulo' }),
    );
  });
});
