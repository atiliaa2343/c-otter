import { Alert, Platform, Share } from 'react-native';

// React Native Web's Alert.alert is a no-op, and the admin panel is mostly
// used in a browser — so these fall back to the browser's own dialogs there.

export function notify(title: string, message: string): void {
  if (Platform.OS === 'web') {
    window.alert(`${title}\n\n${message}`);
  } else {
    Alert.alert(title, message);
  }
}

/** Resolves true if the admin confirms. */
export function confirmAction(
  title: string,
  message: string,
  confirmLabel: string,
  destructive = false,
): Promise<boolean> {
  if (Platform.OS === 'web') {
    return Promise.resolve(window.confirm(`${title}\n\n${message}`));
  }
  return new Promise((resolve) => {
    Alert.alert(title, message, [
      { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
      {
        text: confirmLabel,
        style: destructive ? 'destructive' : 'default',
        onPress: () => resolve(true),
      },
    ]);
  });
}

/**
 * Copies to the clipboard on web. On a phone it opens the share sheet
 * instead (which has Copy), so this doesn't need a native clipboard module
 * and a rebuild of the app.
 */
export async function copyText(text: string, what: string): Promise<void> {
  if (Platform.OS === 'web') {
    try {
      await navigator.clipboard.writeText(text);
      notify('Copied', `${what} copied to the clipboard.`);
    } catch {
      window.prompt(`Copy the ${what.toLowerCase()} below:`, text);
    }
    return;
  }
  await Share.share({ message: text });
}

export function errorMessage(err: unknown): string {
  const message = (err as { message?: string } | null)?.message;
  return (
    message ??
    "The database rejected this change. If you're not signed in as an admin, RLS blocks it."
  );
}
