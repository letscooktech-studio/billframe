/**
 * CROSS-PLATFORM ALERT UTILITY
 * Native: Uses React Native Alert.alert modal
 * Web: Uses window.alert for single-button/info alerts and window.confirm for decision/confirmation alerts
 * Prevents silent failures on web where react-native-web's Alert.alert is an empty function.
 */

import { Alert, Platform } from 'react-native';

export interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

export function showAlert(
  title: string,
  message?: string,
  buttons?: AlertButton[]
): void {
  if (Platform.OS === 'web') {
    const fullMessage = message ? `${title}\n\n${message}` : title;

    if (!buttons || buttons.length <= 1) {
      if (typeof window !== 'undefined') {
        window.alert(fullMessage);
      }
      if (buttons && buttons[0]?.onPress) {
        buttons[0].onPress();
      }
      return;
    }

    // Multiple buttons — typically Cancel vs Confirm
    const cancelButton = buttons.find((b) => b.style === 'cancel');
    const confirmButton = buttons.find((b) => b.style !== 'cancel') || buttons[buttons.length - 1];

    if (typeof window !== 'undefined') {
      const confirmed = window.confirm(fullMessage);
      if (confirmed) {
        confirmButton?.onPress?.();
      } else {
        cancelButton?.onPress?.();
      }
    }
    return;
  }

  Alert.alert(title, message, buttons);
}
