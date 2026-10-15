import { closeScreen } from './navigation';

describe('closeScreen', () => {
  it('goes back when there is history to go back to', () => {
    const router = { canGoBack: () => true, back: jest.fn(), replace: jest.fn() };
    closeScreen(router);
    expect(router.back).toHaveBeenCalledTimes(1);
    expect(router.replace).not.toHaveBeenCalled();
  });

  it('lands on the list when the screen was opened cold (deep link, restored state)', () => {
    const router = { canGoBack: () => false, back: jest.fn(), replace: jest.fn() };
    closeScreen(router);
    expect(router.replace).toHaveBeenCalledWith('/');
    expect(router.back).not.toHaveBeenCalled();
  });
});
