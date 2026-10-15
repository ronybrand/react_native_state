interface CloseableRouter {
  canGoBack: () => boolean;
  back: () => void;
  replace: (href: '/') => void;
}

// A form screen closes by popping off the stack (so the user lands exactly where
// they came from, with the native back animation). Opened cold - a deep link or
// restored navigation state - there is nothing to pop, and back() would do
// nothing at all, so land on the list instead.
export function closeScreen(router: CloseableRouter): void {
  if (router.canGoBack()) {
    router.back();
  } else {
    router.replace('/');
  }
}
